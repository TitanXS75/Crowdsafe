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
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { NavLink } from "react-router-dom";
import { SOSPanel } from "@/components/organizer/SOSPanel";

const statsCards = [
  {
    title: "Active Users",
    value: "0",
    change: "0%",
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

const recentAlerts: any[] = [];

const emergencyRequests: any[] = [];

export const OrganizerDashboard = () => {
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Event Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your event
          </p>
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
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
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
                  {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${alert.type === "critical" ? "bg-destructive" :
                        alert.type === "warning" ? "bg-amber-500" : "bg-primary"
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent alerts
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
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Active Emergency Requests
                </CardTitle>
                <Button variant="destructive" size="sm" asChild>
                  <NavLink to="/organizer/emergencies">Manage All</NavLink>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {emergencyRequests.length > 0 ? emergencyRequests.map((req) => (
                  <Card key={req.id} className="border-border/50 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{req.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${req.status === "responding" ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
                          }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.location}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {req.time}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                    No active emergency requests
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
