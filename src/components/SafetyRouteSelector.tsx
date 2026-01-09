import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface Route {
    id: string;
    distance: number;
    duration: number;
    safety: {
        score: number;
        label: string;
        color: string;
    };
}

interface SafetyRouteSelectorProps {
    routes: Route[];
    selectedRouteId: string | null;
    onSelect: (routeId: string) => void;
}

const SafetyRouteSelector = ({ routes, selectedRouteId, onSelect }: SafetyRouteSelectorProps) => {
    if (!routes || routes.length === 0) return null;

    return (
        <Card className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[1000] shadow-xl border-border/80 backdrop-blur-sm bg-background/95">
            <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Available Routes</span>
                    <Badge variant="outline">{routes.length} options</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 max-h-[30vh] overflow-y-auto pb-4">
                {routes.map((route, idx) => (
                    <div
                        key={route.id}
                        onClick={() => onSelect(route.id)}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                            selectedRouteId === route.id ? "border-primary bg-accent" : "border-border"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2 h-10 rounded-full",
                                route.safety.color === 'green' && "bg-green-500",
                                route.safety.color === 'yellow' && "bg-yellow-500",
                                route.safety.color === 'red' && "bg-red-500"
                            )} />
                            <div>
                                <div className="font-semibold text-sm">
                                    Option {idx + 1}
                                    {route.safety.color === 'green' && <span className="ml-2 text-green-600 text-xs">(Recommended)</span>}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <Clock className="w-3 h-3" /> {route.duration} min
                                    <span>•</span>
                                    <Navigation className="w-3 h-3" /> {route.distance}m
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant={route.safety.color === 'red' ? "destructive" : "secondary"}
                            className={cn(
                                route.safety.color === 'green' && "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
                                route.safety.color === 'yellow' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
                            )}
                        >
                            {route.safety.label}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default SafetyRouteSelector;
