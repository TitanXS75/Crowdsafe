import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LiveCrowdMap from '@/components/LiveCrowdMap';
import { subscribeToEventLocations, AttendeeLocation } from '@/services/locationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, AlertTriangle, AlertCircle, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const LiveTracking = () => {
    const { user } = useAuth();
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [eventData, setEventData] = useState<any>(null);
    const [locations, setLocations] = useState<Record<string, AttendeeLocation>>({});
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'attention' | 'emergency'>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Load all events for this organizer
    useEffect(() => {
        const loadEvents = async () => {
            if (!user) return;

            try {
                const eventsQuery = query(
                    collection(db, 'events'),
                    where('organizerId', '==', user.uid)
                );

                const eventsSnapshot = await getDocs(eventsQuery);

                if (!eventsSnapshot.empty) {
                    const events = eventsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort by createdAt descending (most recent first)
                    events.sort((a: any, b: any) => {
                        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
                        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
                        return bTime - aTime;
                    });

                    setAllEvents(events);
                    // Auto-select the most recent event
                    setSelectedEventId(events[0].id);
                    setIsLoading(false); // Fix: Set loading to false after events load
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error loading events:', error);
                setIsLoading(false);
            }
        };

        loadEvents();
    }, [user]);

    // Load selected event data and subscribe to locations
    useEffect(() => {
        if (!selectedEventId) return;

        const selectedEvent = allEvents.find(e => e.id === selectedEventId);
        if (!selectedEvent) return;

        setEventData(selectedEvent);

        // Subscribe to live locations
        const unsubscribe = subscribeToEventLocations(selectedEventId, (updatedLocations) => {
            setLocations(updatedLocations);
        });

        return () => unsubscribe();
    }, [selectedEventId, allEvents]);

    const attendeeCount = Object.keys(locations).length;
    const safeCount = Object.values(locations).filter(l => l.status === 'safe').length;
    const attentionCount = Object.values(locations).filter(l => l.status === 'attention').length;
    const emergencyCount = Object.values(locations).filter(l => l.status === 'emergency').length;

    const filteredAttendees = Object.values(locations).filter(loc =>
        filterStatus === 'all' ? true : loc.status === filterStatus
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading live tracking...</p>
                </div>
            </div>
        );
    }

    if (!eventData && allEvents.length === 0 && !isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="p-8 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
                    <p className="text-gray-600 mb-4">
                        You need to create an event first to use live tracking.
                    </p>
                    <Button onClick={() => window.location.href = '/organizer/event-setup'}>
                        Create Event
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-primary" />
                                Live Crowd Tracking
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">{eventData?.name || 'Select an event'}</p>
                        </div>

                        {/* Event Selector - Always show if events exist */}
                        {allEvents.length > 0 && (
                            <div className="ml-4">
                                <Select value={selectedEventId || ''} onValueChange={setSelectedEventId}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allEvents.map((event) => (
                                            <SelectItem key={event.id} value={event.id}>
                                                {event.name} - {new Date(event.createdAt?.toDate?.() || event.createdAt).toLocaleDateString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <Card className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="text-2xl font-bold">{attendeeCount}</div>
                                    <div className="text-xs text-gray-600">Active</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-green-500" />
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{safeCount}</div>
                                    <div className="text-xs text-gray-600">Safe</div>
                                </div>
                            </div>
                        </Card>
                        {emergencyCount > 0 && (
                            <Card className="px-4 py-2 border-red-500">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">{emergencyCount}</div>
                                        <div className="text-xs text-gray-600">Emergency</div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map Section */}
                <div className="flex-1 relative">
                    {eventData && eventData.mapConfig ? (
                        <LiveCrowdMap
                            eventId={eventData.id}
                            config={eventData.mapConfig}
                            showHeatmap={showHeatmap}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No map configured for this event</p>
                        </div>
                    )}

                    {/* Map Controls */}
                    <div className="absolute bottom-4 left-4 z-[1000]">
                        <Card className="p-2">
                            <Button
                                size="sm"
                                variant={showHeatmap ? 'default' : 'outline'}
                                onClick={() => setShowHeatmap(!showHeatmap)}
                            >
                                {showHeatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
                            </Button>
                        </Card>
                    </div>
                </div>

                {/* Attendee List Sidebar */}
                <div className="w-80 bg-white border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="font-bold mb-3">Attendees ({filteredAttendees.length})</h3>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterStatus('all')}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={filterStatus === 'safe' ? 'default' : 'outline'}
                                onClick={() => setFilterStatus('safe')}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                Safe ({safeCount})
                            </Button>
                            {attentionCount > 0 && (
                                <Button
                                    size="sm"
                                    variant={filterStatus === 'attention' ? 'default' : 'outline'}
                                    onClick={() => setFilterStatus('attention')}
                                    className="bg-amber-500 hover:bg-amber-600"
                                >
                                    Attention ({attentionCount})
                                </Button>
                            )}
                            {emergencyCount > 0 && (
                                <Button
                                    size="sm"
                                    variant={filterStatus === 'emergency' ? 'default' : 'outline'}
                                    onClick={() => setFilterStatus('emergency')}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Emergency ({emergencyCount})
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Attendee List */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-2">
                            {filteredAttendees.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No attendees found</p>
                                </div>
                            ) : (
                                filteredAttendees.map((attendee) => (
                                    <Card key={attendee.userId} className="p-3 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">{attendee.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(attendee.lastSeen).toLocaleTimeString()}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {attendee.lat.toFixed(6)}, {attendee.lng.toFixed(6)}
                                                </div>
                                            </div>
                                            <Badge
                                                className={
                                                    attendee.status === 'emergency'
                                                        ? 'bg-red-500'
                                                        : attendee.status === 'attention'
                                                            ? 'bg-amber-500'
                                                            : 'bg-green-500'
                                                }
                                            >
                                                {attendee.status}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
