import { useState, useEffect, useCallback } from "react";
// ... (start of file is fine, I will target the specific area)

// Need to update imports at the top first, but replace_file_content works on chunks. 
// I'll do two chunks or use multi_replace.

import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Save,
  Clock,
  Users,
  Info,
  Plus,
  Edit,
  Trash2,
  X,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createEvent, getEvents, updateEvent, deleteEvent, EventData } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MapEditor from "@/components/MapEditor";

const initialEventData: EventData = {
  name: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  expectedAttendees: "",
  mapEmbedUrl: "",
};

export const EventSetup = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [eventData, setEventData] = useState<EventData>(initialEventData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  // Fetch organizer's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        console.log("🔄 Fetching events from database...");
        const allEvents = await getEvents();
        console.log("📥 RAW events from database:", allEvents);
        // Filter events by organizer
        const myEvents = allEvents.filter(e => e.organizerId === user.uid);
        console.log("📥 My filtered events:", myEvents);
        console.log("📥 First event details:", myEvents[0]);
        setEvents(myEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, [user]);

  const handleSave = async () => {
    console.log("=== SAVE started ===");
    console.log("Is editing?", isEditing);
    console.log("Editing ID:", editingId);
    console.log("Current event data:", eventData);

    if (!eventData.name || !eventData.location || !eventData.startDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in event name, location, and start date.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingId) {
        // Update existing event
        console.log("🔄 UPDATING event with ID:", editingId);
        console.log("📦 Data being sent:", eventData);

        // Make sure we're not sending the ID in the update data
        const { id, ...dataToUpdate } = eventData;
        console.log("📤 Final payload (without id):", dataToUpdate);

        await updateEvent(editingId, dataToUpdate);
        console.log("✅ UPDATE COMPLETED!");

        toast({
          title: "Event Updated!",
          description: "Your event has been updated successfully.",
        });
      } else {
        // Create new event with organizer info
        const eventWithOrganizer = {
          ...eventData,
          organizerId: user?.uid || "",
          organizerEmail: user?.email || "",
          organizerName: userData?.orgName || userData?.name || "",
        };
        console.log("Creating new event:", eventWithOrganizer);
        await createEvent(eventWithOrganizer);
        toast({
          title: "Event Created!",
          description: "Your event has been saved successfully.",
        });
      }

      // Reset form and refresh events
      setEventData(initialEventData);
      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);

      // Refresh events list
      console.log("🔄 Refreshing events...");
      const allEvents = await getEvents();
      console.log("📋 All events:", allEvents.length);
      const myEvents = allEvents.filter(e => e.organizerId === user?.uid);
      console.log("📋 My events:", myEvents.length);
      setEvents(myEvents);
      console.log("✅ Events refreshed!");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save event.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapConfigChange = useCallback((config: any, facilities: any[]) => {
    setEventData(prev => {
      // Deep comparison check could be expensive, just check if anything changed conceptually or let React handle it.
      // Simplest: just update.
      return {
        ...prev,
        mapConfig: config,
        facilities: facilities
      };
    });
  }, []);

  const handleEdit = (event: EventData) => {
    console.log("📝 EDITING event:", event);
    console.log("Event ID:", event.id);
    console.log("Map config:", event.mapConfig);
    console.log("Facilities:", event.facilities);
    setEventData(event);
    setEditingId(event.id || null);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(eventId);
      toast({
        title: "Event Deleted",
        description: "The event has been removed.",
      });
      // Refresh events list
      const allEvents = await getEvents();
      const myEvents = allEvents.filter(e => e.organizerId === user?.uid);
      setEvents(myEvents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEventData(initialEventData);
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Event Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your events
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          )}
        </motion.div>

        {/* Event Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Form Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Event" : "Create New Event"}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Basic Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      value={eventData.name}
                      onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location"
                        className="pl-10"
                        value={eventData.location}
                        onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={eventData.description}
                    onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Expected Attendees</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="attendees"
                      type="number"
                      className="pl-10"
                      value={eventData.expectedAttendees}
                      onChange={(e) => setEventData(prev => ({ ...prev, expectedAttendees: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={eventData.startDate}
                      onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={eventData.endDate}
                      onChange={(e) => setEventData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Daily Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="startTime"
                        type="time"
                        className="pl-10"
                        value={eventData.startTime}
                        onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Daily End Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="endTime"
                        type="time"
                        className="pl-10"
                        value={eventData.endTime}
                        onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Embed URL - Option for External Maps */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  External Map Embed (Optional)
                </CardTitle>
                <CardDescription>
                  Use Google My Maps or paste an iframe embed URL instead of the interactive editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mapEmbedUrl">Map Embed URL or iFrame Code</Label>
                    <Textarea
                      id="mapEmbedUrl"
                      rows={3}
                      placeholder='Paste iframe code like: <iframe src="https://www.google.com/maps/d/embed?mid=..." width="640" height="480"></iframe>'
                      value={eventData.mapEmbedUrl || ""}
                      onChange={(e) => setEventData(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>How to get Google My Maps embed code</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p>1. Create your map at <a href="https://www.google.com/maps/d/" target="_blank" rel="noopener" className="text-primary underline">Google My Maps</a></p>
                      <p>2. Click "Share" → Make it public or unlisted</p>
                      <p>3. Click the ⋮ menu → "Embed on my site"</p>
                      <p>4. Copy the entire iframe code and paste above</p>
                    </AlertDescription>
                  </Alert>
                  {eventData.mapEmbedUrl && (
                    <div className="p-3 bg-secondary/20 rounded-md border">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <div className="aspect-video bg-muted rounded overflow-hidden">
                        <iframe
                          src={eventData.mapEmbedUrl.includes('<iframe')
                            ? eventData.mapEmbedUrl.match(/src="([^"]+)"/)?.[1] || ''
                            : eventData.mapEmbedUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Interactive Map Editor (Optional)
                </CardTitle>
                <CardDescription>
                  Or design your own map with boundaries, zones, and facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Interactive Map Configuration</AlertTitle>
                    <AlertDescription>
                      Draw the event boundaries and mark restricted zones using the tools below.
                      Note: If you provided an embed URL above, that will be used instead.
                    </AlertDescription>
                  </Alert>

                  <MapEditor
                    key={editingId || 'new'}
                    onConfigChange={handleMapConfigChange}
                    initialConfig={eventData.mapConfig}
                    initialFacilities={eventData.facilities}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* Events List */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Your Events ({events.length})</CardTitle>
                <CardDescription>Events you have created</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No events yet</p>
                    <p className="text-sm mt-1">Create your first event to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{event.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {event.startDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => event.id && handleDelete(event.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </OrganizerLayout>
  );
};
