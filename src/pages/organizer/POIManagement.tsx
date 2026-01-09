import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getEvents, updateEvent, EventData, EventPOI } from "@/lib/db";

const poiTypes = [
  { id: "all", label: "All", icon: "📍" },
  { id: "stage", label: "Stages", icon: "🎵" },
  { id: "medical", label: "Medical", icon: "🏥" },
  { id: "food", label: "Food", icon: "🍔" },
  { id: "water", label: "Water", icon: "💧" },
  { id: "toilet", label: "Toilets", icon: "🚻" },
  { id: "info", label: "Info", icon: "ℹ️" },
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "exit", label: "Exits", icon: "🚪" },
  { id: "special", label: "Special", icon: "⭐" },
  { id: "custom", label: "Custom / Other", icon: "✨" }, // Added custom type
];

export const POIManagement = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [pois, setPois] = useState<EventPOI[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPoi, setEditingPoi] = useState<EventPOI | null>(null);
  const [newPoi, setNewPoi] = useState({ name: "", type: "toilet", zone: "", description: "" });
  const [customTypeData, setCustomTypeData] = useState({ name: "", icon: "📍" }); // State for custom type details
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const allEvents = await getEvents();
        const myEvents = allEvents.filter(e => e.organizerId === user.uid);
        setEvents(myEvents);
        if (myEvents.length > 0 && !selectedEvent) {
          setSelectedEvent(myEvents[0]);
          setPois(myEvents[0].facilities || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, [user]);

  // Effect to sync custom type data when editing
  useEffect(() => {
    if (editingPoi) {
      const isKnownType = poiTypes.some(t => t.id === editingPoi.type && t.id !== 'custom');
      if (!isKnownType) {
        setCustomTypeData({ name: editingPoi.type, icon: editingPoi.icon });
      } else {
        setCustomTypeData({ name: "", icon: "📍" });
      }
    } else {
      setCustomTypeData({ name: "", icon: "📍" });
    }
  }, [editingPoi]);

  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setPois(event.facilities || []);
    }
  };

  const filteredPois = pois.filter(poi => {
    const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || poi.type === filterType;
    return matchesSearch && matchesType;
  });

  const savePoisToEvent = async (updatedPois: EventPOI[]) => {
    if (!selectedEvent?.id) return;

    try {
      await updateEvent(selectedEvent.id, { facilities: updatedPois });
      setPois(updatedPois);
      setSelectedEvent(prev => prev ? { ...prev, facilities: updatedPois } : null);
    } catch (error) {
      console.error("Error saving POIs:", error);
      throw error;
    }
  };

  const handleAddPoi = async () => {
    if (!newPoi.name) {
      toast({
        title: "Missing Name",
        description: "Please enter a POI name.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let finalType = newPoi.type;
      let finalIcon = poiTypes.find(t => t.id === newPoi.type)?.icon || "📍";

      if (newPoi.type === 'custom') {
        if (!customTypeData.name) {
          toast({ title: "Missing Type Name", description: "Please enter a name for the custom type.", variant: "destructive" });
          setLoading(false);
          return;
        }
        finalType = customTypeData.name;
        finalIcon = customTypeData.icon || "📍";
      }

      const poi: EventPOI = {
        id: Date.now().toString(),
        name: newPoi.name,
        type: finalType,
        icon: finalIcon,
        zone: newPoi.zone || "Main Area",
        description: newPoi.description,
        active: true,
      };

      const updatedPois = [...pois, poi];
      await savePoisToEvent(updatedPois);

      setNewPoi({ name: "", type: "toilet", zone: "", description: "" });
      setShowAddForm(false);
      toast({
        title: "POI Added",
        description: `${poi.name} has been added to the event.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add POI.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoi = async () => {
    if (!editingPoi) return;

    setLoading(true);
    try {
      let finalType = editingPoi.type;
      let finalIcon = editingPoi.icon;

      // Check if we are currently in "custom" mode for the dropdown
      const currentSelectValue = poiTypes.some(t => t.id === editingPoi.type && t.id !== 'custom') ? editingPoi.type : 'custom';

      if (currentSelectValue === 'custom') {
        if (!customTypeData.name) {
          toast({ title: "Missing Type Name", description: "Please enter a name for the custom type.", variant: "destructive" });
          setLoading(false);
          return;
        }
        finalType = customTypeData.name;
        finalIcon = customTypeData.icon;
      } else {
        // Standard type
        finalIcon = poiTypes.find(t => t.id === finalType)?.icon || "📍";
      }

      const updatedPoi = {
        ...editingPoi,
        type: finalType,
        icon: finalIcon,
      };

      const updatedPois = pois.map(p => p.id === updatedPoi.id ? updatedPoi : p);
      await savePoisToEvent(updatedPois);

      setEditingPoi(null);
      toast({
        title: "POI Updated",
        description: `${updatedPoi.name} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update POI.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePoi = async (id: string) => {
    try {
      const updatedPois = pois.map(poi =>
        poi.id === id ? { ...poi, active: !poi.active } : poi
      );
      await savePoisToEvent(updatedPois);
      toast({
        title: "Status Updated",
        description: "POI status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive"
      });
    }
  };

  const deletePoi = async (id: string) => {
    if (!confirm("Delete this POI?")) return;

    try {
      const updatedPois = pois.filter(poi => poi.id !== id);
      await savePoisToEvent(updatedPois);
      toast({
        title: "POI Deleted",
        description: "Point of interest has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete POI.",
        variant: "destructive"
      });
    }
  };

  const getPoiIcon = (type: string) => {
    const poiType = poiTypes.find(t => t.id === type);
    return poiType?.icon || "📍";
  };

  if (events.length === 0) {
    return (
      <OrganizerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">No Events Found</h2>
          <p className="text-muted-foreground mt-2">Create an event first to manage its points of interest.</p>
          <Button className="mt-4" asChild>
            <a href="/organizer/event-setup">Create Event</a>
          </Button>
        </div>
      </OrganizerLayout>
    );
  }

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
              POI Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage points of interest for your events
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add POI
          </Button>
        </motion.div>

        {/* Event Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label className="whitespace-nowrap">Select Event:</Label>
                <select
                  className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedEvent?.id || ""}
                  onChange={(e) => handleEventChange(e.target.value)}
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add/Edit POI Form */}
        {(showAddForm || editingPoi) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {editingPoi ? "Edit POI" : "Add New POI"}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowAddForm(false); setEditingPoi(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="e.g., Main Stage"
                      value={editingPoi?.name || newPoi.name}
                      onChange={(e) => editingPoi
                        ? setEditingPoi({ ...editingPoi, name: e.target.value })
                        : setNewPoi({ ...newPoi, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editingPoi
                          ? (poiTypes.some(t => t.id === editingPoi.type && t.id !== 'custom') ? editingPoi.type : 'custom')
                          : newPoi.type
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (editingPoi) {
                            setEditingPoi({ ...editingPoi, type: val as any }); // 'custom' or standard ID
                          } else {
                            setNewPoi({ ...newPoi, type: val });
                          }
                        }}
                      >
                        {poiTypes.filter(t => t.id !== "all").map(type => (
                          <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Type Fields */}
                    {((editingPoi && !poiTypes.some(t => t.id === editingPoi.type && t.id !== 'custom')) || (!editingPoi && newPoi.type === 'custom')) && (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-2">
                          <Label>Custom Type Name</Label>
                          <Input
                            placeholder="e.g. Security"
                            value={customTypeData.name}
                            onChange={(e) => setCustomTypeData({ ...customTypeData, name: e.target.value })}
                          />
                        </div>
                        <div className="w-24 space-y-2">
                          <Label>Icon</Label>
                          <Input
                            placeholder="👮"
                            value={customTypeData.icon}
                            onChange={(e) => setCustomTypeData({ ...customTypeData, icon: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Input
                      placeholder="e.g., Zone A"
                      value={editingPoi?.zone || newPoi.zone}
                      onChange={(e) => editingPoi
                        ? setEditingPoi({ ...editingPoi, zone: e.target.value })
                        : setNewPoi({ ...newPoi, zone: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={editingPoi ? handleUpdatePoi : handleAddPoi}
                      disabled={loading}
                      className="w-full gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? "Saving..." : editingPoi ? "Update" : "Add POI"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search POIs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {poiTypes.map((type) => (
              <Button
                key={type.id}
                variant={filterType === type.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type.id)}
                className="gap-1 whitespace-nowrap"
              >
                <span>{type.icon}</span>
                {type.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* POI List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">
                Points of Interest ({filteredPois.length})
              </CardTitle>
              <CardDescription>
                POIs for {selectedEvent?.name || "selected event"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPois.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No POIs found</p>
                  <p className="text-sm mt-1">Add points of interest for attendees to find.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPois.map((poi, index) => (
                    <motion.div
                      key={poi.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * index }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all",
                        poi.active
                          ? "bg-card border-border"
                          : "bg-muted/30 border-border/50 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{getPoiIcon(poi.type)}</span>
                        <div>
                          <p className="font-semibold text-foreground">{poi.name}</p>
                          <p className="text-sm text-muted-foreground">{poi.zone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {poi.active ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={poi.active}
                            onCheckedChange={() => togglePoi(poi.id)}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingPoi(poi)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePoi(poi.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};
