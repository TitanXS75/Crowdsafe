import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Map,
  Car,
  AlertTriangle,
  Users,
  Cloud,
  MapPin,
  Navigation,
  Phone,
  Clock,
  TrendingUp,
  Shield,
  RefreshCw,
  LogOut,
  ArrowRightLeft,
  Bell,
  AlertCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { NavLink, useNavigate } from "react-router-dom";
import { getEvents, EventData, getActiveAlerts, AlertData } from "@/lib/db";
import { toast } from "sonner";
import { SOSCheckInModal } from "@/components/SOSCheckInModal";
import { SOSPopup } from "@/components/SOSPopup";

const crowdLevels = {
  low: { color: "bg-secondary", text: "Low", description: "Easy movement" },
  medium: { color: "bg-amber-500", text: "Medium", description: "Moderate density" },
  high: { color: "bg-destructive", text: "High", description: "Move with caution" },
};

const quickActions = [
  {
    icon: Navigation,
    label: "Navigate",
    description: "Find your way",
    path: "/attendee/map",
    color: "bg-primary"
  },
  {
    icon: Car,
    label: "Find Parking",
    description: "Locate & save",
    path: "/attendee/parking",
    color: "bg-accent"
  },
  {
    icon: AlertTriangle,
    label: "Emergency",
    description: "Get help now",
    path: "/attendee/emergency",
    color: "bg-destructive"
  },
];

// Default facilities to show if event has none configured
const defaultFacilities = [
  { icon: "🚻", name: "Restrooms", type: "toilet" },
  { icon: "🏥", name: "Medical Tent", type: "medical" },
  { icon: "🍔", name: "Food Court", type: "food" },
  { icon: "💧", name: "Water Station", type: "water" },
];

// Icon mapping for facility types
const facilityIcons: Record<string, string> = {
  stage: "🎵",
  medical: "🏥",
  food: "🍔",
  water: "💧",
  toilet: "🚻",
  info: "ℹ️",
  parking: "🅿️",
  exit: "🚪",
  special: "⭐",
};

export const AttendeeDashboard = () => {
  const navigate = useNavigate();
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [crowdLevel, setCrowdLevel] = useState<"low" | "medium" | "high">("low");
  const [latestAlert, setLatestAlert] = useState<AlertData | null>(null);

  // Fetch fresh event data from Firestore
  useEffect(() => {
    const fetchEvent = async () => {
      const storedEvent = JSON.parse(localStorage.getItem("currentEvent") || "null");
      if (!storedEvent?.id) {
        setLoading(false);
        return;
      }

      try {
        const allEvents = await getEvents();
        const freshEvent = allEvents.find(e => e.id === storedEvent.id);

        if (freshEvent) {
          setCurrentEvent(freshEvent);
          localStorage.setItem("currentEvent", JSON.stringify(freshEvent));

          // Set crowd level from event data if available
          if (freshEvent.crowdLevel) {
            setCrowdLevel(freshEvent.crowdLevel as "low" | "medium" | "high");
          } else {
            // Calculate based on expected attendees
            const attendees = parseInt(freshEvent.expectedAttendees) || 0;
            if (attendees > 5000) setCrowdLevel("high");
            else if (attendees > 1000) setCrowdLevel("medium");
            else setCrowdLevel("low");
          }
        } else {
          setCurrentEvent(storedEvent);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        setCurrentEvent(storedEvent);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding using free API
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const address = data.address?.suburb || data.address?.city || data.address?.town || "Event Venue";

            setUserLocation({
              lat: latitude,
              lon: longitude,
              address: address
            });

            // Fetch weather for this location
            fetchWeather(latitude, longitude);
          } catch (error) {
            setUserLocation({
              lat: latitude,
              lon: longitude,
              address: "Current Location"
            });
            fetchWeather(latitude, longitude);
          }
        },
        (error) => {
          console.log("Location access denied:", error);
          // Use event location as fallback for weather
          if (currentEvent?.location) {
            // Default to a generic location
            fetchWeather(28.6139, 77.2090); // Default Delhi
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [currentEvent]);

  // Fetch weather from Open-Meteo (free, no API key needed)
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      const data = await response.json();

      if (data.current) {
        const weatherCode = data.current.weather_code;
        let condition = "Clear";

        // Map weather codes to conditions
        if (weatherCode === 0) condition = "Clear ☀️";
        else if (weatherCode <= 3) condition = "Partly Cloudy ⛅";
        else if (weatherCode <= 48) condition = "Foggy 🌫️";
        else if (weatherCode <= 67) condition = "Rainy 🌧️";
        else if (weatherCode <= 77) condition = "Snowy ❄️";
        else if (weatherCode <= 99) condition = "Stormy ⛈️";

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: condition
        });
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  // Fetch real-time alerts
  useEffect(() => {
    const unsubscribe = getActiveAlerts((alerts) => {
      // Filter alerts for current event
      const eventAlerts = alerts.filter(a => a.eventId === currentEvent?.id);

      if (eventAlerts.length > 0) {
        // Prioritize emergency alerts
        const emergency = eventAlerts.find(a => a.type === "emergency");
        if (emergency) {
          setLatestAlert(emergency);
        } else {
          setLatestAlert(eventAlerts[0]); // Get the most recent alert
        }
      } else {
        setLatestAlert(null);
      }
    });
    return () => unsubscribe();
  }, [currentEvent]);

  const currentCrowd = crowdLevels[crowdLevel];

  // Get facilities from event or use defaults
  const eventFacilities = currentEvent?.facilities?.filter((f: any) => f.active) || [];
  const displayFacilities = eventFacilities.length > 0
    ? eventFacilities.slice(0, 4).map((f: any) => ({
      icon: f.icon || facilityIcons[f.type] || "📍",
      name: f.name,
      zone: f.zone || "Event Area"
    }))
    : defaultFacilities.map(f => ({
      icon: f.icon,
      name: f.name,
      zone: "Not configured"
    }));

  if (loading) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AttendeeLayout>
    );
  }

  if (!currentEvent) {
    return (
      <AttendeeLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h1 className="text-2xl font-bold">No Event Selected</h1>
          <p className="text-muted-foreground">Please select an event to get started.</p>
          <Button asChild>
            <NavLink to="/attendee/events">Browse Events</NavLink>
          </Button>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <SOSCheckInModal />
      <SOSPopup eventId={currentEvent?.id} />
      <div className="space-y-6 pb-20 lg:pb-0">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Welcome to {currentEvent.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Your real-time guide to navigating safely
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <NavLink to="/attendee/events">
                  <ArrowRightLeft className="w-4 h-4" />
                  Switch Event
                </NavLink>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  localStorage.removeItem("currentEvent");
                  toast.success("Left the event");
                  window.location.reload();
                }}
              >
                <LogOut className="w-4 h-4" />
                Leave Event
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Alert Banner - Emergency vs Standard */}
        {latestAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {latestAlert.type === 'emergency' ? (
              // EMERGENCY BLOCK
              <Card className="bg-destructive border-destructive text-destructive-foreground animate-pulse">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">{latestAlert.title}</h2>
                    <p className="text-lg font-medium opacity-90">{latestAlert.message}</p>
                  </div>
                  <div className="w-full h-1 bg-white/20 rounded-full my-2" />
                  <p className="text-sm font-semibold uppercase tracking-widest opacity-75">
                    Follow Official Instructions Immediately
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Standard Alert Banner
              <NavLink to="/attendee/alerts">
                <Card className={`cursor-pointer transition-all hover:shadow-md ${latestAlert.severity === 'critical' ? 'bg-destructive/10 border-destructive/30' :
                  latestAlert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-primary/10 border-primary/30'
                  }`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${latestAlert.severity === 'critical' ? 'bg-destructive' :
                      latestAlert.severity === 'warning' ? 'bg-amber-500' :
                        'bg-primary'
                      }`}>
                      {latestAlert.severity === 'critical' ? (
                        <AlertTriangle className="w-4 h-4 text-white" />
                      ) : latestAlert.severity === 'warning' ? (
                        <AlertCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Info className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{latestAlert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{latestAlert.message}</p>
                    </div>
                    <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              </NavLink>
            )}
          </motion.div>
        )}


        {/* Status cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Location card */}
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Your Location</p>
                  <p className="font-semibold text-foreground mt-1">
                    {userLocation ? userLocation.address : "Locating..."}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {userLocation
                        ? `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`
                        : "Enable location"
                      }
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crowd level card */}
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Crowd Level</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${currentCrowd.color}`} />
                    <p className="font-semibold text-foreground">{currentCrowd.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{currentCrowd.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather card */}
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Weather</p>
                  <p className="font-semibold text-foreground mt-1">
                    {weather ? `${weather.temp}°C` : "Loading..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {weather ? weather.condition : "Fetching weather..."}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.path}
                onClick={() => navigate(action.path)}
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Active alerts - HIDDEN IF NONE */}
        {/* Active alerts */}


        {/* Nearby facilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Nearby Facilities</h2>
            <Button variant="ghost" size="sm" asChild>
              <NavLink to="/attendee/map">View Map</NavLink>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {displayFacilities.map((facility: any, index: number) => (
              <Card key={index} className="border-border/50 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-3 text-center">
                  <span className="text-2xl">{facility.icon}</span>
                  <p className="font-medium text-foreground text-sm mt-1">{facility.name}</p>
                  <p className="text-xs text-muted-foreground">{facility.zone}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Safety tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-secondary" />
                Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  Keep your phone charged and emergency contacts ready
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  Note your nearest exit and meeting points
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  Stay hydrated - water stations marked on map
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AttendeeLayout>
  );
};
