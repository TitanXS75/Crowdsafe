import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, EventData } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

export const EventCatalog = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getEvents();
                setEvents(data);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleSelectEvent = (event: EventData) => {
        localStorage.setItem("currentEvent", JSON.stringify(event));
        navigate("/attendee");
    };

    return (
        <div className="min-h-screen bg-background p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Discover Events</h1>
                    <p className="text-muted-foreground">Choose an event to get started</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Loading events...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">No events found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border/50 hover:shadow-lg transition-all hover:border-primary/50">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Event Info */}
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <CardTitle className="text-2xl text-primary mb-2">{event.name}</CardTitle>
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {event.description}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{event.startDate} - {event.endDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                    {event.startTime && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{event.startTime} - {event.endTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="lg:w-40 flex-shrink-0">
                                                <Button
                                                    className="w-full h-12 text-base font-semibold"
                                                    onClick={() => handleSelectEvent(event)}
                                                >
                                                    Enter Event
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
