import { useState, useEffect } from "react";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export function SOSCheckInModal() {
    const { user } = useAuth();
    const { id: paramId } = useParams();

    // Fallback to localStorage if no param
    const storedEvent = JSON.parse(localStorage.getItem("currentEvent") || "{}");
    const eventId = paramId || storedEvent.id;

    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Only show if user is logged in and we have a valid eventId
        if (user && eventId) {
            // Check if already checked in? (Optional: optimize by checking LS or Firestore)
            const hasCheckedIn = sessionStorage.getItem(`sos-checkin-${eventId}`);
            if (!hasCheckedIn) {
                setEmail(user.email || "");
                setIsOpen(true);
            }
        } else if (!eventId) {
            console.warn("SOSCheckIn: No Event ID found in URL or LocalStorage");
        }
    }, [user, eventId]);

    const handleConfirm = async () => {
        if (!eventId || !user || !email) return;

        setIsSubmitting(true);
        try {
            // Get user's name from users collection
            let userName = user.displayName || "";
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    userName = userDoc.data().name || userName;
                }
            } catch (e) {
                console.log("Could not fetch user name", e);
            }

            // Save to Firestore so Backend can find them
            console.log("Checking in user:", user.uid, "to event:", eventId);
            const checkInRef = doc(db, "events", eventId, "active_attendees", user.uid);
            await setDoc(checkInRef, {
                uid: user.uid,
                email: email,
                name: userName || email.split('@')[0], // Use email prefix as fallback
                checkedInAt: serverTimestamp(),
                lastActive: serverTimestamp(),
            });
            console.log("Check-in success at path:", checkInRef.path);

            // 2. Local session flag
            sessionStorage.setItem(`sos-checkin-${eventId}`, "true");

            toast.success("Safe Check-in Confirmed", {
                description: "You will receive emergency alerts for this event.",
                icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
            });
            setIsOpen(false);
        } catch (error) {
            console.error("SOS Check-in failed", error);
            toast.error("Check-in failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md border-orange-500/50">
                <DialogHeader>
                    <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-2">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Emergency Contact Check</DialogTitle>
                    <DialogDescription className="text-center">
                        For your safety during this event, please confirm the email address where you want to receive
                        <strong> Critical Emergency Alerts</strong> (SOS).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Emergency Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="border-orange-200 focus-visible:ring-orange-500"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isSubmitting ? "Confirming..." : "Confirm & Enter Event"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
