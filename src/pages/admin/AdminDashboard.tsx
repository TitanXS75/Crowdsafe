import { useEffect, useState } from "react";
import { getAllUsers, getEvents, UserData, EventData } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    Trash2,
    Shield,
    Calendar,
    MapPin,
    Clock,
    User,
    Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/contexts/AuthContext";

interface ActiveAttendee {
    id: string;
    eventId: string;
    email: string;
    name: string;
    checkedInAt: any;
}

export const AdminDashboard = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [events, setEvents] = useState<EventData[]>([]);
    const [activeAttendees, setActiveAttendees] = useState<ActiveAttendee[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        // Wait for auth state to be ready
        if (authLoading) return;

        if (!user) {
            console.log("❌ No user logged in!");
            setLoading(false);
            return;
        }

        console.log("✅ User logged in:", user.email);
        fetchAllData();
    }, [user, authLoading]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch users
            console.log("🔍 Fetching users from Firestore...");
            const allUsers = await getAllUsers();
            console.log("✅ Users fetched:", allUsers.length, allUsers);
            setUsers(allUsers);

            // Fetch events
            console.log("🔍 Fetching events...");
            const allEvents = await getEvents();
            console.log("✅ Events fetched:", allEvents.length, allEvents);
            setEvents(allEvents);

            // Fetch active attendees from all events
            console.log("🔍 Fetching active attendees...");
            const attendees: ActiveAttendee[] = [];
            for (const event of allEvents) {
                if (!event.id) continue;
                try {
                    const q = query(collection(db, "events", event.id, "active_attendees"));
                    const snapshot = await getDocs(q);
                    snapshot.docs.forEach(doc => {
                        attendees.push({
                            id: doc.id,
                            eventId: event.id!,
                            ...doc.data()
                        } as ActiveAttendee);
                    });
                } catch (e) {
                    console.log("Could not fetch attendees for event", event.id, e);
                }
            }
            console.log("✅ Active attendees:", attendees.length);
            setActiveAttendees(attendees);

        } catch (error) {
            console.error("❌ Failed to fetch data", error);
            toast({
                title: "Error",
                description: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const attendees = users.filter(u => u.role === 'attendee');
    const organizers = users.filter(u => u.role === 'organizer');

    // Group events by organizer
    const eventsByOrganizer = organizers.map(org => ({
        organizer: org,
        events: events.filter(e => e.organizerId === org.uid)
    }));

    // Get event name by ID
    const getEventName = (eventId: string) => {
        return events.find(e => e.id === eventId)?.name || "Unknown Event";
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Complete system overview</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-primary">{users.length}</p>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-blue-500">{attendees.length}</p>
                            <p className="text-sm text-muted-foreground">Attendees</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-purple-500">{organizers.length}</p>
                            <p className="text-sm text-muted-foreground">Organizers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-green-500">{events.length}</p>
                            <p className="text-sm text-muted-foreground">Total Events</p>
                        </CardContent>
                    </Card>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p>Loading dashboard data...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="users" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="events">Events by Organizer</TabsTrigger>
                            <TabsTrigger value="active">Active Attendees</TabsTrigger>
                        </TabsList>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Attendees Column */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary" />
                                            Attendees ({attendees.length})
                                        </CardTitle>
                                        <CardDescription>Registered event attendees</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {attendees.map(user => (
                                                <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-[10px]">{user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{user.name || 'N/A'}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">Attendee</Badge>
                                                </div>
                                            ))}
                                            {attendees.length === 0 && (
                                                <p className="text-center py-6 text-sm text-muted-foreground">No attendees found.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Organizers Column */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-purple-500" />
                                            Organizers ({organizers.length})
                                        </CardTitle>
                                        <CardDescription>Event organizers and their details</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {organizers.map(user => {
                                                const orgEvents = events.filter(e => e.organizerId === user.uid);
                                                return (
                                                    <div key={user.uid} className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">{user.name?.charAt(0) || user.orgName?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium truncate">{user.name || user.orgName || user.email.split('@')[0]}</p>
                                                                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                                                {orgEvents.length} events
                                                            </Badge>
                                                        </div>
                                                        {user.orgName && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                <Building className="w-3 h-3" />
                                                                <span>{user.orgName}</span>
                                                            </div>
                                                        )
                                                        }
                                                    </div>
                                                );
                                            })}
                                            {organizers.length === 0 && (
                                                <p className="text-center py-6 text-sm text-muted-foreground">No organizers found.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Events by Organizer Tab */}
                        <TabsContent value="events" className="space-y-6">
                            {eventsByOrganizer.map(({ organizer, events: orgEvents }) => (
                                <Card key={organizer.uid}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                                    {organizer.name?.charAt(0) || organizer.email.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">{organizer.name || organizer.email}</CardTitle>
                                                <CardDescription className="flex items-center gap-1">
                                                    {organizer.orgName && <><Building className="w-3 h-3" /> {organizer.orgName} •</>}
                                                    {orgEvents.length} event(s)
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {orgEvents.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">No events created yet</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {orgEvents.map(event => (
                                                    <div key={event.id} className="p-4 border rounded-lg bg-muted/20">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-medium">{event.name}</h4>
                                                                <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                                                            </div>
                                                            <Badge variant="secondary">{event.expectedAttendees} expected</Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {event.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {event.startDate}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {event.startTime} - {event.endTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {eventsByOrganizer.length === 0 && (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        No organizers or events found
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Active Attendees Tab */}
                        <TabsContent value="active" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-500" />
                                        Active Event Check-ins ({activeAttendees.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Attendees currently checked into events
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {activeAttendees.length === 0 ? (
                                        <p className="text-center py-8 text-muted-foreground">
                                            No active check-ins at the moment
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {activeAttendees.map((attendee, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <div>
                                                            <p className="font-medium text-sm">{attendee.name || attendee.email}</p>
                                                            <p className="text-xs text-muted-foreground">{attendee.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getEventName(attendee.eventId)}
                                                        </Badge>
                                                        {attendee.checkedInAt && (
                                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                                {new Date(attendee.checkedInAt.toDate?.() || attendee.checkedInAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </AdminLayout >
    );
};
