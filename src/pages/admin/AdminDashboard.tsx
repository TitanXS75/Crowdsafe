import { useEffect, useState } from "react";
import { getPendingMapEvents, updateEvent, EventData } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    MapPin,
    Save,
    ExternalLink,
    CheckCircle,
    Map,
    Info,
    Users,
    Trash2,
    Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Initial users will be empty or minimal for the demo
const initialUsers = [
    { id: 1, name: "Attendee One", email: "attendee1@example.com", role: "Attendee" },
    { id: 2, name: "Organizer One", email: "organizer1@example.com", role: "Organizer" },
];

export const AdminDashboard = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [users, setUsers] = useState(initialUsers);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const allEvents = await getPendingMapEvents();
            setEvents(allEvents);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMap = async (eventId: string, embedCode: string) => {
        let src = embedCode;
        if (embedCode.includes("<iframe")) {
            const match = embedCode.match(/src="([^"]+)"/);
            if (match && match[1]) {
                src = match[1];
            }
        }

        try {
            await updateEvent(eventId, { mapEmbedUrl: src });
            toast({
                title: "Map Updated",
                description: "The event map has been successfully linked.",
            });
            fetchEvents();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update map.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteUser = (userId: number) => {
        setUsers(users.filter(u => u.id !== userId));
        toast({
            title: "User Deleted",
            description: "The user has been permanently removed.",
            variant: "destructive"
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System oversight and configuration</p>
                </div>

                <Tabs defaultValue="maps" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="maps">Event Maps</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                    </TabsList>

                    {/* Maps Tab */}
                    <TabsContent value="maps" className="space-y-6">
                        {/* Map Guide Section */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Map className="w-5 h-5" />
                                    Map Making Instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                                        <h3 className="font-semibold">Create Map</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Go to Google My Maps. Create a new map, add layers for zones, routes, and POIs tailored to the event location.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                                        <h3 className="font-semibold">Get Embed Link</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Click "Share" and make it public. Then click the folder menu (three dots) and select "Embed on my site". Copy the HTML Iframe code.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                                        <h3 className="font-semibold">Share or Apply</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Paste the code below for the specific event, or send the link directly to the organizer via WhatsApp to input themselves.
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild className="mt-4">
                                    <a href="https://www.google.com/maps/d/" target="_blank" rel="noreferrer">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open Google My Maps
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Pending Requests */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                                Pending Map Requests
                            </h2>
                            {loading ? (
                                <p>Loading pending requests...</p>
                            ) : events.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                                        <p>All events have configured maps.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {events.map(event => (
                                        <EventMapCard key={event.id} event={event} onSave={handleSaveMap} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Attendees Column */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Attendees
                                    </CardTitle>
                                    <CardDescription>Manage registered attendees</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {users.filter(u => u.role === 'Attendee').map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {users.filter(u => u.role === 'Attendee').length === 0 && (
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
                                        Organizers
                                    </CardTitle>
                                    <CardDescription>Manage event organizers</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {users.filter(u => u.role === 'Organizer').map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {users.filter(u => u.role === 'Organizer').length === 0 && (
                                            <p className="text-center py-6 text-sm text-muted-foreground">No organizers found.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
};

const EventMapCard = ({ event, onSave }: { event: EventData, onSave: (id: string, code: string) => void }) => {
    const [embedCode, setEmbedCode] = useState("");

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
                <div className="bg-muted/30 p-3 rounded-md text-xs space-y-1">
                    <p className="text-muted-foreground">Requested Location:</p>
                    <p className="font-medium">{event.location}</p>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium">Embed Code / Link</label>
                    <Textarea
                        placeholder='Paste <iframe...> or link here...'
                        value={embedCode}
                        onChange={(e) => setEmbedCode(e.target.value)}
                        className="font-mono text-xs resize-none"
                        rows={3}
                    />
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button
                    className="w-full"
                    onClick={() => event.id && onSave(event.id, embedCode)}
                    disabled={!embedCode}
                >
                    <Save className="w-4 h-4 mr-2" />
                    Link Map
                </Button>
            </CardFooter>
        </Card>
    );
};
