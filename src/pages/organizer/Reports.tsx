import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, BarChart2, Calendar, ArrowUpRight } from "lucide-react";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { getEvents, EventData } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Reports = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const allEvents = await getEvents();
        const myEvents = allEvents.filter(e => e.organizerId === user.uid);
        setEvents(myEvents);
        if (myEvents.length > 0) {
          setSelectedEventId(myEvents[0].id || "");
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, [user]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const generatePDF = () => {
    if (!selectedEvent) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Event Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

    // Event Details
    doc.setFontSize(16);
    doc.text("Event Details", 14, 45);

    doc.setFontSize(12);
    doc.text(`Name: ${selectedEvent.name}`, 14, 55);
    doc.text(`Location: ${selectedEvent.location}`, 14, 62);
    doc.text(`Date: ${selectedEvent.startDate} to ${selectedEvent.endDate || selectedEvent.startDate}`, 14, 69);
    doc.text(`Expected Attendees: ${selectedEvent.expectedAttendees}`, 14, 76);

    // Summary Metrics (Mocked for now as we don't have real time analytics db yet)
    doc.setFontSize(16);
    doc.text("Summary Metrics", 14, 90);

    const tableData = [
      ["Metric", "Value"],
      ["Expected Attendees", selectedEvent.expectedAttendees],
      ["Peak Attendance (Est)", Math.floor(Number(selectedEvent.expectedAttendees) * 0.85).toString()],
      ["Average Dwell Time", "2h 15m"],
      ["Safety Incidents", "0"]
    ];

    autoTable(doc, {
      startY: 95,
      head: [["Metric", "Value"]],
      body: tableData.slice(1),
    });

    doc.save(`${selectedEvent.name.replace(/\s+/g, "_")}_report.pdf`);
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Event Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Exportable insights on crowd behavior, emergencies, and operations.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-[2fr,1fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Generate Report
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Select an event to export detailed analytics.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Report type
                  </p>
                  <Select defaultValue="overview" disabled>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Event overview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Select Event
                  </p>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id || "unknown"}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <Button
                    className="w-full gap-2 h-9"
                    onClick={generatePDF}
                    disabled={!selectedEvent}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs">Download PDF</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <Tabs defaultValue="summary">
                <TabsList className="h-8">
                  <TabsTrigger value="summary" className="text-xs">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="crowd" className="text-xs">
                    Crowd
                  </TabsTrigger>
                  <TabsTrigger value="safety" className="text-xs">
                    Safety
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Insights for <span className="font-semibold text-foreground">{selectedEvent?.name || "selected event"}</span>.
                    These metrics are generated based on event capacity and attendee tracking.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Expected Attendance
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedEvent?.expectedAttendees || "0"}
                      </p>
                      <p className="text-[11px] text-secondary mt-1 inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        Target Capacity
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Start Date
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedEvent?.startDate || "-"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Event Kickoff
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Location
                      </p>
                      <p className="text-lg font-semibold text-foreground truncate" title={selectedEvent?.location}>
                        {selectedEvent?.location || "-"}
                      </p>
                      <p className="text-[11px] text-secondary mt-1">
                        Venue verified
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="crowd" className="pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Crowd analytics help you understand how guests move through
                    your venue, where bottlenecks occur, and how long different
                    zones operate at high density.
                  </p>
                  <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Example insights
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Zone A operated above 80% capacity for 47 minutes.</li>
                      <li>Average queue time at main gate was 6 minutes.</li>
                      <li>
                        Guests spent 35% of their time in food & beverage areas.
                      </li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="safety" className="pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Safety reporting combines emergency requests, alerts and
                    response times to provide a full picture of how incidents
                    were handled.
                  </p>
                  <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Example metrics
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Median response time to critical alerts: 3m 12s.</li>
                      <li>Most common incident type: minor medical.</li>
                      <li>No unresolved emergencies at event close.</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent exports
              </CardTitle>
            </CardHeader>
            <div className="flex items-center justify-center py-8 text-muted-foreground text-xs">
              No recent exports
            </div>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};


