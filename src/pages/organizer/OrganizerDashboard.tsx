import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  Car,
  Bell,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Activity,
  Radio
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { NavLink } from "react-router-dom";
import { SOSPanel } from "@/components/organizer/SOSPanel";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEvents, getActiveEmergencyRequests, EmergencyRequest } from "@/lib/db";

const statsCards = [
  {
    id: "active-users",
    title: "Active Users",
    value: "0",
    change: "Live", // Changed to indicate real-time
    trend: "neutral",
    icon: Users,
    color: "bg-primary"
  },
  {
    title: "Crowd Density",
    value: "0%",
    change: "0%",
    trend: "neutral",
    icon: Activity,
    color: "bg-amber-500"
  },
  {
    title: "Emergency Requests",
    value: "0",
    change: "0",
    trend: "neutral",
    icon: AlertTriangle,
    color: "bg-destructive"
  },
  {
    title: "Parking Occupancy",
    value: "0%",
    change: "0%",
    trend: "neutral",
    icon: Car,
    color: "bg-accent"
  },
];

const zones: any[] = [];



const emergencyRequests: any[] = []; // Currently static, should be fetched if real-time needed

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyRequest[]>([]);

  // Real-time Emergency Requests
  useEffect(() => {
    if (!user) return;

    let unsubscribe: () => void;

    if (selectedEventId !== "all") {
      unsubscribe = getActiveEmergencyRequests(selectedEventId, (requests) => {
        setActiveEmergencies(requests);
      });
    } else {
      // If "all", listen to all active requests and filter by my events
      // Note: In production, use a compound query or cloud function to tag requests with organizerId
      const q = query(
        collection(db, "emergency_requests"),
        where("status", "in", ["pending", "responding"])
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmergencyRequest[];
        // Filter to only show requests for events this organizer owns
        const myEventIds = events.map(e => e.id);
        const myRequests = allRequests.filter(req => myEventIds.includes(req.eventId));

        // Sort by timestamp desc
        myRequests.sort((a, b) => {
          const tA = a.timestamp?.seconds || 0;
          const tB = b.timestamp?.seconds || 0;
          return tB - tA;
        });

        setActiveEmergencies(myRequests);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, selectedEventId, events]); // Re-run when events list updates

  useEffect(() => {
    if (!user) return;

    let q;
    // Filter alerts by event if selected, or all alerts for organizer's events if "all"
    // Since we don't have an easy "all organizer alerts" query without an index on organizerId in alerts,
    // we'll keep it simple: if "all", show empty or fetch all active alerts?
    // Let's assume we can query alerts by eventId.

    if (selectedEventId !== "all") {
      q = query(
        collection(db, "alerts"),
        where("eventId", "==", selectedEventId),
        // where("active", "==", true) // Optional
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveAlerts(alerts);
      });
      return () => unsubscribe();
    } else {
      setActiveAlerts([]); // Reset or implement "all" fetching strategy if needed
    }
  }, [user, selectedEventId]);

  // Fetch events list
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const allEvents = await getEvents();
        const myEvents = allEvents.filter(e => e.organizerId === user.uid);
        setEvents(myEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, [user]);

  // Real-time Active User Tracking
  useEffect(() => {
    if (!user) return;

    let q;

    // If specific event selected, filter by ID
    if (selectedEventId !== "all") {
      q = query(
        collection(db, "events"),
        where("__name__", "==", selectedEventId) // Filter by document ID
      );
    } else {
      // Otherwise get all events for organizer
      q = query(
        collection(db, "events"),
        where("organizerId", "==", user.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += (data.activeAttendees || 0);
      });
      setTotalActiveUsers(total);
    });

    return () => unsubscribe();
  }, [user, selectedEventId]);

  const getCrowdColor = (status: string) => {
    switch (status) {
      case "high": return "bg-destructive";
      case "medium": return "bg-amber-500";
      case "low": return "bg-secondary";
      default: return "bg-muted";
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Event Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time overview of your event
              </p>
            </div>

            {/* Event Switcher */}
            <div className="w-[200px]">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id!}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* SOS Panel - Top Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SOSPanel />
        </motion.div>

        {/* Stats cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.id === "active-users" ? totalActiveUsers : stat.value}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground`}>
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Live Tracking Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Live Crowd Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      View real-time attendee locations and heatmaps
                    </p>
                  </div>
                </div>
                <Button asChild size="lg">
                  <NavLink to="/organizer/live-tracking">
                    Open Live Map
                  </NavLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">{/*
          {/* Zone density */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Zone Crowd Density</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <NavLink to="/organizer/crowd">View Details</NavLink>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.length > 0 ? zones.map((zone, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getCrowdColor(zone.status)}`} />
                          <span className="text-sm font-medium text-foreground">{zone.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">{zone.users} users</span>
                          <span className="font-semibold text-foreground">{zone.crowd}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getCrowdColor(zone.status)}`}
                          style={{ width: `${zone.crowd}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No zones configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Alerts</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <NavLink to="/organizer/alerts">View All</NavLink>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedEventId === "all" ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Select an event to view recent alerts
                    </div>
                  ) : activeAlerts.length > 0 ? activeAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${alert.severity === "critical" ? "bg-destructive" :
                        alert.severity === "warning" ? "bg-amber-500" : "bg-primary"
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{alert.title || alert.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.createdAt ? new Date(alert.createdAt.seconds * 1000).toLocaleTimeString() : "Just now"}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent alerts for this event
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Emergency requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`border-destructive/30 bg-destructive/5 ${activeEmergencies.length > 0 ? "animate-pulse-subtle border-destructive ring-1 ring-destructive" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 text-destructive ${activeEmergencies.length > 0 ? "animate-pulse" : ""}`} />
                  Active Emergency Requests ({activeEmergencies.length})
                </CardTitle>
                <Button variant="destructive" size="sm" asChild>
                  <NavLink to="/organizer/emergencies">Manage All</NavLink>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {activeEmergencies.length > 0 ? activeEmergencies.map((req) => (
                  <Card key={req.id} className="border-border/50 bg-card border-red-500/20 shadow-red-500/10 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground text-red-600">{req.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium animate-pulse bg-red-100 text-red-700`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {req.description && (
                          <p className="italic text-xs mb-2">"{req.description}"</p>
                        )}
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.location ? (
                            <a
                              href={`https://www.google.com/maps?q=${req.location.lat},${req.location.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-primary"
                            >
                              {req.location.label || `Lat: ${req.location.lat.toFixed(4)}, Lng: ${req.location.lng.toFixed(4)}`}
                            </a>
                          ) : "Unknown Location"}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {req.timestamp?.seconds ? new Date(req.timestamp.seconds * 1000).toLocaleTimeString() : "Just now"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                    No active emergency requests for this event.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};
