import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InteractiveMapProps {
    config: {
        center: [number, number];
        zoom: number;
        boundaries: [number, number][];
        restrictedZones: [number, number][];
        routes?: any[];
    };
    facilities?: any[]; // EventPOI[]
    routes?: any[];
    selectedRouteId?: string;
    onRouteSelect?: (routeId: string) => void;
    onNavigate?: (location: [number, number]) => void;
}

// Helper to update map view when config changes
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Helper to capture map clicks
const MapEventController = ({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) => {
    const map = useMap();
    useEffect(() => {
        if (!onMapClick) return;

        map.on('click', (e) => {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        });

        return () => {
            map.off('click');
        };
    }, [map, onMapClick]);
    return null;
};

const InteractiveMap = ({ config, facilities, routes, selectedRouteId, onRouteSelect, onNavigate, onMapClick, customMarkers }: InteractiveMapProps & { onMapClick?: (latlng: [number, number]) => void, customMarkers?: { start?: [number, number], end?: [number, number] } }) => {
    // Default to London if no center
    const center = config?.center || [51.505, -0.09];
    const zoom = config?.zoom || 13;

    if (!config) return <div className="p-4 text-center">No map configuration available</div>;

    return (
        <div className="h-full w-full">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MapUpdater center={center} zoom={zoom} />
                {onMapClick && <MapEventController onMapClick={onMapClick} />}

                {/* Draw Boundaries */}
                {config.boundaries && config.boundaries.length > 0 && (
                    <Polygon
                        positions={config.boundaries}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                )}

                {/* Draw Restricted Zones */}
                {config.restrictedZones && config.restrictedZones.map((pos, idx) => (
                    <Marker key={`zone-${idx}`} position={pos}>
                        <Popup>Restricted Zone</Popup>
                    </Marker>
                ))}

                {/* Draw Facilities / POIs */}
                {facilities && facilities.map((poi) => {
                    // Create custom icon for the POI
                    const emojiIcon = L.divIcon({
                        className: 'custom-poi-marker',
                        html: `<div style="font-size: 24px; text-shadow: 0 0 3px white;">${poi.icon || '📍'}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });

                    // Ensure safe location (legacy data might be missing it)
                    if (!poi.location) return null;
                    // Handle object location if necessary (though interface says array now)
                    const loc: [number, number] = Array.isArray(poi.location)
                        ? poi.location
                        : [(poi.location as any).lat, (poi.location as any).lng];

                    return (
                        <Marker key={poi.id} position={loc} icon={emojiIcon}>
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <div className="font-bold text-base flex items-center gap-2">
                                        <span>{poi.icon}</span> {poi.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{poi.type}</div>
                                    {poi.description && <div className="text-sm mb-2">{poi.description}</div>}
                                    <button
                                        className="w-full mt-2 bg-primary text-primary-foreground text-xs py-1.5 px-3 rounded hover:bg-primary/90 transition-colors font-medium"
                                        onClick={() => onNavigate && onNavigate(loc)}
                                    >
                                        Navigate Here
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Custom Start/End Markers */}
                {customMarkers?.start && (
                    <Marker position={customMarkers.start} icon={L.divIcon({
                        className: 'custom-start-marker',
                        html: `<div style="font-size: 24px;">🟢</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })}>
                        <Popup>Start Point</Popup>
                    </Marker>
                )}
                {customMarkers?.end && (
                    <Marker position={customMarkers.end} icon={L.divIcon({
                        className: 'custom-end-marker',
                        html: `<div style="font-size: 24px;">🏁</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}

                {/* Draw Routes */}
                {routes && routes.map((route) => {
                    const isSelected = route.id === selectedRouteId;
                    const opacity = selectedRouteId ? (isSelected ? 1 : 0.2) : 0.8;
                    const weight = isSelected ? 6 : 4;

                    return (
                        <Polyline
                            key={route.id}
                            positions={route.geometry}
                            pathOptions={{
                                color: route.safety.color,
                                weight: weight,
                                opacity: opacity
                            }}
                            eventHandlers={{
                                click: () => onRouteSelect && onRouteSelect(route.id)
                            }}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-bold mb-1">Route Option</div>
                                    <div>Safety: <span style={{ color: route.safety.color, fontWeight: 'bold' }}>{route.safety.label}</span></div>
                                    <div>ETA: {route.duration} mins</div>
                                    <div>Distance: {route.distance}m</div>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;
