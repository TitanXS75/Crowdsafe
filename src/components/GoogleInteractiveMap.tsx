import { useEffect, useRef, useState } from "react";
import { GoogleMapWrapper } from "./GoogleMapWrapper";
import { useGoogleMap } from "@/hooks/useGoogleMap"; // We might reuse or adapt this hooks

interface GoogleInteractiveMapProps {
    config: {
        center: [number, number]; // [lat, lng]
        zoom: number;
        boundaries: [number, number][]; // Polygon coords
        restrictedZones: [number, number][]; // Markers
        routes?: any[];
    };
    facilities?: any[];
    routes?: any[];
    selectedRouteId?: string;
    onRouteSelect?: (routeId: string) => void;
    onNavigate?: (location: [number, number]) => void;
    onMapClick?: (latlng: [number, number]) => void;
    customMarkers?: { start?: [number, number], end?: [number, number] };
    userLocation?: [number, number] | null;
    apiKey: string;
}

const MapContent = (props: Omit<GoogleInteractiveMapProps, 'apiKey'>) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
    const [boundaryPolygons, setBoundaryPolygons] = useState<google.maps.Polygon[]>([]);
    const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || map) return;

        const initialCenter = props.config?.center
            ? { lat: props.config.center[0], lng: props.config.center[1] }
            : { lat: 28.6139, lng: 77.2090 };

        const newMap = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: props.config?.zoom || 15,
            mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement if we used it, but standard Markers are fine
            mapTypeControl: false,
            streetViewControl: false,
        });

        setMap(newMap);
        setInfoWindow(new google.maps.InfoWindow());

    }, [mapRef]);

    // Update View on Config Change
    useEffect(() => {
        if (!map || !props.config?.center) return;
        const center = { lat: props.config.center[0], lng: props.config.center[1] };
        map.setCenter(center);
        map.setZoom(props.config.zoom || 15);
    }, [map, props.config?.center, props.config?.zoom]);

    // Handle Map Clicks
    useEffect(() => {
        if (!map || !props.onMapClick) return;

        const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                props.onMapClick!([e.latLng.lat(), e.latLng.lng()]);
            }
        });

        return () => google.maps.event.removeListener(listener);
    }, [map, props.onMapClick]);


    // Render Boundaries
    useEffect(() => {
        if (!map) return;

        // Clear old
        boundaryPolygons.forEach(p => p.setMap(null));
        setBoundaryPolygons([]);

        if (!props.config.boundaries || props.config.boundaries.length === 0) return;

        // Handle various storage formats:
        // 1. Single Polygon (legacy): [[lat,lng], [lat,lng]] -> Array of Coords
        // 2. Multi Polygon (legacy): [[[lat,lng]], [[lat,lng]]] -> Array of Arrays of Coords
        // 3. Multi Polygon (new Wrapper): [{ path: [[lat,lng]] }] -> Array of Objects with path

        const rawBoundaries = props.config.boundaries;
        let polygonsToRender: any[] = []; // List of paths

        if (rawBoundaries.length > 0) {
            const firstItem = rawBoundaries[0];

            // Check for Wrapper Object { path: ... }
            if (firstItem && typeof firstItem === 'object' && 'path' in firstItem) {
                polygonsToRender = rawBoundaries.map((b: any) => b.path);
            }
            // Check for Single Polygon (first item is number or simple coord object)
            else if (firstItem && (typeof firstItem[0] === 'number' || 'lat' in firstItem)) {
                polygonsToRender = [rawBoundaries];
            }
            // Check for Multi Polygon Array (first item is array of coords)
            else if (Array.isArray(firstItem)) {
                polygonsToRender = rawBoundaries;
            }
        }

        const newPolygons = polygonsToRender.map((pathCoords: any[]) => {
            // Ensure path is {lat, lng} objects
            const path = pathCoords.map(c => {
                if (Array.isArray(c)) return { lat: c[0], lng: c[1] };
                return c; // assume {lat, lng}
            });

            return new google.maps.Polygon({
                paths: path,
                strokeColor: "#0066cc",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#0088ff",
                fillOpacity: 0.25,
                map: map,
                clickable: false // Boundaries usually static background
            });
        });

        setBoundaryPolygons(newPolygons);
    }, [map, props.config.boundaries]);


    // Render Facilities (Markers)
    useEffect(() => {
        if (!map || !infoWindow) return;

        // Clear old standard markers if we tracked them broadly. 
        // For efficiency, let's clear markers tracked in 'markers' state.
        // NOTE: This simple clear/redraw might flicker but is robust.
        markers.forEach(m => m.setMap(null));
        setMarkers([]);

        const newMarkers: google.maps.Marker[] = [];

        // 1. Facilities
        props.facilities?.forEach(fac => {
            const position = Array.isArray(fac.location)
                ? { lat: fac.location[0], lng: fac.location[1] }
                : fac.location;

            if (!position) return;

            const marker = new google.maps.Marker({
                position,
                map,
                label: {
                    text: fac.icon || "📍",
                    fontSize: "20px",
                },
                title: fac.name
            });

            marker.addListener("click", () => {
                const content = `
                    <div style="padding: 8px; min-width: 150px;">
                        <h3 style="margin: 0 0 4px 0; font-size: 16px;">${fac.icon || ""} ${fac.name}</h3>
                        <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">${fac.type}</div>
                        ${fac.description ? `<p style="font-size: 13px; margin: 0 0 8px 0;">${fac.description}</p>` : ""}
                        <button id="nav-btn-${fac.id}" style="width: 100%; padding: 6px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Navigate Here
                        </button>
                    </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(map, marker);

                // Add listener to the button inside infoWindow after it opens
                // Note: This is tricky in vanilla JS strings. A better way is using OverlayView or standard React Portal, 
                // but standard InfoWindow is simple. We can delegate event or check DOM.
                setTimeout(() => {
                    const btn = document.getElementById(`nav-btn-${fac.id}`);
                    if (btn) {
                        btn.onclick = () => {
                            props.onNavigate?.([position.lat, position.lng]);
                            infoWindow.close();
                        };
                    }
                }, 100);
            });

            newMarkers.push(marker);
        });

        // 2. Custom Start/End
        if (props.customMarkers?.start) {
            const m = new google.maps.Marker({
                position: { lat: props.customMarkers.start[0], lng: props.customMarkers.start[1] },
                map,
                label: { text: "🟢", fontSize: "20px" },
                zIndex: 1000
            });
            newMarkers.push(m);
        }
        if (props.customMarkers?.end) {
            const m = new google.maps.Marker({
                position: { lat: props.customMarkers.end[0], lng: props.customMarkers.end[1] },
                map,
                label: { text: "🏁", fontSize: "20px" },
                zIndex: 1000
            });
            newMarkers.push(m);
        }

        // 3. User Location (Live)
        if (props.userLocation) {
            const m = new google.maps.Marker({
                position: { lat: props.userLocation[0], lng: props.userLocation[1] },
                map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
                title: "You are here",
                zIndex: 2000 // Topmost
            });
            // Add pulse effect circle (optional, simplified here)
            newMarkers.push(m);
        }

        setMarkers(newMarkers);
    }, [map, props.facilities, props.customMarkers, props.userLocation, infoWindow]); // config.restrictedZones could also be added


    // Render Routes
    useEffect(() => {
        if (!map) return;

        polylines.forEach(p => p.setMap(null));
        setPolylines([]);

        if (!props.routes) return;

        const newPolylines = props.routes.map(route => {
            // Support both standard GeoJSON-like generic geometry [[lat,lng]] or Google LatLng objects if mixed
            const path = route.geometry.map((p: any) => ({ lat: p[0], lng: p[1] }));
            const isSelected = route.id === props.selectedRouteId;

            // Color based on safety/crowd
            const colorMap: any = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
            const baseColor = colorMap[route.safety?.color] || "#2563eb";

            // Visual Logic:
            // Selected: Bold, Opaque, Colored
            // Unselected: Thin, Transparent, Gray
            const strokeColor = isSelected ? baseColor : "#9ca3af"; // Gray-400 for unselected
            const strokeOpacity = isSelected ? 1.0 : 0.6;
            const strokeWeight = isSelected ? 8 : 5;
            const zIndex = isSelected ? 100 : 1;

            const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: strokeColor,
                strokeOpacity: strokeOpacity,
                strokeWeight: strokeWeight,
                map,
                zIndex: zIndex
            });

            polyline.addListener("click", () => {
                props.onRouteSelect?.(route.id);

                if (infoWindow) {
                    // Update content content to show selection status
                    const statusHtml = isSelected
                        ? `<span style="color:${baseColor}; font-weight:bold;">SELECTED</span>`
                        : `<span style="color:gray; font-style:italic;">Tap to Select</span>`;

                    infoWindow.setContent(`
                        <div style="padding: 8px; font-family: sans-serif;">
                            <div style="margin-bottom:4px; font-size:14px;"><strong>Route Option</strong></div>
                            <div style="margin-bottom:8px;">${statusHtml}</div>
                            
                            <div style="font-size:13px; line-height:1.4;">
                                <div>Crowd: <span style="font-weight:bold; color:${baseColor}">${route.safety?.label || 'Calculating...'}</span></div>
                                <div>Time: <strong>${route.duration} min</strong></div>
                                <div>Distance: ${route.distance}m</div>
                            </div>
                        </div>
                    `);

                    // Open at midpoint
                    const midIndex = Math.floor(path.length / 2);
                    infoWindow.setPosition(path[midIndex]);
                    infoWindow.open(map);
                }
            });

            return polyline;
        });

        setPolylines(newPolylines);

    }, [map, props.routes, props.selectedRouteId]);

    return <div ref={mapRef} className="h-full w-full" />;
};

export const GoogleInteractiveMap = (props: GoogleInteractiveMapProps) => {
    return (
        <GoogleMapWrapper apiKey={props.apiKey}>
            <MapContent {...props} />
        </GoogleMapWrapper>
    );
};
