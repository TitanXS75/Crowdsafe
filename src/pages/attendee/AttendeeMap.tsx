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
import SafetyRouteSelector from "@/components/SafetyRouteSelector";
import { useNavigate } from "react-router-dom";
import InteractiveMap from "@/components/InteractiveMap";
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

  // Simulate user location near the event center
  useEffect(() => {
    if (event?.mapConfig?.center && !userLocation) {
      const [lat, lng] = getSafeCenter(event.mapConfig.center);
      // Start slightly offset
      setUserLocation([lat - 0.005, lng - 0.005]);
    }
  }, [event]);

  // Cleanup when mode changes
  useEffect(() => {
    if (!isPlanning) {
      setCustomStart(null);
      if (!navigating) setDestination(null);
    } else {
      // Stop live navigation if entering planning mode? 
      // Or keep it separate? Let's pause live nav visual but keep state.
      setNavigating(false);
      setDestination(null);
      setRoutes([]); // Clear old routes
    }
  }, [isPlanning]);

  // Periodic visual update (re-fetching routes)
  useEffect(() => {
    let interval: any;
    const updateNav = async () => {
      const effectiveStart = isPlanning ? customStart : userLocation;
      // Use selected destination or default to map center (only for live nav fallback)
      // For planning, we STRICTLY need a destination set by user.
      const effectiveEnd = destination;

      if (event && effectiveStart && effectiveEnd) {
        // 1. Update backend on location (only if real user location)
        if (!isPlanning && userLocation) {
          await updateUserLocation(userLocation[0], userLocation[1]);
        }

        // 2. Fetch fresh routes
        const freshRoutes = await fetchRoutes(effectiveStart, effectiveEnd, event.id!);

        // Keep selected route if it still exists, else pick top
        setRoutes(freshRoutes);
        if (!selectedRouteId && freshRoutes.length > 0) {
          setSelectedRouteId(freshRoutes[0].id);
        }
      }
    };

    if (navigating || (isPlanning && customStart && destination)) {
      updateNav(); // Immediate
      // Only auto-refresh if live navigating? 
      // Planning routes shouldn't change wildly unless crowd changes. Let's refresh slower or not at all?
      // Let's refresh to show crowd updates.
      interval = setInterval(updateNav, 5000);
    }

    return () => clearInterval(interval);
  }, [navigating, isPlanning, customStart, destination, event, userLocation, selectedRouteId]);

  const { toast } = useToast();

  // Handle Map Clicks
  const handleMapClick = (latlng: [number, number]) => {
    if (isPlanning) {
      if (!customStart) {
        setCustomStart(latlng);
        toast({ title: "Start Point Set", description: "Now tap for Destination." });
      } else if (!destination) {
        setDestination(latlng);
        toast({ title: "Destination Set", description: "Calculating routes..." });
      } else {
        // Cycle? Or just update destination?
        // Let's update destination to match standard UX
        setDestination(latlng);
      }
    } else {
      // Standard Mode: Tap to Navigate essentially just sets destination?
      // Or "Navigate Here" via marker is preferred. 
      // Let's allow tap to set destination for live nav too if logical.
      // But usually map click does nothing in standard mode unless on POI.
    }
  };

  const handleNavigate = (location: [number, number]) => {
    setDestination(location);

    if (isPlanning) {
      // If planning, we just need destination. Start is already set or waiting.
      // If start missing, user can tap or we could default to something? 
      // Better to ask for start.
      if (!customStart) {
        toast({ title: "Destination Set", description: "Now select a Start Point." });
      }
    } else {
      if (!navigating) {
        startNavigation();
      }
      toast({
        title: "Destination Set",
        description: "Recalculating routes to selected location.",
      });
    }
  };

  const startNavigation = () => {
    console.log("startNavigation called", { event });
    if (!event) {
      console.error("Event is missing");
      return;
    }

    // ... (Geolocation logic remains same) ...
    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setUserLocation([latitude, longitude]);
      setNavigating(true);
      setIsPlanning(false); // Ensure we exit planning logic
      toast({
        title: "Navigation Started",
        description: "Using your current location.",
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation failed:", error.message);
      // Fallback
      const center = getSafeCenter(event.mapConfig?.center);
      if (center) {
        const [lat, lng] = center;
        setUserLocation([lat - 0.005, lng - 0.005]);
        setNavigating(true);
        setIsPlanning(false);
        toast({
          title: "Location Unavailable",
          description: "Using simulated location.",
          variant: "default"
        });
      }
    };

    if (navigator.geolocation) {
      toast({ title: "Getting Location...", description: "Please allow location access." });
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } else {
      handleError({ code: 0, message: "Geolocation not supported", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any);
    }
  };

  // ... (fetchEvent useEffect remains same) ...
  useEffect(() => {
    const fetchEvent = async () => {
      const storedEvent = JSON.parse(localStorage.getItem("currentEvent") || "null");
      if (!storedEvent?.id) {
        setLoading(false);
        return;
      }

      // Check if offline mode is enabled
      const offlineMode = localStorage.getItem("offlineMode") === "true";
      const mapDataCached = localStorage.getItem("mapDataCached") === "true";

      if (offlineMode && mapDataCached) {
        // Use cached offline data
        const offlineData = JSON.parse(localStorage.getItem("offlineEventData") || "{}");
        if (offlineData.event && offlineData.event.id === storedEvent.id) {
          console.log("📴 Using offline cached map data");
          setEvent(offlineData.event);
          setLoading(false);
          toast({
            title: "Offline Mode",
            description: "Using cached map data (offline).",
          });
          return;
        }
      }

      // Online mode or no cached data - fetch from Firebase
      try {
        const allEvents = await getEvents();
        const freshEvent = allEvents.find(e => e.id === storedEvent.id);
        if (freshEvent) {
          setEvent(freshEvent);
          localStorage.setItem("currentEvent", JSON.stringify(freshEvent));
        } else {
          setEvent(storedEvent);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        // Fallback to stored event if online fetch fails
        setEvent(storedEvent);
        toast({
          title: "Using Cached Data",
          description: "Could not fetch latest event data.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, []);


  if (loading) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Navigation Map</h1>
              <p className="text-sm text-muted-foreground">
                {event ? event.name : "No event selected"}
              </p>
            </div>
            {event && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isPlanning ? "ghost" : "default"}
                  onClick={() => {
                    setIsPlanning(false);
                    // Maybe auto-start nav? Or just reset.
                  }}
                >
                  Live Nav
                </Button>
                <Button
                  size="sm"
                  variant={isPlanning ? "default" : "outline"}
                  onClick={() => setIsPlanning(true)}
                >
                  Trip Planner
                </Button>
              </div>
            )}
          </div>

          {/* Mode Specific Controls */}
          {!isPlanning && event && !navigating && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={startNavigation}>Start Navigation</Button>
              <Button size="sm" variant="outline" onClick={() => {
                console.log("Forcing simulation");
                const center = getSafeCenter(event.mapConfig?.center);
                setUserLocation([center[0] - 0.005, center[1] - 0.005]);
                setNavigating(true);
              }}>Simulate</Button>
            </div>
          )}

          {isPlanning && (
            <div className="bg-muted/50 p-2 rounded-lg border text-sm flex flex-col gap-2">
              <div className="font-semibold text-primary">Trip Planner Mode</div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                <div className="text-muted-foreground">Start:</div>
                <div className="flex items-center justify-between bg-background px-2 py-1 rounded border">
                  <span>{customStart ? `${customStart[0].toFixed(4)}, ...` : "Tap on map"}</span>
                  {customStart && <MapPin className="w-3 h-3 text-green-500" />}
                </div>

                <div className="text-muted-foreground">End:</div>
                <div className="flex items-center justify-between bg-background px-2 py-1 rounded border">
                  <span>{destination ? `${destination[0].toFixed(4)}, ...` : "Tap or select POI"}</span>
                  {destination && <MapPin className="w-3 h-3 text-red-500" />}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{routes.length > 0 ? `${routes.length} routes found` : "Select points to view routes"}</span>
                <Button variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => {
                  setCustomStart(null);
                  setDestination(null);
                  setRoutes([]);
                }}>Clear All</Button>
              </div>
            </div>
          )}

          {navigating && !isPlanning && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live Routing Active
                {destination && <span className="text-xs text-muted-foreground">(Custom Destination)</span>}
              </div>
              {destination && (
                <Button variant="link" className="h-auto p-0 text-xs text-destructive" onClick={() => setDestination(null)}>
                  Clear Destination
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Map container */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-border bg-muted/30">
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
            <InteractiveMap
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

      {/* Route Selector */}
      {(isPlanning || navigating) && routes.length > 0 && (
        <SafetyRouteSelector
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelect={setSelectedRouteId}
        />
      )}
    </AttendeeLayout>
  );
};
