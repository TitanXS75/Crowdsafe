import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Send, Loader2, Megaphone } from "lucide-react";
import { createAlert } from "@/lib/db"; // Use existing createAlert
import { toast } from "sonner";
import { collection, getDocs, query, where, limit } from "firebase/firestore"; // Import needed
import { db } from "@/lib/firebase"; // Import db
import { useAuth } from "@/contexts/AuthContext";

interface SOSForm {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    zone: string;
}

export function SOSPanel() {
    const { id: paramEventId } = useParams();
    const { user } = useAuth();
    const [eventId, setEventId] = useState<string | null>(paramEventId || null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [form, setForm] = useState<SOSForm>({
        title: "",
        message: "",
        severity: "critical",
        zone: "All Zones",
    });

    // Auto-resolve Event ID if not in URL
    useEffect(() => {
        if (!eventId && user) {
            const fetchOrganizerEvent = async () => {
                try {
                    const q = query(
                        collection(db, "events"),
                        where("organizerId", "==", user.uid),
                        limit(1)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const foundId = snapshot.docs[0].id;
                        console.log("Auto-detected Event ID:", foundId);
                        setEventId(foundId);
                    }
                } catch (err) {
                    console.error("Failed to auto-detect event:", err);
                }
            };
            fetchOrganizerEvent();
        }
    }, [eventId, user]);

    const handleDeploy = async () => {
        if (!eventId) {
            toast.error("Event ID missing. Cannot deploy.");
            return;
        }

        setIsSending(true);
        try {

            // Updated Flow: Delegate all SOS logic (Alert Creation + Email) to Backend
            const response = await fetch("http://localhost:5000/api/send-sos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventId: eventId,
                    alertDetails: form,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Backend failed to process SOS");
            }

            const result = await response.json();
            console.log("SOS Broadcast Result:", result);

            toast.success("SOS Deployed Successfully!", {
                description: result.message || "Emergency alert broadcasted."
            });

            setIsOpen(false);
            setForm({ title: "", message: "", severity: "critical", zone: "All Zones" });

        } catch (error) {
            console.error("SOS Deployment Failed:", error);
            toast.error("Failed to deploy Emergency Alert", { description: String(error) });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-600">
                    <Megaphone className="h-5 w-5" />
                    <CardTitle>Emergency Broadcast System</CardTitle>
                </div>
                <CardDescription>
                    Instantly notify all event attendees via In-App Notification and Email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full gap-2 font-bold py-6 text-lg hover:animate-none">
                            <AlertTriangle className="h-6 w-6" />
                            DEPLOY SOS ALERT
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-red-500 sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                CONFIRM EMERGENCY BROADCAST
                            </DialogTitle>
                            <DialogDescription>
                                This will trigger a CRITICAL ALERT to all active attendees immediately.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Alert Title (Short & Clear)</Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g., SEVERE WEATHER WARNING"
                                    className="font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Severity</Label>
                                    <Select value={form.severity} onValueChange={(v: any) => setForm({ ...form, severity: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Zone</Label>
                                    <Input
                                        value={form.zone}
                                        onChange={(e) => setForm({ ...form, zone: e.target.value })}
                                        placeholder="e.g. Main Stage"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Message / Instructions</Label>
                                <Textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder="Please proceed to the nearest exit immediately..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeploy}
                                disabled={isSending || !form.title || !form.message}
                                className="gap-2"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                CONFIRM & SEND
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
