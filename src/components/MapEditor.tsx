import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    MousePointer2,
    Map as MapIcon,
    MapPin,
    PenTool,
    Trash2,
    Check
} from "lucide-react";

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapEditorProps {
    onConfigChange: (config: any, facilities: any[]) => void;
    initialConfig?: any;
    initialFacilities?: any[];
}

const MapController = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
    const map = useMap();
    useEffect(() => {
        onMapReady(map);
    }, [map, onMapReady]);
    return null;
};

const MapEditor = ({ onConfigChange, initialConfig, initialFacilities }: MapEditorProps) => {
    const [map, setMap] = useState<L.Map | null>(null);
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const hasInitializedRef = useRef(false);

    // Tools State
    const [activeTool, setActiveTool] = useState<'none' | 'boundary' | 'marker' | 'edit' | 'delete'>('none');
    const drawHandlerRef = useRef<any>(null); // L.Draw.Polygon | L.Draw.Marker etc
    const editHandlerRef = useRef<any>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLayer, setCurrentLayer] = useState<L.Layer | null>(null);
    const [markerData, setMarkerData] = useState({
        name: '',
        emoji: '📍',
        type: 'info',
        description: ''
    });

    // Reset initialized flag when we switch to editing a different event
    useEffect(() => {
        hasInitializedRef.current = false;
    }, [initialConfig, initialFacilities]);

    // Manual location request function
    const requestUserLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setIsRequestingLocation(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location: [number, number] = [position.coords.latitude, position.coords.longitude];
                setUserLocation(location);
                setIsRequestingLocation(false);

                // Pan map to user location if map exists
                if (map) {
                    map.setView(location, 15, { animate: true });
                }
            },
            (error) => {
                let errorMessage = 'Unable to get your location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please allow location access in your browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }

                setLocationError(errorMessage);
                setIsRequestingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Initialize map with existing data
    useEffect(() => {
        console.log("🗺️ MapEditor: Initialization useEffect triggered");
        console.log("Map exists?", !!map);
        console.log("FeatureGroup exists?", !!featureGroupRef.current);
        console.log("initialConfig:", initialConfig);
        console.log("initialFacilities:", initialFacilities);

        if (!map || !featureGroupRef.current) {
            console.log("⚠️ MapEditor: Skipping - map or featureGroup not ready");
            return;
        }

        const fg = featureGroupRef.current;
        console.log("🧹 Clearing existing layers...");
        fg.clearLayers();

        // 1. Restore Boundaries (Polygons)
        // boundaries is an array containing arrays of [lat, lng] pairs for each polygon
        if (initialConfig?.boundaries && initialConfig.boundaries.length > 0) {
            console.log("📐 Restoring boundaries:", initialConfig.boundaries.length, "polygons");
            // Check if boundaries is a flat array of coordinates (single polygon) or array of polygons
            const firstItem = initialConfig.boundaries[0];
            if (Array.isArray(firstItem) && typeof firstItem[0] === 'number') {
                // It's a flat array - treat as single polygon
                console.log("➡️ Single polygon detected");
                const poly = L.polygon(initialConfig.boundaries, { color: 'blue', fillOpacity: 0.2 });
                // @ts-ignore
                poly.feature = { properties: { type: 'boundary' } };
                fg.addLayer(poly);
                console.log("✅ Added boundary polygon");
            } else {
                // It's an array of polygons
                console.log("➡️ Multiple polygons detected");
                initialConfig.boundaries.forEach((latlngs: any, index: number) => {
                    const poly = L.polygon(latlngs, { color: 'blue', fillOpacity: 0.2 });
                    // @ts-ignore
                    poly.feature = { properties: { type: 'boundary' } };
                    fg.addLayer(poly);
                    console.log(`✅ Added polygon ${index + 1}`);
                });
            }
        } else {
            console.log("ℹ️ No boundaries to restore");
        }

        // 2. Restore Facilities (Markers)
        if (initialFacilities) {
            console.log("📍 Restoring facilities:", initialFacilities.length, "markers");
            initialFacilities.forEach((fac: any, index: number) => {
                console.log(`Facility ${index + 1}:`, fac);
                const emojiIcon = L.divIcon({
                    className: 'custom-poi-marker',
                    html: `<div style="font-size: 24px; text-shadow: 0 0 3px white;">${fac.icon}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                // Handle location format
                let loc = fac.location;
                if (!Array.isArray(loc) && loc.lat) loc = [loc.lat, loc.lng];

                // Fallback for missing location
                if (!loc) {
                    console.warn("⚠️ Facility missing location:", fac);
                    return;
                }

                const marker = L.marker(loc, { icon: emojiIcon });
                // @ts-ignore
                marker.feature = {
                    type: 'Feature',
                    properties: {
                        isFacility: true,
                        name: fac.name,
                        emoji: fac.icon,
                        type: fac.type,
                        description: fac.description
                    }
                };
                fg.addLayer(marker);
                console.log(`✅ Added facility ${index + 1}: ${fac.name}`);
            });
        } else {
            console.log("ℹ️ No facilities to restore");
        }

        console.log("🎉 MapEditor initialization complete!");
    }, [map, initialConfig, initialFacilities]); // Run when map is ready and when initial data changes

    // Pan to initial center when map and config are ready
    useEffect(() => {
        if (map && initialConfig?.center) {
            const center: [number, number] = Array.isArray(initialConfig.center)
                ? initialConfig.center
                : [initialConfig.center.lat, initialConfig.center.lng];
            map.setView(center, initialConfig.zoom || 13);
        }
    }, [map, initialConfig]);

    // Setup Map Handlers - STABLE (Runs once per map)
    useEffect(() => {
        if (!map) return;

        // Initialize FeatureGroup
        const drawnItems = new L.FeatureGroup();
        featureGroupRef.current = drawnItems;
        map.addLayer(drawnItems);

        // --- Event Handlers ---
        const handleCreated = (e: any) => {
            const layer = e.layer;
            const type = e.layerType;

            if (type === 'marker') {
                // Add immediately to map so user sees it
                // @ts-ignore
                layer.feature = {
                    type: 'Feature',
                    properties: {
                        isFacility: true,
                        // Default temporary props
                        name: '',
                        emoji: '📍',
                        type: 'info',
                        description: ''
                    }
                };

                if (featureGroupRef.current) {
                    featureGroupRef.current.addLayer(layer);
                    triggerUpdate();
                }

                setCurrentLayer(layer);
                setMarkerData({ name: '', emoji: '📍', type: 'info', description: '' });
                setIsModalOpen(true);
            } else {
                // Boundary - Apply styles immediately to ensure visibility
                if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                    layer.setStyle({ color: 'blue', fillOpacity: 0.2 });
                }

                // @ts-ignore
                layer.feature = { properties: { type: 'boundary' } };

                if (featureGroupRef.current) {
                    featureGroupRef.current.addLayer(layer);
                    triggerUpdate();
                }
            }

            setActiveTool('none');
        };

        const handleEdited = () => {
            // We'll define the logic to extract data in a stable way
            requestAnimationFrame(() => {
                // Defer slightly to ensure layers are updated
                const btn = document.getElementById('trigger-update-hidden-btn');
                if (btn) btn.click();
            });
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleEdited);

        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleEdited);
            map.removeLayer(drawnItems);
        };
    }, [map]); // ONLY MAP DEPENDENCY

    // This dummy effect monitors the ref for updates from the event listeners above
    // We need a stable bridge.
    // Actually, triggerUpdate is defined inside the component.
    // We can wrap handleCreated to call it, but we need to know that triggerUpdate is fresh.
    // Ideally, triggerUpdate shouldn't depend on anything changing.

    // Let's rely on the tool switching useEffect from before for the HANDLERS,
    // and this one for validity.

    useEffect(() => {
        // This effect handles the tool Lifecycle
        if (!map) return;

        if (drawHandlerRef.current) {
            drawHandlerRef.current.disable();
            drawHandlerRef.current = null;
        }
        if (editHandlerRef.current) {
            editHandlerRef.current.disable();
            editHandlerRef.current = null;
        }

        if (activeTool === 'boundary') {
            drawHandlerRef.current = new L.Draw.Polygon(map as any, {
                allowIntersection: true,
                showArea: true,
                shapeOptions: { color: 'blue', fillOpacity: 0.2 }
            });
            drawHandlerRef.current.enable();
        } else if (activeTool === 'marker') {
            drawHandlerRef.current = new L.Draw.Marker(map as any, {});
            drawHandlerRef.current.enable();
        } else if (activeTool === 'edit') {
            // @ts-ignore
            editHandlerRef.current = new L.EditToolbar.Edit(map, {
                featureGroup: featureGroupRef.current,
                selectedPathOptions: {
                    dashArray: '10, 10',
                    color: '#fe57a1'
                }
            });
            editHandlerRef.current.enable();
        } else if (activeTool === 'delete') {
            // @ts-ignore
            editHandlerRef.current = new L.EditToolbar.Delete(map, {
                featureGroup: featureGroupRef.current
            });
            editHandlerRef.current.enable();
        }
    }, [activeTool, map]);


    const stopActiveTool = () => {
        setActiveTool('none');
    };


    // Helper to export GeoJSON
    const triggerUpdate = () => {
        if (!featureGroupRef.current || !map) return;

        const boundaries: any[] = [];
        const facilities: any[] = [];

        featureGroupRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle) && !(layer instanceof L.Marker)) {
                // Rectangle is also a polygon in leaflet, but let's handle generic polygons
                // @ts-ignore
                const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
                boundaries.push(latlngs);
            } else if (layer instanceof L.Rectangle) {
                // @ts-ignore
                const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
                boundaries.push(latlngs);
            } else if (layer instanceof L.Marker) {
                const props = layer.feature?.properties;
                if (props && props.isFacility) {
                    facilities.push({
                        id: `fac-${Date.now()}-${Math.random()}`,
                        name: props.name,
                        type: props.type,
                        icon: props.emoji,
                        description: props.description,
                        location: [layer.getLatLng().lat, layer.getLatLng().lng],
                        active: true
                    });
                }
            }
        });

        const config = {
            center: [map.getCenter().lat, map.getCenter().lng],
            zoom: map.getZoom(),
            boundaries: boundaries,
            restrictedZones: [] // Could add specific "restricted" type polygons later
        };

        onConfigChange(config, facilities);
    };

    const handleSaveMarker = () => {
        if (!currentLayer || !featureGroupRef.current) return;

        const emojiIcon = L.divIcon({
            className: 'custom-poi-marker',
            html: `<div style="font-size: 24px; text-shadow: 0 0 3px white;">${markerData.emoji}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        (currentLayer as L.Marker).setIcon(emojiIcon);

        // Attach Metadata
        // @ts-ignore
        currentLayer.feature = {
            type: 'Feature',
            properties: {
                isFacility: true,
                ...markerData
            }
        };

        // Layer already in group, just update
        triggerUpdate();

        // Clear current layer so modal close doesn't remove it
        setCurrentLayer(null);
        setIsModalOpen(false);
    };

    const handleCancelMarker = () => {
        setIsModalOpen(false);
        if (currentLayer && featureGroupRef.current) {
            featureGroupRef.current.removeLayer(currentLayer);
            triggerUpdate();
        }
        setCurrentLayer(null);
    };

    return (
        <div className="space-y-4">
            {/* Hidden Button for Event Bridge */}
            <button
                id="trigger-update-hidden-btn"
                className="hidden"
                onClick={triggerUpdate}
            />

            {/* Location Button */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={requestUserLocation}
                    disabled={isRequestingLocation}
                    variant="outline"
                    className="gap-2"
                >
                    <MapPin className="w-4 h-4" />
                    {isRequestingLocation ? 'Getting Location...' : 'Use My Location'}
                </Button>

                {locationError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <span>{locationError}</span>
                    </div>
                )}

                {userLocation && !locationError && !isRequestingLocation && (
                    <div className="text-sm text-muted-foreground">
                        ✓ Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                    </div>
                )}
            </div>

            <div className="h-[500px] w-full border rounded-lg overflow-hidden relative group">
                <MapContainer
                    center={initialConfig?.center || [28.6139, 77.2090]}
                    zoom={initialConfig?.zoom || 13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController onMapReady={setMap} />
                </MapContainer>

                {/* Custom Floating Toolbar */}
                <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 bg-background/95 backdrop-blur shadow-lg p-2 rounded-lg border border-border">
                    <TooltipButton
                        active={activeTool === 'none'}
                        onClick={stopActiveTool}
                        icon={<MousePointer2 className="w-5 h-5" />}
                        label="View Mode"
                    />
                    <div className="w-full h-px bg-border my-1" />
                    <TooltipButton
                        active={activeTool === 'boundary'}
                        onClick={() => setActiveTool(activeTool === 'boundary' ? 'none' : 'boundary')}
                        icon={<MapIcon className="w-5 h-5" />}
                        label="Draw Boundary"
                    />
                    <TooltipButton
                        active={activeTool === 'marker'}
                        onClick={() => setActiveTool(activeTool === 'marker' ? 'none' : 'marker')}
                        icon={<MapPin className="w-5 h-5" />}
                        label="Add Facility"
                    />
                    <div className="w-full h-px bg-border my-1" />
                    <TooltipButton
                        active={activeTool === 'edit'}
                        onClick={() => {
                            // If toggling off, save edits
                            if (activeTool === 'edit') {
                                // L.EditToolbar.Edit automatically saves on disable? NO.
                                // We rely on the 'edit' event from leaflet draw, which fires on save()
                                // But here we just toggle tools.
                                // Leaflet.Draw's edit handler saves on 'complete'.
                                if (editHandlerRef.current) editHandlerRef.current.save();
                            }
                            setActiveTool(activeTool === 'edit' ? 'none' : 'edit');
                        }}
                        icon={activeTool === 'edit' ? <Check className="w-5 h-5 text-green-500" /> : <PenTool className="w-5 h-5" />}
                        label="Edit Layers"
                    />
                    <TooltipButton
                        active={activeTool === 'delete'}
                        onClick={() => {
                            if (activeTool === 'delete' && editHandlerRef.current) editHandlerRef.current.save();
                            setActiveTool(activeTool === 'delete' ? 'none' : 'delete');
                        }}
                        icon={<Trash2 className="w-5 h-5" />}
                        label="Delete Layers"
                    />
                </div>
            </div>

            {/* Marker Editor Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
                if (!open) handleCancelMarker();
            }}>
                <DialogContent className="z-[9999]">
                    <DialogHeader>
                        <DialogTitle>Add Marker Details</DialogTitle>
                    </DialogHeader>
                    {/* ... (Same Form Content) ... */}
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={markerData.name}
                                onChange={e => setMarkerData({ ...markerData, name: e.target.value })}
                                placeholder="e.g. Main Stage, Gate A"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Icon (Emoji)</Label>
                                <Input
                                    value={markerData.emoji}
                                    onChange={e => setMarkerData({ ...markerData, emoji: e.target.value })}
                                    placeholder="e.g. 🎤"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={markerData.type}
                                    onValueChange={val => setMarkerData({ ...markerData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10000]">
                                        <SelectItem value="stage">Stage</SelectItem>
                                        <SelectItem value="food">Food</SelectItem>
                                        <SelectItem value="water">Water</SelectItem>
                                        <SelectItem value="toilet">Toilet</SelectItem>
                                        <SelectItem value="medical">Medical</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                        <SelectItem value="exit">Exit</SelectItem>
                                        <SelectItem value="parking">Parking</SelectItem>
                                        <SelectItem value="special">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={markerData.description}
                                onChange={e => setMarkerData({ ...markerData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveMarker}>Save Marker</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const TooltipButton = ({ active, onClick, icon, label }: any) => (
    <Button
        variant={active ? "default" : "ghost"}
        size="icon"
        onClick={onClick}
        className={`w-10 h-10 ${active ? 'shadow-inner' : 'hover:bg-accent'}`}
        title={label}
    >
        {icon}
    </Button>
);

export default MapEditor;
