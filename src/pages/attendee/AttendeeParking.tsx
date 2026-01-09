import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  MapPin,
  Clock,
  Navigation,
  Save,
  Check,
  AlertCircle,
  ParkingCircle,
  Trash2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getParkingZones } from "@/lib/db";
import { NavigationMap } from "@/components/NavigationMap";

interface SavedParkingLocation {
  lat: number;
  lon: number;
  address: string;
  time: string;
  date: string;
}

export const AttendeeParking = () => {
  const [parkingZones, setParkingZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLocation, setSavedLocation] = useState<SavedParkingLocation | null>(null);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Load saved parking location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("parkingLocation");
    if (saved) {
      try {
        setSavedLocation(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }
  }, []);

  // Load parking zones
  useEffect(() => {
    const unsubscribe = getParkingZones((zones) => {
      setParkingZones(zones);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get current user location for navigation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => console.log("Could not get location:", error)
      );
    }
  }, []);

  const handleSaveLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location services."
      });
      return;
    }

    setSavingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Get address using reverse geocoding
        let address = "Parking Location";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          address = data.display_name?.split(",").slice(0, 3).join(", ") || "Parking Location";
        } catch (e) {
          console.log("Could not get address:", e);
        }

        const parkingData: SavedParkingLocation = {
          lat: latitude,
          lon: longitude,
          address: address,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString()
        };

        // Save to localStorage
        localStorage.setItem("parkingLocation", JSON.stringify(parkingData));
        setSavedLocation(parkingData);
        setSavingLocation(false);

        toast.success("Parking Location Saved!", {
          description: "You can now navigate back to your car anytime."
        });
      },
      (error) => {
        setSavingLocation(false);
        toast.error("Could not get location", {
          description: "Please enable location services and try again."
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearLocation = () => {
    localStorage.removeItem("parkingLocation");
    setSavedLocation(null);
    toast.success("Parking location cleared");
  };

  const handleNavigateToCar = () => {
    if (!savedLocation) return;
    // Open in-app navigation
    setIsNavigating(true);
  };

  const handleNavigateToZone = (zone: any) => {
    if (!zone.coordinates || !userLocation) {
      // If no coordinates, just show a message
      toast.info("Navigation Available Soon", {
        description: "Parking zone coordinates will be updated by organizers."
      });
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${zone.coordinates.lat},${zone.coordinates.lon}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-secondary text-secondary-foreground";
      case "limited": return "bg-amber-500 text-white";
      case "full": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "limited": return "Limited";
      case "full": return "Full";
      default: return status;
    }
  };

  const getAvailabilityPercentage = (zone: typeof parkingZones[0]) => {
    return Math.round(((zone.capacity - zone.occupied) / zone.capacity) * 100);
  };

  return (
    <AttendeeLayout>
      <div className="space-y-6 pb-20 lg:pb-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Smart Parking
          </h1>
          <p className="text-muted-foreground mt-1">
            Save your parking location & navigate back easily
          </p>
        </motion.div>

        {/* Saved location card */}
        {savedLocation ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-5 h-5 text-secondary" />
                  Your Vehicle Location Saved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-foreground">{savedLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Parked at {savedLocation.time} on {savedLocation.date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    📍 Coordinates: {savedLocation.lat.toFixed(6)}, {savedLocation.lon.toFixed(6)}
                  </div>
                </div>

                {/* Map Preview */}
                <div className="rounded-lg overflow-hidden border border-border h-40">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${savedLocation.lon - 0.002},${savedLocation.lat - 0.002},${savedLocation.lon + 0.002},${savedLocation.lat + 0.002}&layer=mapnik&marker=${savedLocation.lat},${savedLocation.lon}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleNavigateToCar} className="flex-1 gap-2">
                    <Navigation className="w-4 h-4" />
                    Navigate to My Car
                  </Button>
                  <Button variant="outline" onClick={handleClearLocation} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Opens in-app navigation with real-time directions
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Save Your Parking Location</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tap the button below to save your current GPS location where you parked
                </p>
                <Button
                  onClick={handleSaveLocation}
                  className="gap-2"
                  disabled={savingLocation}
                >
                  {savingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Current Location
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Parking zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Event Parking Zones</h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading parking info...
            </div>
          ) : parkingZones.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <ParkingCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No parking zones available for this event.</p>
                <p className="text-sm mt-1">Organizers will add parking info soon.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {parkingZones.map((zone, index) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-border/50",
                      selectedZone?.id === zone.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedZone(zone)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <ParkingCircle className="w-6 h-6 text-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{zone.name}</h3>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                getStatusColor(zone.status)
                              )}>
                                {getStatusText(zone.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {zone.distance}
                              </span>
                              <span>
                                {zone.capacity - zone.occupied} / {zone.capacity} spots
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">
                            {getAvailabilityPercentage(zone)}%
                          </div>
                          <p className="text-xs text-muted-foreground">available</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            zone.status === "full" ? "bg-destructive" :
                              zone.status === "limited" ? "bg-amber-500" : "bg-secondary"
                          )}
                          style={{ width: `${getAvailabilityPercentage(zone)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Selected zone details */}
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Navigate to {selectedZone.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Distance: <span className="font-medium text-foreground">{selectedZone.distance}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available spots: <span className="font-medium text-foreground">{selectedZone.capacity - selectedZone.occupied}</span>
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    disabled={selectedZone.status === "full"}
                    onClick={() => handleNavigateToZone(selectedZone)}
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Button>
                </div>
                {selectedZone.status === "full" && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>This zone is currently full. Please select another zone.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* In-app Navigation Modal */}
      {isNavigating && savedLocation && (
        <NavigationMap
          destination={{ lat: savedLocation.lat, lon: savedLocation.lon }}
          destinationLabel="Your Car"
          onClose={() => setIsNavigating(false)}
        />
      )}
    </AttendeeLayout>
  );
};
