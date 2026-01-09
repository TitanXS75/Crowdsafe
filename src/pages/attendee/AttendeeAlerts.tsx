import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  Bell,
  Clock,
  MapPin,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { cn } from "@/lib/utils";
import { getActiveAlerts, AlertData } from "@/lib/db";

export const AttendeeAlerts = () => {
  const [alertList, setAlertList] = useState<(AlertData & { read: boolean })[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const storedEvent = JSON.parse(localStorage.getItem("currentEvent") || "null");

    const unsubscribe = getActiveAlerts((alerts) => {
      // Filter for current event and EXCLUDE emergencies
      const relevantAlerts = alerts.filter(a =>
        a.eventId === storedEvent?.id &&
        a.type !== "emergency"
      );

      // Add 'read' status
      const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
      const alertsWithRead = relevantAlerts.map(a => ({
        ...a,
        read: readAlerts.includes(a.id),
        time: a.time ? new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
      }));
      setAlertList(alertsWithRead as any);
    });
    return () => unsubscribe();
  }, []);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical": return AlertTriangle;
      case "warning": return AlertCircle;
      case "info": return Info;
      default: return Bell;
    }
  };

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-destructive/5 border-destructive/30",
          icon: "bg-destructive text-destructive-foreground",
          badge: "bg-destructive text-destructive-foreground"
        };
      case "warning":
        return {
          bg: "bg-amber-500/5 border-amber-500/30",
          icon: "bg-amber-500 text-white",
          badge: "bg-amber-500 text-white"
        };
      case "info":
        return {
          bg: "bg-primary/5 border-primary/30",
          icon: "bg-primary text-primary-foreground",
          badge: "bg-primary text-primary-foreground"
        };
      default:
        return {
          bg: "bg-muted",
          icon: "bg-muted-foreground text-white",
          badge: "bg-muted-foreground text-white"
        };
    }
  };

  const markAsRead = (id: string) => {
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    if (!readAlerts.includes(id)) {
      readAlerts.push(id);
      localStorage.setItem('readAlerts', JSON.stringify(readAlerts));
    }
    setAlertList(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const dismissAlert = (id: string) => {
    setAlertList(prev => prev.filter(alert => alert.id !== id));
  };

  const markAllAsRead = () => {
    setAlertList(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const filteredAlerts = filter === "unread"
    ? alertList.filter(a => !a.read)
    : alertList;

  const unreadCount = alertList.filter(a => !a.read).length;

  return (
    <AttendeeLayout>
      <div className="space-y-6 pb-20 lg:pb-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Alerts & Announcements
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2"
        >
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({alertList.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
        </motion.div>

        {/* Alert list */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No alerts to show</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const Icon = getAlertIcon(alert.severity);
              const styles = getAlertStyles(alert.severity);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.03 }}
                >
                  <Card className={cn(
                    "transition-all",
                    styles.bg,
                    !alert.read && "shadow-md"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", styles.icon)}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={cn(
                                "font-semibold text-foreground",
                                !alert.read && "font-bold"
                              )}>
                                {alert.title}
                              </h3>
                              {!alert.read && (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.zone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.time}
                            </span>
                            {!alert.read && (
                              <button
                                className="text-primary hover:underline"
                                onClick={() => markAsRead(alert.id)}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </AttendeeLayout>
  );
};
