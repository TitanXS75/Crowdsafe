import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { subscribeToEventLocations, AttendeeLocation } from '@/services/locationService';

// Extend Leaflet types for heatmap
declare module 'leaflet' {
    function heatLayer(
        latlngs: [number, number, number][],
        options?: any
    ): any;
}

interface LiveCrowdMapProps {
    eventId: string;
    config?: {
        center: [number, number];
        zoom: number;
        boundaries?: [number, number][];
    };
    showHeatmap?: boolean;
}

// Component to add colored dots for attendees
const AttendeeMarkers = ({ locations }: { locations: Record<string, AttendeeLocation> }) => {
    const map = useMap();

    useEffect(() => {
        // Clear previous markers
        const markers: L.CircleMarker[] = [];

        Object.values(locations).forEach((location) => {
            // Color based on status
            const color =
                location.status === 'emergency' ? '#ef4444' :
                    location.status === 'attention' ? '#f59e0b' :
                        '#22c55e'; // safe

            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            // Add popup
            marker.bindPopup(`
                <div class="p-2">
                    <div class="font-bold">${location.name}</div>
                    <div class="text-xs text-gray-600">Status: ${location.status}</div>
                    <div class="text-xs text-gray-500">Last seen: ${new Date(location.lastSeen).toLocaleTimeString()}</div>
                </div>
            `);

            markers.push(marker);
        });

        // Cleanup
        return () => {
            markers.forEach(marker => marker.remove());
        };
    }, [locations, map]);

    return null;
};

// Component to add heatmap layer
const HeatmapLayer = ({ locations, show }: { locations: Record<string, AttendeeLocation>, show: boolean }) => {
    const map = useMap();

    useEffect(() => {
        if (!show) return;

        // Convert locations to heatmap format: [lat, lng, intensity]
        const heatData: [number, number, number][] = Object.values(locations).map(loc => [
            loc.lat,
            loc.lng,
            1.0 // intensity
        ]);

        // Create heatmap layer
        const heatLayer = (L as any).heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: '#3b82f6',
                0.5: '#f59e0b',
                0.8: '#ef4444',
                1.0: '#dc2626'
            }
        }).addTo(map);

        // Cleanup
        return () => {
            heatLayer.remove();
        };
    }, [locations, show, map]);

    return null;
};

// Main component
const LiveCrowdMap = ({ eventId, config, showHeatmap = true }: LiveCrowdMapProps) => {
    const [locations, setLocations] = useState<Record<string, AttendeeLocation>>({});
    const [isLoading, setIsLoading] = useState(true);

    const center = config?.center || [28.6139, 77.2090]; // India (New Delhi) as default
    const zoom = config?.zoom || 13;

    useEffect(() => {
        setIsLoading(true);

        // Subscribe to real-time location updates
        const unsubscribe = subscribeToEventLocations(eventId, (updatedLocations) => {
            setLocations(updatedLocations);
            setIsLoading(false);
        });

        // Cleanup subscription
        return () => {
            unsubscribe();
        };
    }, [eventId]);

    const attendeeCount = Object.keys(locations).length;
    const safeCount = Object.values(locations).filter(l => l.status === 'safe').length;
    const attentionCount = Object.values(locations).filter(l => l.status === 'attention').length;
    const emergencyCount = Object.values(locations).filter(l => l.status === 'emergency').length;

    return (
        <div className="h-full w-full relative">
            {/* Stats overlay */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                <h3 className="font-bold text-sm mb-2">Live Attendees: {attendeeCount}</h3>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Safe: {safeCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span>Attention: {attentionCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Emergency: {emergencyCount}</span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Draw event boundaries if provided */}
                {config?.boundaries && config.boundaries.length > 0 && (
                    <Polygon
                        positions={config.boundaries}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                )}

                {/* Show heatmap layer */}
                {showHeatmap && <HeatmapLayer locations={locations} show={showHeatmap} />}

                {/* Show individual attendee markers */}
                <AttendeeMarkers locations={locations} />
            </MapContainer>

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1001]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading live locations...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveCrowdMap;
