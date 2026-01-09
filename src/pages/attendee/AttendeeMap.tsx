import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Info,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { getEvents, EventData, fetchRoutes, updateUserLocation } from "@/lib/db";
import { Button } from "@/components/ui/button";
// SafetyRouteSelector removed as per request for map-only UI
import { useNavigate } from "react-router-dom";
import { GoogleInteractiveMap } from "@/components/GoogleInteractiveMap";
import { useToast } from "@/hooks/use-toast";

export const AttendeeMap = () => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [customStart, setCustomStart] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  // Helper to ensure center is always [number, number]
  const getSafeCenter = (val: any): [number, number] => {
    if (Array.isArray(val) && val.length >= 2) return [val[0], val[1]];
    if (val && typeof val === 'object') {
      const lat = val.lat ?? val.latitude;
      const lng = val.lng ?? val.longitude;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return [lat, lng];
      }
    }
    return [51.505, -0.09];
  };

  // Load event from local storage on mount
  useEffect(() => {
    const loadEvent = () => {
      try {
        const stored = localStorage.getItem("currentEvent");
        if (stored) {
          const parsed = JSON.parse(stored);
          setEvent(parsed);
          setLoading(false);
          console.log("✅ AttendeeMap: Loaded event:", parsed.name);
        } else {
          console.warn("⚠️ AttendeeMap: No event in localStorage");
          setLoading(false);
        }
      } catch (e) {
        console.error("❌ AttendeeMap: Error parsing event", e);
        setLoading(false);
      }
    };
    loadEvent();
  }, []);

  // Real-time user location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation Failed", description: "Browser does not support geolocation", variant: "destructive" });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log(`📍 GPS Update: ${latitude} ${longitude}`);
      setUserLocation([latitude, longitude]);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation failed:", error.message);
      toast({ title: "Location Error", description: error.message, variant: "destructive" });
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Cleanup when mode changes
  useEffect(() => {
    if (!isPlanning) {
      setCustomStart(null);
      if (!navigating) setDestination(null);
    } else {
      setNavigating(false);
      setRoutes([]);
    }
  }, [isPlanning]);

  // HYBRID ROUTING LOGIC
  useEffect(() => {
    let interval: any;

    const calculateAndAnalyzeRoutes = async () => {
      const fetchEvent = async () => {
        const rawStored = localStorage.getItem("currentEvent");
        console.log("🔍 AttendeeMap: Raw stored event:", rawStored);

        const storedEvent = JSON.parse(rawStored || "null");
        console.log("🔍 AttendeeMap: Parsed stored event:", storedEvent);

        if (!storedEvent?.id) {
          console.warn("⚠️ AttendeeMap: No valid event ID found in storage.");
          setLoading(false);
          return;
        }

        // Check if offline mode is enabled
      }
      const effectiveStart = isPlanning ? customStart : userLocation;
      const effectiveEnd = destination;

      if (!event || !effectiveStart || !effectiveEnd) return;

      // 1. Update User Location (if tracking)
      if (!isPlanning && userLocation) {
        updateUserLocation(userLocation[0], userLocation[1]);
      }

      // 2. Client-Side: Get Paths from Google Directions Service
      try {
        const directionsService = new google.maps.DirectionsService();

        // Helper to fetch routes
        const getGoogleRoutes = async (mode: google.maps.TravelMode) => {
          return await directionsService.route({
            origin: { lat: effectiveStart[0], lng: effectiveStart[1] },
            destination: { lat: effectiveEnd[0], lng: effectiveEnd[1] },
            travelMode: mode,
            provideRouteAlternatives: true,
          });
        };

        let result;
        try {
          // First try WALKING
          result = await getGoogleRoutes(google.maps.TravelMode.WALKING);
        } catch (walkError: any) {
          console.log("⚠️ Walking route failed. Error details:", walkError);
          // Check for ZERO_RESULTS in various ways to be robust
          const isZeroResults =
            walkError?.code === 'ZERO_RESULTS' ||
            (typeof walkError?.message === 'string' && walkError.message.includes('ZERO_RESULTS')) ||
            (walkError?.toString && walkError.toString().includes('ZERO_RESULTS'));

          if (isZeroResults) {
            console.log("🚶➡️🚗 Switching to DRIVING mode due to distance...");
            toast({ title: "Walking Path Not Found", description: "Distance is too far. Calculating driving route..." });
            try {
              result = await getGoogleRoutes(google.maps.TravelMode.DRIVING);
            } catch (driveError: any) {
              console.error("🚗 Driving route also failed:", driveError);
              throw new Error("No route found (walking or driving). Please check points.");
            }
          } else {
            throw walkError;
          }
        }

        if (!result || !result.routes || result.routes.length === 0) {
          toast({ title: "No Routes Found", description: "Could not find a path between these points.", variant: "destructive" });
          return;
        }

        // 3. Transform for Backend Analysis
        const candidateRoutes = result.routes.map((r, idx) => {
          // Extract full path geometry as [[lat, lng], ...]
          const overviewPath = r.overview_path.map(p => [p.lat(), p.lng()]);
          const leg = r.legs[0];

          return {
            id: `g-route-${idx}`, // temporary ID
            geometry: overviewPath,
            distance: leg?.distance?.value || 0,
            duration: Math.ceil((leg?.duration?.value || 0) / 60),
            summary: r.summary
          };
        });

        // 4. Backend: Analyze Crowd Density for these specific paths
        // We import analyzeRoutes from db.ts (assumed added)
        const { analyzeRoutes } = await import("@/lib/db");
        const analyzedRoutes = await analyzeRoutes(candidateRoutes, event.id!);

        setRoutes(analyzedRoutes);

        // Auto-select first if none selected
        if (!selectedRouteId && analyzedRoutes.length > 0) {
          setSelectedRouteId(analyzedRoutes[0].id);
        }

      } catch (error: any) {
        console.error("Routing Error:", error);
        toast({ title: "Routing Error", description: error?.message || "Could not calculate route.", variant: "destructive" });
      }
    };

    if (navigating || (isPlanning && customStart && destination) || (!isPlanning && destination && userLocation)) {
      calculateAndAnalyzeRoutes();
      // Poll for CROWD updates (re-analyze), but maybe not re-calculate geometry every time to save API quota?
      // For now, simple polling is fine.
      interval = setInterval(calculateAndAnalyzeRoutes, 10000);
    }

    return () => clearInterval(interval);
  }, [navigating, isPlanning, customStart, destination, event, userLocation, selectedRouteId]);

  const { toast } = useToast();

  // Handle Map Clicks
  const handleMapClick = (latlng: [number, number]) => {
    if (isPlanning) {
      // Planning Mode: Only set if null
      if (!customStart) {
        setCustomStart(latlng);
        toast({ title: "Start Point Set", description: "Now set Destination." });
      } else if (!destination) {
        setDestination(latlng);
        toast({ title: "Destination Set", description: "Calculating routes..." });
      } else {
        // Both set -> Ignore click to prevent accidental change
        toast({ title: "Points Locked", description: "Click 'Change' to pick new points." });
      }
    } else {
      // Live Mode: Only set dest if null
      if (!destination) {
        setDestination(latlng);
        toast({ title: "Destination Set", description: "Tap 'Start Navigation' to begin." });
      } else {
        toast({ title: "Destination Locked", description: "Click 'Change' to pick a new destination." });
      }
    }
  };

  const startNavigation = () => {
    if (!destination) {
      toast({ title: "No Destination", description: "Please select a destination first." });
      return;
    }
    setNavigating(true);
    toast({ title: "Navigation Started", description: "Follow the route to your destination." });
    // Force immediate recalc
    // calculateAndAnalyzeRoutes call happens in effect
  };

  const handleNavigate = (location: [number, number]) => {
    // POI navigation - force overwrite or ask?
    // User specifically clicked "Navigate Here" on a POI, so we should allow it.
    if (isPlanning && customStart && destination) {
      // Ask user or just overwrite dest? Le's overwrite dest logic but clear it first
      setDestination(location);
    } else {
      setDestination(location);
    }
  };

  const handleClearStart = () => {
    setCustomStart(null);
    setRoutes([]);
  };

  const handleClearDest = () => {
    setDestination(null);
    setRoutes([]);
    setSelectedRouteId(null);
    if (navigating) {
      setNavigating(false); // Stop nav if dest cleared?
    }
  };


  // ...

  return (
    <AttendeeLayout>
      <div className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* ... Title Block ... */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Navigation Map</h1>
              <p className="text-sm text-muted-foreground">
                {event ? event.name : "No event selected"}
              </p>
            </div>
            {event && (
              <div className="flex gap-2">
                <Button size="sm" variant={isPlanning ? "ghost" : "default"} onClick={() => setIsPlanning(false)}>Live Nav</Button>
                <Button size="sm" variant={isPlanning ? "default" : "outline"} onClick={() => setIsPlanning(true)}>Trip Planner</Button>
              </div>
            )}
          </div>

          {/* Mode Specific Controls */}
          {!isPlanning && event && (
            <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Destination</div>
                {destination ? (
                  <Button variant="ghost" size="sm" className="h-6 text-blue-500 hover:text-blue-700 px-2" onClick={handleClearDest}>
                    Change
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Tap map to set</span>
                )}
              </div>

              {destination ? (
                <div className="flex items-center justify-between bg-background p-2 rounded border">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>Custom Pin</span>
                  </div>
                  {!navigating && <Button size="sm" onClick={startNavigation}>Start</Button>}
                  {navigating && <span className="text-xs text-green-600 animate-pulse font-bold">Navigating...</span>}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic pl-1">None selected</div>
              )}
            </div>
          )}

          {isPlanning && (
            <div className="bg-muted/50 p-2 rounded-lg border text-sm flex flex-col gap-2">
              <div className="font-semibold text-primary">Trip Planner Mode</div>

              {/* Start Point */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                <div className="text-muted-foreground w-10">Start:</div>
                <div className="flex items-center gap-2 bg-background px-2 py-1 rounded border overflow-hidden">
                  <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="truncate">{customStart ? `${customStart[0].toFixed(4)}, ...` : "Tap on map"}</span>
                </div>
                {customStart && <Button variant="ghost" size="sm" className="h-6 px-2 text-blue-500" onClick={handleClearStart}>Change</Button>}
              </div>

              {/* End Point */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                <div className="text-muted-foreground w-10">End:</div>
                <div className="flex items-center gap-2 bg-background px-2 py-1 rounded border overflow-hidden">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="truncate">{destination ? `${destination[0].toFixed(4)}, ...` : "Tap on map"}</span>
                </div>
                {destination && <Button variant="ghost" size="sm" className="h-6 px-2 text-blue-500" onClick={handleClearDest}>Change</Button>}
              </div>

              <div className="text-xs text-muted-foreground pt-1">
                {routes.length > 0 ? `${routes.length} routes found` : "Set both points to view routes"}
              </div>
            </div>
          )}
        </motion.div>

        {/* Map container */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-border bg-gray-100 dark:bg-gray-800 min-h-[400px]">
          {!event ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No Event Selected</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Please select an event first to view its navigation map.
              </p>
              <Button className="mt-4" onClick={() => navigate("/attendee/events")}>
                Browse Events
              </Button>
            </div>
          ) : event.mapConfig ? (
            <GoogleInteractiveMap
              config={event.mapConfig}
              facilities={event.facilities}
              routes={routes}
              selectedRouteId={selectedRouteId || undefined}
              onRouteSelect={setSelectedRouteId}
              onNavigate={handleNavigate}
              onMapClick={handleMapClick}
              customMarkers={{
                start: isPlanning ? (customStart || undefined) : undefined,
                end: isPlanning ? (destination || undefined) : undefined
              }}
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              userLocation={userLocation}
            />
          ) : event.mapEmbedUrl ? (
            <iframe
              src={event.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Map Not Available</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                The map for "{event.name}" hasn't been configured by the organizers yet.
              </p>
            </div>
          )}

          {/* Overlay Info */}
          {event?.mapEmbedUrl && (
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded-md shadow-sm border text-xs text-muted-foreground z-[1002]">
              <div className="flex items-center gap-2">
                <Info className="w-3 h-3" />
                {event.name} - Map Viewer
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-20 right-4 bg-background/90 p-2 rounded border text-xs z-[2000] max-w-xs overflow-auto max-h-40 hidden">
        <h4 className="font-bold border-b mb-1">Debug</h4>
        <div>Event: {event ? "Loaded" : "Missing"}</div>
        <div>Mode: {isPlanning ? "Planning" : "Live"}</div>
        <div>Start: {customStart ? "Set" : userLocation ? "GPS" : "None"}</div>
        <div>Dest: {destination ? "Set" : "None"}</div>
        <div>Routes: {routes.length}</div>
      </div>

      {/* Route Info Overlay (Floating Card for Selected Route) */}
      {(isPlanning || navigating) && selectedRouteId && routes.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur shadow-lg p-3 rounded-xl border w-[90%] max-w-sm z-[1000] flex items-center justify-between">
          {(() => {
            const route = routes.find(r => r.id === selectedRouteId);
            if (!route) return null;
            const colorMap: any = { green: "text-green-600", yellow: "text-yellow-600", red: "text-red-600" };
            const textColor = colorMap[route.safety?.color] || "text-blue-600";

            return (
              <>
                <div className="flex flex-col">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span className={textColor}>{route.safety?.label || "Route"}</span>
                    <span className="text-muted-foreground text-xs">• {route.duration} min</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {route.distance}m • {route.summary}
                  </div>
                </div>
                <Button size="sm" onClick={startNavigation}>
                  {navigating ? "Update" : "Go"}
                </Button>
              </>
            );
          })()}
        </div>
      )}
    </AttendeeLayout>
  );
};
