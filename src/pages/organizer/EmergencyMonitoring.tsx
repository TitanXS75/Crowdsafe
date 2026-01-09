import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  Check,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const initialEmergencies: any[] = [];

const statusOptions = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "responding", label: "Responding" },
  { id: "resolved", label: "Resolved" },
];

export const EmergencyMonitoring = () => {
  const [emergencies, setEmergencies] = useState(initialEmergencies);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const filteredEmergencies = filter === "all"
    ? emergencies
    : emergencies.filter(e => e.status === filter);

  const activeCount = emergencies.filter(e => e.status !== "resolved").length;

  const updateStatus = (id: number, newStatus: string) => {
    setEmergencies(prev => prev.map(e =>
      e.id === id ? { ...e, status: newStatus } : e
    ));
    toast({
      title: "Status Updated",
      description: `Emergency request marked as ${newStatus}.`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Medical": return "🏥";
      case "Security": return "🛡️";
      case "Lost Child": return "👶";
      default: return "⚠️";
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "received": return "bg-destructive text-destructive-foreground";
      case "responding": return "bg-amber-500 text-white";
      case "resolved": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high": return "border-destructive bg-destructive/5";
      case "medium": return "border-amber-500/50 bg-amber-500/5";
      default: return "border-border";
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              Emergency Monitoring
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeCount} active emergency requests
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-lg">
            <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium text-destructive">Live Monitoring</span>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {statusOptions.map((opt) => (
            <Button
              key={opt.id}
              variant={filter === opt.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt.id)}
            >
              {opt.label}
              {opt.id !== "all" && (
                <span className="ml-1 text-xs">
                  ({emergencies.filter(e => e.status === opt.id).length})
                </span>
              )}
            </Button>
          ))}
        </motion.div>

        {/* Emergency list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="space-y-4">
            {filteredEmergencies.map((emergency, index) => (
              <motion.div
                key={emergency.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * index }}
              >
                <Card className={cn("border transition-all", getPriorityStyles(emergency.priority))}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Type icon */}
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{getTypeIcon(emergency.type)}</span>
                        <div className="lg:hidden">
                          <h3 className="font-semibold text-foreground">{emergency.type}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize inline-block mt-1",
                            getStatusStyles(emergency.status)
                          )}>
                            {emergency.status}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="hidden lg:flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{emergency.type}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            getStatusStyles(emergency.status)
                          )}>
                            {emergency.status}
                          </span>
                          {emergency.priority === "high" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                              High Priority
                            </span>
                          )}
                        </div>

                        <p className="text-muted-foreground">{emergency.description}</p>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {emergency.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {emergency.time}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {emergency.status === "received" && (
                          <Button
                            onClick={() => updateStatus(emergency.id, "responding")}
                            className="gap-1"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Respond
                          </Button>
                        )}
                        {emergency.status === "responding" && (
                          <Button
                            variant="secondary"
                            onClick={() => updateStatus(emergency.id, "resolved")}
                            className="gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Resolve
                          </Button>
                        )}
                        <Button variant="outline" size="icon">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {filteredEmergencies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-secondary/20 mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <p className="font-semibold text-foreground">All Clear!</p>
            <p className="text-muted-foreground">No emergency requests matching this filter.</p>
          </motion.div>
        )}
      </div>
    </OrganizerLayout>
  );
};
