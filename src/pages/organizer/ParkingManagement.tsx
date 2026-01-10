import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Plus,
  Edit,
  AlertTriangle,
  Check,
  X,
  MapPin,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getParkingZones,
  getParkingZonesByEvent,
  updateParkingZone,
  createParkingZone,
  deleteParkingZone,
  getParkedVehicles,
  ParkedVehicle,
  getEvents,
  EventData
} from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ParkingZone {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  status: string;
  emergency: boolean;
  published: boolean;
  eventId?: string;
  coordinates?: { lat: number; lng: number };
}

export const ParkingManagement = () => {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [vehicles, setVehicles] = useState<ParkedVehicle[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ParkingZone | null>(null);
  const [newZone, setNewZone] = useState({ name: "", capacity: 50 });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load organizer's events (only events created by this organizer)
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      const allEvents = await getEvents();
      // Filter to only show events created by this organizer
      const organizerEvents = allEvents.filter(e => e.organizerId === user.uid);
      setEvents(organizerEvents);
      // Auto-select first event if available
      if (organizerEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(organizerEvents[0].id || "");
      }
    };
    loadEvents();
  }, [user]);

  // Load parking zones for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    const unsubscribe = getParkingZonesByEvent(selectedEventId, (updatedZones) => {
      setZones(updatedZones);
    });
    return () => unsubscribe();
  }, [selectedEventId]);

  // Load real-time parked vehicles
  useEffect(() => {
    if (!selectedEventId) return;
    const unsubscribe = getParkedVehicles(selectedEventId, (updatedVehicles) => {
      setVehicles(updatedVehicles);
    });
    return () => unsubscribe();
  }, [selectedEventId]);

  // Calculate real-time stats
  const totalCapacity = zones.reduce((sum, z) => sum + parseInt(String(z.capacity || 0)), 0);
  const totalOccupied = vehicles.length; // Real count from Firestore
  const availableSpots = Math.max(0, totalCapacity - totalOccupied);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const handleAddZone = async () => {
    if (!newZone.name.trim()) {
      toast({ title: "Error", description: "Zone name is required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      await createParkingZone({
        name: newZone.name,
        capacity: newZone.capacity,
        eventId: selectedEventId
      });
      toast({ title: "Zone Created", description: `${newZone.name} has been added.` });
      setIsAddModalOpen(false);
      setNewZone({ name: "", capacity: 50 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create zone", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    try {
      await deleteParkingZone(id);
      toast({ title: "Zone Deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete zone", variant: "destructive" });
    }
  };

  const toggleZoneStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "closed" ? "open" : "closed";
      await updateParkingZone(id, { status: newStatus });
      toast({ title: "Status Updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const toggleEmergency = async (id: string, currentEmergency: boolean) => {
    try {
      await updateParkingZone(id, { emergency: !currentEmergency });
      toast({ title: "Emergency Mode Toggled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const togglePublish = async (id: string, currentPublished: boolean) => {
    try {
      await updateParkingZone(id, { published: !currentPublished });
      toast({
        title: currentPublished ? "Unpublished" : "Published",
        description: currentPublished ? "Zone hidden from attendees" : "Zone visible to attendees"
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const getOccupancyColor = (occupied: number, capacity: number) => {
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
              Control parking zones, view real-time vehicle locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Event Selector */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              {events.length === 0 && <option value="">No events found</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <Button className="gap-2" onClick={() => setIsAddModalOpen(true)} disabled={!selectedEventId}>
              <Plus className="w-4 h-4" />
              Add Zone
            </Button>
          </div>
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
              <p className="text-3xl font-bold text-foreground">{availableSpots}</p>
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

        {/* Parked Vehicles List */}
        {vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Parked Vehicles ({vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {vehicles.map((vehicle, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-3 bg-muted rounded-lg">
                      <span>🚗</span>
                      <span className="text-muted-foreground flex-1">{vehicle.address}</span>
                      <span className="text-xs text-muted-foreground">
                        {vehicle.parkedAt ? new Date(vehicle.parkedAt as any).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Parking zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Parking Zones ({zones.length})
              </CardTitle>
              <CardDescription>Manage individual parking areas</CardDescription>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No parking zones created yet.</p>
                  <Button className="mt-4 gap-2" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4" /> Add First Zone
                  </Button>
                </div>
              ) : (
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
                            {zone.published ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Published
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Hidden
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>Capacity: {zone.capacity} spots</span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 bg-muted rounded-full overflow-hidden w-full max-w-md">
                            <div
                              className={cn("h-full rounded-full transition-all", getOccupancyColor(zone.occupied || 0, zone.capacity))}
                              style={{ width: `${Math.min(100, ((zone.occupied || 0) / zone.capacity) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Emergency</span>
                            <Switch
                              checked={zone.emergency}
                              onCheckedChange={() => toggleEmergency(zone.id, zone.emergency)}
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePublish(zone.id, zone.published)}
                          >
                            {zone.published ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            {zone.published ? "Hide" : "Publish"}
                          </Button>

                          <Button
                            variant={zone.status === "closed" ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleZoneStatus(zone.id, zone.status)}
                          >
                            {zone.status === "closed" ? (
                              <><Check className="w-4 h-4 mr-1" /> Open</>
                            ) : (
                              <><X className="w-4 h-4 mr-1" /> Close</>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteZone(zone.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Zone Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parking Zone</DialogTitle>
            <DialogDescription>
              Create a new parking zone for your event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., Zone A, North Parking"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (spots)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={newZone.capacity.toString()}
                onChange={(e) => setNewZone({ ...newZone, capacity: Math.max(1, parseInt(e.target.value) || 1) })}
                placeholder="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddZone} disabled={creating}>
              {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OrganizerLayout>
  );
};
