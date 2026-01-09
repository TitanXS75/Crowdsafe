import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MapPin, Edit, Trash2, Square } from 'lucide-react';

interface MapEditorProps {
    onConfigChange: (config: any, facilities: any[]) => void;
    initialConfig?: {
        center: [number, number];
        zoom: number;
        boundaries?: [number, number][];
        restrictedZones?: [number, number][];
    };
    initialFacilities?: any[];
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MapEditorContent = ({ onConfigChange, initialConfig, initialFacilities }: MapEditorProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [center] = useState<google.maps.LatLngLiteral>(() => {
        if (initialConfig?.center) {
            return { lat: initialConfig.center[0], lng: initialConfig.center[1] };
        }
        return { lat: 28.6139, lng: 77.2090 }; // Default to India
    });

    const { map, isLoaded } = useGoogleMap(mapRef, {
        center,
        zoom: initialConfig?.zoom || 15
    });

    const [activeTool, setActiveTool] = useState<'none' | 'boundary' | 'marker' | 'delete'>('none');
    const [boundaries, setBoundaries] = useState<google.maps.Polygon[]>([]);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [facilities, setFacilities] = useState<any[]>(initialFacilities || []);
    const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
    const [pendingMarkerPosition, setPendingMarkerPosition] = useState<google.maps.LatLng | null>(null);
    const [markerData, setMarkerData] = useState({
        name: '',
        type: 'info',
        emoji: '📍',
        description: ''
    });

    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

    // Initialize drawing manager
    useEffect(() => {
        if (!map || !isLoaded) return;

        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
            polygonOptions: {
                fillColor: '#0088ff',
                fillOpacity: 0.3,
                strokeWeight: 2,
                strokeColor: '#0066cc',
                clickable: true,
                editable: true,
                zIndex: 1
            }
        });

        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        // Handle polygon completion
        google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
            setBoundaries(prev => [...prev, polygon]);
            drawingManager.setDrawingMode(null);
            setActiveTool('none');
            updateConfig();
        });

        return () => {
            drawingManager.setMap(null);
        };
    }, [map, isLoaded]);

    // Load initial boundaries and facilities
    useEffect(() => {
        if (!map || !isLoaded) return;

        // Load boundaries
        if (initialConfig?.boundaries && initialConfig.boundaries.length > 0) {
            initialConfig.boundaries.forEach((coords: [number, number][]) => {
                const polygon = new google.maps.Polygon({
                    paths: coords.map(([lat, lng]) => ({ lat, lng })),
                    fillColor: '#0088ff',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    strokeColor: '#0066cc',
                    map,
                    editable: true
                });
                setBoundaries(prev => [...prev, polygon]);
            });
        }

        // Load facilities
        if (initialFacilities && initialFacilities.length > 0) {
            initialFacilities.forEach((fac: any) => {
                const position = Array.isArray(fac.location)
                    ? { lat: fac.location[0], lng: fac.location[1] }
                    : fac.location;

                const marker = new google.maps.Marker({
                    position,
                    map,
                    label: {
                        text: fac.icon || '📍',
                        fontSize: '24px'
                    },
                    title: fac.name
                });

                setMarkers(prev => [...prev, marker]);
                setFacilities(prev => [...prev, fac]);
            });
        }
    }, [map, isLoaded]);

    // Handle tool selection
    useEffect(() => {
        if (!drawingManagerRef.current) return;

        // Toggle polygon interactivity based on tool
        boundaries.forEach(poly => {
            if (activeTool === 'marker') {
                poly.setOptions({ clickable: false, editable: false });
            } else {
                poly.setOptions({ clickable: true, editable: true });
            }
        });

        switch (activeTool) {
            case 'boundary':
                drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                break;
            case 'marker':
                drawingManagerRef.current.setDrawingMode(null);
                // Add click listener for marker placement
                if (map) {
                    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
                        if (e.latLng) {
                            setPendingMarkerPosition(e.latLng);
                            setIsMarkerDialogOpen(true);
                        }
                    });
                    return () => google.maps.event.removeListener(listener);
                }
                break;
            case 'delete':
                drawingManagerRef.current.setDrawingMode(null);
                break;
            default:
                drawingManagerRef.current.setDrawingMode(null);
        }
    }, [activeTool, map, boundaries]);

    const updateConfig = useCallback(() => {
        if (!map) return;

        const config = {
            center: [map.getCenter()?.lat() || center.lat, map.getCenter()?.lng() || center.lng] as [number, number],
            zoom: map.getZoom() || 15,
            boundaries: boundaries.map(polygon => {
                const path = polygon.getPath();
                return path.getArray().map(latLng => [latLng.lat(), latLng.lng()] as [number, number]);
            }),
            restrictedZones: []
        };

        onConfigChange(config, facilities);
    }, [map, boundaries, facilities, onConfigChange]);

    const handleSaveMarker = () => {
        if (!pendingMarkerPosition || !map) return;

        const newFacility = {
            id: `fac-${Date.now()}`,
            name: markerData.name,
            type: markerData.type,
            icon: markerData.emoji,
            description: markerData.description,
            location: [pendingMarkerPosition.lat(), pendingMarkerPosition.lng()] as [number, number],
            active: true
        };

        const marker = new google.maps.Marker({
            position: pendingMarkerPosition,
            map,
            label: {
                text: markerData.emoji,
                fontSize: '24px'
            },
            title: markerData.name
        });

        setMarkers(prev => [...prev, marker]);
        setFacilities(prev => [...prev, newFacility]);

        setIsMarkerDialogOpen(false);
        setPendingMarkerPosition(null);
        setMarkerData({ name: '', type: 'info', emoji: '📍', description: '' });
        setActiveTool('none');

        updateConfig();
    };

    const handleDelete = () => {
        // Delete last boundary
        if (boundaries.length > 0) {
            const lastBoundary = boundaries[boundaries.length - 1];
            lastBoundary.setMap(null);
            setBoundaries(prev => prev.slice(0, -1));
            updateConfig();
        }
    };

    return (
        <div className="relative h-96 w-full rounded-lg overflow-hidden border">
            {/* Map Container */}
            <div ref={mapRef} className="h-full w-full" />

            {/* Tool Controls */}
            <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 space-y-2">
                <Button
                    size="sm"
                    variant={activeTool === 'boundary' ? 'default' : 'outline'}
                    onClick={() => setActiveTool(activeTool === 'boundary' ? 'none' : 'boundary')}
                    className="w-full"
                >
                    <Square className="w-4 h-4 mr-2" />
                    Boundary
                </Button>
                <Button
                    size="sm"
                    variant={activeTool === 'marker' ? 'default' : 'outline'}
                    onClick={() => setActiveTool(activeTool === 'marker' ? 'none' : 'marker')}
                    className="w-full"
                >
                    <MapPin className="w-4 h-4 mr-2" />
                    Marker
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full"
                    disabled={boundaries.length === 0}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
            </div>

            {/* Marker Dialog */}
            <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
                <DialogContent className="z-[10000]">
                    <DialogHeader>
                        <DialogTitle>Add Facility Marker</DialogTitle>
                    </DialogHeader>
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
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description (Optional)</Label>
                            <Input
                                value={markerData.description}
                                onChange={e => setMarkerData({ ...markerData, description: e.target.value })}
                                placeholder="Additional details"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsMarkerDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveMarker}>Add Marker</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const MapEditor = (props: MapEditorProps) => {
    if (!API_KEY) {
        return (
            <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-red-500">Google Maps API Key not configured</p>
            </div>
        );
    }

    return (
        <GoogleMapWrapper apiKey={API_KEY}>
            <MapEditorContent {...props} />
        </GoogleMapWrapper>
    );
};

export default MapEditor;
