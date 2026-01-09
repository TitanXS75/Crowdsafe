import { motion } from "framer-motion";
import { FileText, Download, BarChart2, CalendarRange, ArrowUpRight } from "lucide-react";
import { OrganizerLayout } from "@/components/organizer/OrganizerLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const Reports = () => {
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
                  Choose a time range and report type to export detailed analytics.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Report type
                  </p>
                  <Select defaultValue="overview">
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Event overview</SelectItem>
                      <SelectItem value="crowd">Crowd & movement</SelectItem>
                      <SelectItem value="emergency">Emergencies</SelectItem>
                      <SelectItem value="parking">Parking & access</SelectItem>
                      <SelectItem value="alerts">Alerts & messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Time range
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-9"
                  >
                    <span className="inline-flex items-center gap-1 text-xs">
                      <CalendarRange className="w-3 h-3" />
                      Today (demo)
                    </span>
                  </Button>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <Button className="w-full gap-2 h-9">
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
                    This is a static demo view. In a live deployment, this section
                    would contain key metrics, trends and narrative insights
                    generated from your event data.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Peak attendance
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        0
                      </p>
                      <p className="text-[11px] text-secondary mt-1 inline-flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        0% vs. last event
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Average dwell time
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        0h 0m
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Across all venue zones
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Safety incidents
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        0
                      </p>
                      <p className="text-[11px] text-secondary mt-1">
                        100% resolved within SLA
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


