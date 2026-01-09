import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface NavigationMapProps {
    destination: { lat: number; lon: number };
    destinationLabel?: string;
    onClose: () => void;
}

export const NavigationMap = ({ destination, destinationLabel = "Your Car", onClose }: NavigationMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const routeControlRef = useRef<L.Routing.Control | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [distance, setDistance] = useState<string>("");
    const [duration, setDuration] = useState<string>("");
    const [instructions, setInstructions] = useState<string[]>([]);
    const [currentInstruction, setCurrentInstruction] = useState<string>("Getting your location...");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map centered on destination
        const map = L.map(mapRef.current).setView([destination.lat, destination.lon], 16);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Add destination marker (car icon)
        const carIcon = L.divIcon({
            html: `<div style="font-size: 28px;">🚗</div>`,
            className: "car-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
        L.marker([destination.lat, destination.lon], { icon: carIcon })
            .addTo(map)
            .bindPopup(`<b>${destinationLabel}</b><br>Your parked vehicle`);

        // Start watching user position
        if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lon: longitude });
                    setIsLoading(false);

                    updateUserMarker(map, latitude, longitude);
                    updateRoute(map, latitude, longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setCurrentInstruction("Could not get your location. Please enable GPS.");
                    setIsLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 1000
                }
            );
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [destination]);

    const updateUserMarker = (map: L.Map, lat: number, lon: number) => {
        const userIcon = L.divIcon({
            html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            className: "user-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([lat, lon]);
        } else {
            userMarkerRef.current = L.marker([lat, lon], { icon: userIcon }).addTo(map);
            // Fit bounds to show both markers
            map.fitBounds([
                [lat, lon],
                [destination.lat, destination.lon]
            ], { padding: [50, 50] });
        }
    };

    const updateRoute = (map: L.Map, lat: number, lon: number) => {
        // Remove existing route
        if (routeControlRef.current) {
            map.removeControl(routeControlRef.current);
        }

        // Create new route
        const routeControl = (L as any).Routing.control({
            waypoints: [
                L.latLng(lat, lon),
                L.latLng(destination.lat, destination.lon)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            showAlternatives: false,
            createMarker: () => null, // We handle markers ourselves
            lineOptions: {
                styles: [{ color: '#3b82f6', weight: 5, opacity: 0.8 }]
            },
            show: false, // Hide the default instructions panel
            router: (L as any).Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'foot'
            })
        }).addTo(map);

        routeControl.on('routesfound', (e: any) => {
            const routes = e.routes;
            if (routes.length > 0) {
                const route = routes[0];
                const distKm = (route.summary.totalDistance / 1000).toFixed(2);
                const distM = route.summary.totalDistance;
                const timeMin = Math.round(route.summary.totalTime / 60);

                setDistance(distM < 1000 ? `${Math.round(distM)} m` : `${distKm} km`);
                setDuration(`${timeMin} min`);

                // Get instructions
                const steps = route.instructions || [];
                const instructionTexts = steps.map((step: any) => step.text);
                setInstructions(instructionTexts);

                if (instructionTexts.length > 0) {
                    setCurrentInstruction(instructionTexts[0]);
                } else {
                    setCurrentInstruction("Walk towards your destination");
                }

                // Check if arrived
                if (distM < 10) {
                    setCurrentInstruction("🎉 You have arrived at your vehicle!");
                }
            }
        });

        routeControlRef.current = routeControl;
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg">Navigating to {destinationLabel}</h2>
                        <div className="flex items-center gap-4 text-sm opacity-90">
                            {distance && <span>📍 {distance}</span>}
                            {duration && <span>⏱️ {duration} walking</span>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Current instruction */}
            <div className="bg-card border-b p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                        {isLoading ? "⏳" : "🚶"}
                    </div>
                    <p className="font-medium text-foreground">{currentInstruction}</p>
                </div>
            </div>

            {/* Map */}
            <div ref={mapRef} className="flex-1" />

            {/* Instructions panel */}
            {instructions.length > 1 && (
                <div className="bg-card border-t max-h-40 overflow-y-auto">
                    <div className="p-2">
                        <p className="text-xs text-muted-foreground font-medium mb-2">UPCOMING</p>
                        {instructions.slice(1, 4).map((instruction, index) => (
                            <div key={index} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground text-sm">{index + 2}.</span>
                                <span className="text-sm text-foreground">{instruction}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
