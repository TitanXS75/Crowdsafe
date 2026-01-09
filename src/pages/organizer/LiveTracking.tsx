import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { OrganizerLayout } from '@/components/organizer/OrganizerLayout';
import { NavLink } from 'react-router-dom';
import LiveCrowdMap from '@/components/LiveCrowdMap';
import { useEffect } from 'react';

import { getEvents, EventData, getActiveAlerts, AlertData, getEventRealtime } from "@/lib/db";

const LiveTracking = () => {
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [event, setEvent] = useState<any>(null);
    const [activeAttendees, setActiveAttendees] = useState(0);

    // Load current event from localStorage
    useState(() => {
        const storedEvent = localStorage.getItem("currentEvent");
        if (storedEvent) {
            try {
                const parsedEvent = JSON.parse(storedEvent);
                setEvent(parsedEvent);
                // Initialize active count from stored event if available, though it might be stale
                setActiveAttendees(parsedEvent.activeAttendees || 0);
            } catch (error) {
                console.error("Error parsing event:", error);
            }
        }
    });

    // Real-time listener for event data (including activeAttendees)
    useEffect(() => {
        if (!event?.id) return;

        const unsubscribe = getEventRealtime(event.id, (updatedEvent) => {
            if (updatedEvent) {
                // Update local stats
                setActiveAttendees(updatedEvent.activeAttendees || 0);

                // Optional: Update full event object if needed, but be careful of re-renders
                // setEvent(prev => ({ ...prev, ...updatedEvent }));
            }
        });

        return () => unsubscribe();
    }, [event?.id]);

    // If no event is selected, show a message
    if (!event) {
        return (
            <OrganizerLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                No Event Selected
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Please select an event first to view live tracking.
                            </p>
                            <Button asChild>
                                <NavLink to="/organizer/events">
                                    Select Event
                                </NavLink>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </OrganizerLayout>
        );
    }

    const eventId = event.id || "demo-event-123";
    const mapConfig = event.mapConfig || {
        center: [28.6139, 77.2090], // Default to Delhi
        zoom: 16,
        boundaries: [
            [
                [28.614, 77.208],
                [28.614, 77.210],
                [28.613, 77.210],
                [28.613, 77.208]
            ]
        ]
    };

    return (
        <OrganizerLayout>
            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <NavLink to="/organizer">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </NavLink>
                        </Button>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                Live Crowd Tracking
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {event.name} - Real-time attendee locations
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-border/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Map Controls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="heatmap"
                                        checked={showHeatmap}
                                        onCheckedChange={setShowHeatmap}
                                    />
                                    <Label htmlFor="heatmap" className="text-sm">
                                        Show Heatmap
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="stats"
                                        checked={showStats}
                                        onCheckedChange={setShowStats}
                                    />
                                    <Label htmlFor="stats" className="text-sm">
                                        Show Statistics
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Map Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid lg:grid-cols-4 gap-6"
                >
                    {/* Main Map */}
                    <div className="lg:col-span-3">
                        <Card className="border-border/50 h-[600px]">
                            <CardContent className="p-0 h-full">
                                <LiveCrowdMap
                                    eventId={eventId}
                                    config={mapConfig}
                                    showHeatmap={showHeatmap}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Panel */}
                    {showStats && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Quick Stats */}
                            <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Live Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Attendees</span>
                                        <span className="font-semibold">{activeAttendees}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Safe</span>
                                        <span className="font-semibold text-green-600">0</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Need Attention</span>
                                        <span className="font-semibold text-amber-600">0</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Emergency</span>
                                        <span className="font-semibold text-red-600">0</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Zone Density */}
                            <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Zone Density
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Main Stage</span>
                                            <span className="text-muted-foreground">0%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full w-0 bg-green-500 rounded-full transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Food Court</span>
                                            <span className="text-muted-foreground">0%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full w-0 bg-green-500 rounded-full transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Exit Points</span>
                                            <span className="text-muted-foreground">0%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full w-0 bg-green-500 rounded-full transition-all" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Alerts */}
                            <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Active Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        No active alerts
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </OrganizerLayout>
    );
};

export default LiveTracking;
