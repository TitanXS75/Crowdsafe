import { useEffect, useRef, useState } from 'react';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { subscribeToEventLocations, AttendeeLocation } from '@/services/locationService';

interface LiveCrowdMapProps {
    eventId: string;
    config?: {
        center: [number, number];
        zoom: number;
        boundaries?: [number, number][];
    };
    showHeatmap?: boolean;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LiveCrowdMapContent = ({ eventId, config, showHeatmap = true }: LiveCrowdMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [center] = useState<google.maps.LatLngLiteral>(() => {
        if (config?.center) {
            return { lat: config.center[0], lng: config.center[1] };
        }
        return { lat: 28.6139, lng: 77.2090 }; // Default India
    });

    const { map, isLoaded } = useGoogleMap(mapRef, {
        center,
        zoom: config?.zoom || 15
    });

    const [locations, setLocations] = useState<Record<string, AttendeeLocation>>({});
    const [isLoading, setIsLoading] = useState(true);
    const markersRef = useRef<Record<string, google.maps.Marker>>({});
    const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
    const boundariesRef = useRef<google.maps.Polygon[]>([]);

    // Subscribe to location updates
    useEffect(() => {
        const unsubscribe = subscribeToEventLocations(eventId, (updatedLocations) => {
            setLocations(updatedLocations);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    // Draw event boundaries
    useEffect(() => {
        if (!map || !isLoaded || !config?.boundaries) return;

        // Clear existing boundaries
        boundariesRef.current.forEach(polygon => polygon.setMap(null));
        boundariesRef.current = [];

        // Draw new boundaries
        config.boundaries.forEach((coords: [number, number][]) => {
            const polygon = new google.maps.Polygon({
                paths: coords.map(([lat, lng]) => ({ lat, lng })),
                strokeColor: '#0066cc',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#0088ff',
                fillOpacity: 0.15,
                map
            });
            boundariesRef.current.push(polygon);
        });

        return () => {
            boundariesRef.current.forEach(polygon => polygon.setMap(null));
        };
    }, [map, isLoaded, config]);

    // Update markers for attendees
    useEffect(() => {
        if (!map || !isLoaded) return;

        const currentIds = new Set(Object.keys(locations));
        const existingIds = new Set(Object.keys(markersRef.current));

        // Remove markers for attendees who left
        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                markersRef.current[id].setMap(null);
                delete markersRef.current[id];
            }
        });

        // Add/update markers for current attendees
        Object.entries(locations).forEach(([id, location]) => {
            const color =
                location.status === 'emergency' ? '#ef4444' :
                    location.status === 'attention' ? '#f59e0b' :
                        '#22c55e'; // safe

            if (markersRef.current[id]) {
                // Update existing marker
                markersRef.current[id].setPosition({ lat: location.lat, lng: location.lng });
            } else {
                // Create new marker
                const marker = new google.maps.Marker({
                    position: { lat: location.lat, lng: location.lng },
                    map,
                    title: location.name,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: color,
                        fillOpacity: 0.8,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                        scale: 8
                    }
                });

                // Add info window
                const infoWindow = new google.maps.InfoWindow({
                    content: `
            <div class="p-2">
              <div class="font-bold">${location.name}</div>
              <div class="text-xs text-gray-600">Status: ${location.status}</div>
              <div class="text-xs text-gray-500">Last seen: ${new Date(location.lastSeen).toLocaleTimeString()}</div>
            </div>
          `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                markersRef.current[id] = marker;
            }
        });

        return () => {
            Object.values(markersRef.current).forEach(marker => marker.setMap(null));
            markersRef.current = {};
        };
    }, [map, isLoaded, locations]);

    // Update heatmap
    useEffect(() => {
        if (!map || !isLoaded || !showHeatmap) return;

        // Convert locations to heatmap data
        const heatmapData = Object.values(locations).map(loc =>
            new google.maps.LatLng(loc.lat, loc.lng)
        );

        if (heatmapRef.current) {
            heatmapRef.current.setData(heatmapData);
        } else if (heatmapData.length > 0) {
            const heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                map,
                radius: 30,
                opacity: 0.6,
                gradient: [
                    'rgba(0, 255, 255, 0)',
                    'rgba(0, 255, 255, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(0, 127, 255, 1)',
                    'rgba(0, 63, 255, 1)',
                    'rgba(0, 0, 255, 1)',
                    'rgba(0, 0, 223, 1)',
                    'rgba(0, 0, 191, 1)',
                    'rgba(0, 0, 159, 1)',
                    'rgba(0, 0, 127, 1)',
                    'rgba(63, 0, 91, 1)',
                    'rgba(127, 0, 63, 1)',
                    'rgba(191, 0, 31, 1)',
                    'rgba(255, 0, 0, 1)'
                ]
            });
            heatmapRef.current = heatmap;
        }

        return () => {
            if (heatmapRef.current) {
                heatmapRef.current.setMap(null);
                heatmapRef.current = null;
            }
        };
    }, [map, isLoaded, locations, showHeatmap]);

    const attendeeCount = Object.keys(locations).length;
    const safeCount = Object.values(locations).filter(l => l.status === 'safe').length;
    const attentionCount = Object.values(locations).filter(l => l.status === 'attention').length;
    const emergencyCount = Object.values(locations).filter(l => l.status === 'emergency').length;

    return (
        <div className="h-full w-full relative">
            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg">
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

            {/* Map Container */}
            <div ref={mapRef} className="h-full w-full" />

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading live locations...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const LiveCrowdMap = (props: LiveCrowdMapProps) => {
    if (!API_KEY) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <p className="text-red-500">Google Maps API Key not configured</p>
            </div>
        );
    }

    return (
        <GoogleMapWrapper apiKey={API_KEY}>
            <LiveCrowdMapContent {...props} />
        </GoogleMapWrapper>
    );
};

export default LiveCrowdMap;
