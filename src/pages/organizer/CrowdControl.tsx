import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Route,
  AlertTriangle,
  Lock,
  Unlock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const initialRoutes: {
  id: number;
  name: string;
  status: string;
  crowd: string;
}[] = [];

const zones: {
  id: number;
  name: string;
  crowd: number;
  capacity: number;
  current: number;
}[] = [];

export const CrowdControl = () => {
  const [routes, setRoutes] = useState(initialRoutes);
  const { toast } = useToast();

  const getCrowdColor = (level: string) => {
    switch (level) {
      case "high": case "blocked": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-amber-500 text-white";
      case "low": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-secondary";
      case "crowded": return "text-amber-500";
      case "closed": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const toggleRouteStatus = (id: number) => {
    setRoutes(prev => prev.map(route => {
      if (route.id === id) {
        const newStatus = route.status === "closed" ? "open" : "closed";
        return { ...route, status: newStatus };
      }
      return route;
    }));
    toast({
      title: "Route Updated",
      description: "Route status has been changed.",
    });
  };

  const triggerCrowdWarning = (zoneName: string) => {
    toast({
      title: "Crowd Warning Sent",
      description: `Alert sent to attendees in ${zoneName}`,
    });
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
            Crowd & Route Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor crowd density and manage routes
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Zone crowd density */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Zone Crowd Density
                </CardTitle>
                <CardDescription>Real-time crowd levels by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{zone.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {zone.current} / {zone.capacity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => triggerCrowdWarning(zone.name)}
                          >
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              zone.crowd >= 80 ? "bg-destructive" :
                                zone.crowd >= 60 ? "bg-amber-500" : "bg-secondary"
                            )}
                            style={{ width: `${zone.crowd}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">0%</span>
                          <span className={cn(
                            "text-xs font-semibold",
                            zone.crowd >= 80 ? "text-destructive" :
                              zone.crowd >= 60 ? "text-amber-500" : "text-secondary"
                          )}>
                            {zone.crowd}%
                          </span>
                          <span className="text-xs text-muted-foreground">100%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Route management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Route Management
                </CardTitle>
                <CardDescription>Control route availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        route.status === "closed" ? "bg-destructive/5 border-destructive/30" : "border-border"
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{route.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs font-medium capitalize",
                            getStatusColor(route.status)
                          )}>
                            {route.status}
                          </span>
                          {route.status !== "closed" && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-xs",
                              getCrowdColor(route.crowd)
                            )}>
                              {route.crowd}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={route.status === "closed" ? "default" : "destructive"}
                        size="sm"
                        className="gap-1"
                        onClick={() => toggleRouteStatus(route.id)}
                      >
                        {route.status === "closed" ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            Open
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Close
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Map preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Live Crowd Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg relative overflow-hidden bg-map-lines">
                {/* Simulated heatmap zones */}
                {/* Heatmap cleared */}
                <div className="absolute inset-0">
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 glass rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground mb-2">Crowd Density</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="text-muted-foreground text-xs">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground text-xs">Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-muted-foreground text-xs">High</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};
