import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Plus,
  Send,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  MapPin,
  Trash2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getAlerts, createAlert, getEvents, EventData, deleteAlert } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

const severityOptions = [
  { id: "info", label: "Info", icon: Info, color: "bg-primary" },
  { id: "warning", label: "Warning", icon: AlertCircle, color: "bg-amber-500" },
  { id: "critical", label: "Critical", icon: AlertTriangle, color: "bg-destructive" },
];

export const AlertsBroadcast = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [sentAlerts, setSentAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [zones, setZones] = useState<{ id: string; name: string }[]>([{ id: "all", name: "All Zones" }]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    severity: "info",
    zone: "all",
    type: "alert" as "alert" | "emergency",
  });
  const { toast } = useToast();

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await getEvents();
        // Filter events by organizer
        const myEvents = allEvents.filter(e => e.organizerId === user?.uid);
        setEvents(myEvents);

        if (myEvents.length > 0) {
          setSelectedEventId(myEvents[0].id || "");
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Update zones when event changes
  useEffect(() => {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const eventZones: { id: string; name: string }[] = [{ id: "all", name: "All Zones" }];

    if (selectedEvent?.facilities) {
      selectedEvent.facilities.forEach((facility) => {
        if (facility.zone) {
          // Add unique zones from facilities
          if (!eventZones.find(z => z.id === facility.zone)) {
            eventZones.push({ id: facility.zone || facility.id, name: facility.zone || facility.name });
          }
        }
        // Also add the facility itself as a target
        eventZones.push({ id: facility.id, name: `${facility.name} (${facility.type})` });
      });
    }

    setZones(eventZones);
  }, [selectedEventId, events]);

  useEffect(() => {
    const unsubscribe = getAlerts((alerts) => {
      // Filter alerts by organizer
      const myAlerts = alerts.filter((a: any) => a.organizerId === user?.uid);
      setSentAlerts(myAlerts);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSendAlert = async () => {
    if (!alertData.title || !alertData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAlert({
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity as "info" | "warning" | "critical",
        zone: alertData.zone,
        eventId: selectedEventId,
        organizerId: user?.uid,
        reach: 0,
        type: "alert",
        active: true
      });

      toast({
        title: "Alert Sent!",
        description: `Your ${alertData.severity} alert has been broadcast to attendees.`,
      });
      setAlertData({ title: "", message: "", severity: "info", zone: "all", type: "alert" });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send alert.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmergency = async () => {
    if (!alertData.title || !alertData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the emergency.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAlert({
        title: alertData.title,
        message: alertData.message,
        severity: "critical",
        zone: "all", // Emergencies are always broadcast to all zones
        eventId: selectedEventId,
        organizerId: user?.uid,
        reach: 0,
        type: "emergency",
        active: true
      });

      toast({
        title: "EMERGENCY BROADCAST SENT!",
        description: "This emergency alert has been sent to ALL attendees.",
        variant: "destructive", // Using destructive variant for emphasis
      });
      setAlertData({ title: "", message: "", severity: "info", zone: "all", type: "alert" });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to broadcast emergency.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      toast({
        title: "Alert Deleted",
        description: "The alert has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert.",
        variant: "destructive",
      });
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return { bg: "bg-destructive/10 border-destructive/30", icon: AlertTriangle, iconColor: "text-destructive" };
      case "warning": return { bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle, iconColor: "text-amber-500" };
      default: return { bg: "bg-primary/10 border-primary/30", icon: Info, iconColor: "text-primary" };
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Alerts & Broadcast
            </h1>
            <p className="text-muted-foreground mt-1">
              Send notifications to event attendees
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        </motion.div>

        {/* Create alert form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Create New Alert</CardTitle>
                <CardDescription>Broadcast a notification to attendees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Selector */}
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  {loadingEvents ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading events...
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events found. Create an event first.</p>
                  ) : (
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Alert Title</Label>
                  <Input
                    placeholder="e.g., Route Closure Notice"
                    value={alertData.title}
                    onChange={(e) => setAlertData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Describe the alert details..."
                    rows={3}
                    value={alertData.message}
                    onChange={(e) => setAlertData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <div className="flex gap-2">
                      {severityOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAlertData(prev => ({ ...prev, severity: opt.id }))}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-all",
                            alertData.severity === opt.id
                              ? `${opt.color} text-white border-transparent`
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <opt.icon className="w-4 h-4" />
                          <span className="text-sm">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Zone</Label>
                    <select
                      value={alertData.zone}
                      onChange={(e) => setAlertData(prev => ({ ...prev, zone: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                {alertData.type === "emergency" ? (
                  <Button onClick={handleSendEmergency} variant="destructive" className="gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    BROADCAST EMERGENCY
                  </Button>
                ) : (
                  <Button onClick={handleSendAlert} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send Alert
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

      {/* Sent alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Active Emergencies
              </div>
              {/* Emergency Toggle/Create Button placeholder if needed inline */}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentAlerts.filter((a: any) => a.type === "emergency").length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No active emergencies.
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    setAlertData(prev => ({ ...prev, type: "emergency", severity: "critical", title: "EMERGENCY: ", zone: "all" }));
                    setShowForm(true);
                  }}
                >
                  Declare Emergency
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sentAlerts.filter((a: any) => a.type === "emergency").map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg border bg-destructive/10 border-destructive/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {alert.title}
                        </h3>
                        <p className="text-sm text-foreground mt-1 font-medium">{alert.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/20"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="h-6"></div> {/* Spacer */}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentAlerts.filter((a: any) => a.type !== "emergency").map((alert, index) => {
                const styles = getSeverityStyles(alert.severity);
                const Icon = styles.icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * index }}
                    className={cn("p-4 rounded-lg border", styles.bg)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                        alert.severity === "critical" ? "bg-destructive" :
                          alert.severity === "warning" ? "bg-amber-500" : "bg-primary"
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{alert.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.zone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {alert.reach} reached
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </OrganizerLayout >
  );
};
