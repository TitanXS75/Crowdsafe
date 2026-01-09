import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Plus,
  Edit,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getParkingZones, updateParkingZone } from "@/lib/db";

export const ParkingManagement = () => {
  const [zones, setZones] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = getParkingZones((updatedZones) => {
      setZones(updatedZones);
    });
    return () => unsubscribe();
  }, []);

  const totalCapacity = zones.reduce((sum, z) => sum + parseInt(z.capacity || 0), 0);
  const totalOccupied = zones.reduce((sum, z) => sum + parseInt(z.occupied || 0), 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const toggleZoneStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "closed" ? "open" : "closed";
      await updateParkingZone(id, { status: newStatus });
      toast({
        title: "Zone Status Updated",
        description: "Parking zone status has been changed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update zone status.",
        variant: "destructive",
      });
    }
  };

  const toggleEmergency = async (id: string, currentEmergency: boolean) => {
    try {
      await updateParkingZone(id, { emergency: !currentEmergency });
      toast({
        title: "Emergency Mode Toggled",
        description: "Parking zone emergency mode has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update emergency mode.",
        variant: "destructive",
      });
    }
  };

  const getOccupancyColor = (zone: any) => {
    const capacity = parseInt(zone.capacity || 1);
    const occupied = parseInt(zone.occupied || 0);
    const percentage = (occupied / capacity) * 100;
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-secondary";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return "bg-secondary/20 text-secondary";
      case "full": return "bg-destructive/20 text-destructive";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
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
              Parking Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Control parking zones and capacity
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Zone
          </Button>
        </motion.div>

        {/* Overview stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalCapacity}</p>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalOccupied}</p>
              <p className="text-sm text-muted-foreground">Currently Parked</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalCapacity - totalOccupied}</p>
              <p className="text-sm text-muted-foreground">Available Spots</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={cn(
                "text-3xl font-bold",
                overallOccupancy >= 90 ? "text-destructive" :
                  overallOccupancy >= 70 ? "text-amber-500" : "text-secondary"
              )}>
                {overallOccupancy}%
              </p>
              <p className="text-sm text-muted-foreground">Overall Occupancy</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parking zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Parking Zones
              </CardTitle>
              <CardDescription>Manage individual parking areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.map((zone, index) => (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * index }}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      zone.emergency ? "border-destructive bg-destructive/5" : "border-border"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{zone.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            getStatusBadge(zone.status)
                          )}>
                            {zone.status}
                          </span>
                          {zone.emergency && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Emergency
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{zone.occupied} / {zone.capacity} spots</span>
                          <span>{zone.capacity - zone.occupied} available</span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden w-full max-w-md">
                          <div
                            className={cn("h-full rounded-full transition-all", getOccupancyColor(zone))}
                            style={{ width: `${(zone.occupied / zone.capacity) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Emergency</span>
                          <Switch
                            checked={zone.emergency}
                            onCheckedChange={() => toggleEmergency(zone.id, zone.emergency)}
                          />
                        </div>

                        <Button
                          variant={zone.status === "closed" ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleZoneStatus(zone.id, zone.status)}
                        >
                          {zone.status === "closed" ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Open
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Close
                            </>
                          )}
                        </Button>

                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};
