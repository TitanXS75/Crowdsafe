import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "react-router-dom";

interface AlertData {
    id: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    zone: string;
    time: string;
    active: boolean;
}

export function SOSPopup({ eventId: propEventId }: { eventId?: string }) {
    const { id: paramEventId } = useParams();
    const eventId = propEventId || paramEventId;
    const [alert, setAlert] = useState<AlertData | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!eventId) return;

        // Listen for the most recent active alert for this event
        const q = query(
            collection(db, "alerts"),
            where("eventId", "==", eventId),
            where("active", "==", true),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const newAlert = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AlertData;
                // Only trigger if we get a new alert or if the alert is different
                setAlert(prev => {
                    if (prev?.id !== newAlert.id) {
                        setIsOpen(true);
                        // Optional: Play sound or vibrate here
                        return newAlert;
                    }
                    return prev;
                });
            } else {
                // If alert is deactivated, close popup
                setIsOpen(false);
                setAlert(null);
            }
        });

        return () => unsubscribe();
    }, [eventId]);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case "critical":
                return "border-red-600 bg-red-50 dark:bg-red-950/90";
            case "warning":
                return "border-orange-500 bg-orange-50 dark:bg-orange-950/90";
            default:
                return "border-blue-500 bg-blue-50 dark:bg-blue-950/90";
        }
    };

    const getSeverityIcon = (severity: string) => {
        return severity === "critical" ? <AlertTriangle className="h-12 w-12 text-red-600 animate-pulse" /> : <ShieldAlert className="h-10 w-10 text-orange-600" />;
    };

    if (!alert) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className={`sm:max-w-md border-4 shadow-2xl z-[9999] ${getSeverityStyles(alert.severity)}`} onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-white rounded-full shadow-lg">
                        {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-black tracking-tighter uppercase text-red-700">
                            {alert.title}
                        </DialogTitle>
                        <DialogDescription className="font-semibold text-lg text-red-900/80">
                            Event Zone: {alert.zone}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="p-6 bg-white/60 dark:bg-black/20 rounded-lg border border-red-200 backdrop-blur-sm">
                    <p className="text-xl font-bold text-center leading-relaxed text-red-950 dark:text-red-100">
                        {alert.message}
                    </p>
                </div>

                <div className="bg-red-100/50 p-2 rounded text-center text-xs text-red-800 font-mono">
                    Timestamp: {new Date(alert.time).toLocaleTimeString()}
                </div>

                <DialogFooter className="sm:justify-center w-full">
                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => setIsOpen(false)}
                        className="w-full text-lg font-bold py-6 shadow-xl hover:scale-[1.02] transition-transform"
                    >
                        I ACKNOWLEDGE
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
