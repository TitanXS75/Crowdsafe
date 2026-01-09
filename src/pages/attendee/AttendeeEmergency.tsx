import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Phone,
  Heart,
  Shield,
  Users,
  MapPin,
  Send,
  Check,
  Clock,
  Navigation,
  Loader2
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getFacilities } from "@/lib/db";

const emergencyTypes = [
  {
    id: "medical",
    icon: Heart,
    label: "Medical Help",
    description: "First aid, medical emergency",
    color: "bg-destructive",
    textColor: "text-destructive"
  },
  {
    id: "security",
    icon: Shield,
    label: "Security / Police",
    description: "Safety concern, suspicious activity",
    color: "bg-amber-500",
    textColor: "text-amber-500"
  },
  {
    id: "lost",
    icon: Users,
    label: "Lost Person / Child",
    description: "Missing family member or friend",
    color: "bg-primary",
    textColor: "text-primary"
  },
  {
    id: "other",
    icon: AlertTriangle,
    label: "Type Manually",
    description: "Describe the situation",
    color: "bg-gray-500",
    textColor: "text-gray-500"
  }
];

import { createEmergencyRequest } from "@/lib/db";
import { Textarea } from "@/components/ui/textarea";

export const AttendeeEmergency = () => {
  const [nearbyHelp, setNearbyHelp] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'responding' | 'resolved'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = getFacilities((facilities) => {
      setNearbyHelp(facilities);
    });
    return () => unsubscribe();
  }, []);

  const handleEmergencyRequest = async () => {
    setSharingLocation(true);
    setIsSubmitting(true);

    // Get location
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      setSharingLocation(false);
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const currentEventString = localStorage.getItem("currentEvent");
        if (!currentEventString) {
          toast({
            title: "Error",
            description: "Event session invalid. Please rejoin the event.",
            variant: "destructive"
          });
          return;
        }
        const currentEvent = JSON.parse(currentEventString);
        if (!currentEvent.id) {
          console.error("No event ID found in storage");
          toast({
            title: "Error",
            description: "Invalid event data. Please rejoin.",
            variant: "destructive"
          });
          return;
        }

        const userId = "temp-attendee-id"; // Use real auth ID if available, otherwise anonymous/temp

        console.log("📍 Creating emergency request with eventId:", currentEvent.id);
        const newRequestId = await createEmergencyRequest({
          type: selectedType === "other" ? "Manual" : emergencyTypes.find(t => t.id === selectedType)?.label || "Emergency",
          description: selectedType === "other" ? manualDescription : "",
          userId: userId,
          eventId: currentEvent.id, // Ensure this is valid
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "Shared Location" // In real app, reverse geocode here
          },
          status: 'pending',
          timestamp: new Date()
        });

        console.log("✅ Emergency request created successfully! ID:", newRequestId);
        setRequestId(newRequestId); // Store the ID to listen to it
        setRequestStatus('pending');
        setRequestSent(true);
        toast({
          title: "Help is on the way!",
          description: "Emergency responders have been notified. Stay where you are.",
          duration: 5000,
        });
      } catch (error) {
        console.error("Error sending request:", error);
        toast({
          title: "Error",
          description: "Failed to send emergency request. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setSharingLocation(false);
        setIsSubmitting(false);
      }
    }, (error) => {
      console.error("Location error:", error);
      toast({
        title: "Location Error",
        description: "Unable to retrieve your location. Request sent without location.",
        variant: "destructive"
      });
      // Fallback: Send request WITHOUT location if critical?
      // For now, let's stop and force location as per request but could allow fallback.
      setSharingLocation(false);
      setIsSubmitting(false);
    });
  };

  const handleNotifyOrganizer = () => {
    // Logic to just scroll down or highlight the request form?
    // User requested: "instead of these 'Emergency Hotline' write notify organizer immediately"
    // and remove the call functionality button logic.
    // The previous handleCall logic is removed.
  };

  // Real-time status monitoring
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = onSnapshot(doc(db, "emergency_requests", requestId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRequestStatus(data.status);
        if (data.status === 'resolved') {
          toast({
            title: "Emergency Resolved",
            description: "Staff has marked this incident as resolved.",
            variant: "default", // or success if available
          });
        }
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  if (requestSent) {
    return (
      <AttendeeLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md w-full px-4"
          >
            {/* Dynamic Status Icon */}
            <div className={cn(
              "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse",
              requestStatus === 'responding' ? "bg-amber-500/20" :
                requestStatus === 'resolved' ? "bg-green-500/20" :
                  "bg-secondary/20"
            )}>
              {requestStatus === 'responding' ? (
                <Navigation className="w-12 h-12 text-amber-500" />
              ) : requestStatus === 'resolved' ? (
                <Check className="w-12 h-12 text-green-500" />
              ) : (
                <Loader2 className="w-12 h-12 text-secondary animate-spin" />
              )}
            </div>

            {/* Dynamic Title */}
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {requestStatus === 'responding' ? "Help is Coming!" :
                requestStatus === 'resolved' ? "Resolved" :
                  "Request Sent"}
            </h1>

            {/* Dynamic Message */}
            <p className="text-muted-foreground mb-8 text-lg">
              {requestStatus === 'responding'
                ? "Staff has seen your request and is on the way."
                : requestStatus === 'resolved'
                  ? "This emergency request has been marked as resolved."
                  : "Waiting for staff acknowledgement..."}
            </p>

            <Card className="glass border-border/50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Location Shared</p>
                      <p className="text-sm text-muted-foreground">Live Tracking Active</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full uppercase",
                    requestStatus === 'responding' ? "bg-amber-100 text-amber-700" :
                      "bg-secondary/20 text-secondary"
                  )}>
                    {requestStatus === 'pending' ? 'Sent' : requestStatus}
                  </span>
                </div>
              </CardContent>
            </Card>

            {requestStatus !== 'resolved' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground animate-pulse">
                  Keep this screen open (or minimized) so we can track you.
                </p>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setRequestSent(false);
                    setSelectedType(null);
                    setManualDescription("");
                    setSharingLocation(false);
                    setRequestId(null);
                  }}
                >
                  Cancel Request
                </Button>
              </div>
            )}

            {requestStatus === 'resolved' && (
              <Button
                className="w-full mt-4"
                onClick={() => {
                  setRequestSent(false);
                  setRequestId(null);
                  // navigate('/attendee/dashboard'); // Optional
                }}
              >
                Return to Dashboard
              </Button>
            )}
          </motion.div>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="space-y-6 pb-20 lg:pb-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Emergency Help
          </h1>
          <p className="text-muted-foreground mt-1">
            Get immediate assistance when you need it
          </p>
        </motion.div>

        {/* Quick call button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-destructive-foreground animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Notify Organizer Immediately</h3>
                    <p className="text-muted-foreground">Select an issue below to alert staff</p>
                  </div>
                </div>
                {/* Call button removed as per request */}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">What do you need help with?</h2>
          <div className="grid gap-3">
            {emergencyTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-border/50",
                    selectedType === type.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", type.color)}>
                        <type.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        selectedType === type.id ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                        {selectedType === type.id && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Manual Type Input */}
          {selectedType === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3"
            >
              <Textarea
                placeholder="Please describe the emergency..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="bg-card w-full p-3 min-h-[100px]"
                disabled={isSubmitting}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Send request button */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              size="lg"
              className="w-full gap-2 h-14 text-lg"
              onClick={handleEmergencyRequest}
              disabled={sharingLocation || isSubmitting}
            >
              {sharingLocation || isSubmitting ? (
                <>
                  <MapPin className="w-5 h-5 animate-pulse" />
                  {sharingLocation ? "Sharing Location..." : "Sending Request..."}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Emergency Request
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Your location will be automatically shared with responders
            </p>
          </motion.div>
        )}

        {/* Nearby help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Nearby Help Desks</h2>
          <div className="space-y-3">
            {nearbyHelp.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No nearby health desks available.</div>
            ) : nearbyHelp.map((help, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{help.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {help.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {help.waitTime}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </AttendeeLayout>
  );
};
