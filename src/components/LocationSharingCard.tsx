import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { startLocationTracking } from '@/services/locationService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface LocationSharingCardProps {
    eventId?: string;
}

export const LocationSharingCard = ({ eventId }: LocationSharingCardProps) => {
    const { user } = useAuth();
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cleanup, setCleanup] = useState<(() => void) | null>(null);

    const startSharing = async () => {
        if (!eventId || !user) {
            toast.error('Unable to start location sharing');
            return;
        }

        // Check if geolocation is available
        if (!('geolocation' in navigator)) {
            setError('Geolocation is not supported by your browser');
            toast.error('Geolocation not supported');
            return;
        }

        setError(null);

        // Check permission status first
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                if (permission.state === 'denied') {
                    setError('Location permission denied. Click the help icon for instructions.');
                    toast.error('Location permission denied');
                    return;
                }
            }
        } catch (e) {
            // Permissions API might not be available, continue anyway
            console.log('Permissions API not available');
        }

        const cleanupFn = startLocationTracking(
            eventId,
            user.uid,
            user.displayName || 'Anonymous Attendee',
            (err) => {
                setError(err.message);
                toast.error(err.message);
                setIsSharing(false);
                if (cleanup) {
                    cleanup();
                    setCleanup(null);
                }
            }
        );

        setCleanup(() => cleanupFn);
        setIsSharing(true);
        setError(null);
        toast.success('Location sharing started');
    };

    const stopSharing = () => {
        if (cleanup) {
            cleanup();
            setCleanup(null);
        }
        setIsSharing(false);
        setError(null);
        toast.info('Location sharing stopped');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanup) cleanup();
        };
    }, [cleanup]);

    if (!eventId) return null;

    return (
        <Card className={`border-2 transition-all ${isSharing ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border/50'
            }`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSharing ? 'bg-green-500 animate-pulse' : 'bg-muted'
                            }`}>
                            {isSharing ? (
                                <MapPin className="w-5 h-5 text-white" />
                            ) : (
                                <MapPinOff className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">
                                    {isSharing ? '🟢 Sharing Location' : 'Location Sharing'}
                                </h3>
                                {!isSharing && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>How to Enable Location Sharing</DialogTitle>
                                                <DialogDescription className="space-y-4 pt-4">
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Why share your location?</h4>
                                                        <p className="text-sm">
                                                            Location sharing helps organizers monitor crowd density and ensure your safety during the event.
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold mb-2">If you see a "Permission Denied" error:</h4>
                                                        <ol className="text-sm space-y-2 list-decimal pl-5">
                                                            <li>Look for a location icon 📍 in your browser's address bar</li>
                                                            <li>Click it and select "Allow" or "Always Allow"</li>
                                                            <li>If blocked, you may need to clear the block in browser settings</li>
                                                            <li>Refresh the page and try again</li>
                                                        </ol>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold mb-2">Chrome/Edge:</h4>
                                                        <p className="text-sm">Settings → Privacy and security → Site settings → Location → Allow this site</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold mb-2">Firefox:</h4>
                                                        <p className="text-sm">Settings → Privacy & Security → Permissions → Location → Allow this site</p>
                                                    </div>

                                                    <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                                                        <p className="text-xs text-amber-900 dark:text-amber-100">
                                                            <strong>Privacy:</strong> Your location is only shared while you're at this event and only visible to event organizers.
                                                        </p>
                                                    </div>
                                                </DialogDescription>
                                            </DialogHeader>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isSharing
                                    ? 'Organizers can see your location'
                                    : 'Help organizers track crowd density'
                                }
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant={isSharing ? 'destructive' : 'default'}
                        onClick={isSharing ? stopSharing : startSharing}
                    >
                        {isSharing ? 'Stop' : 'Start'}
                    </Button>
                </div>
                {error && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/30">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
                        <div className="flex-1">
                            <p className="text-xs text-destructive font-medium">{error}</p>
                            {error.includes('permission') && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Click the help icon (?) above for instructions
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
