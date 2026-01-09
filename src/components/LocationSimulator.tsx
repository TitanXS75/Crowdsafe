import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, StopCircle, Users, Zap } from 'lucide-react';
import { updateAttendeeLocation } from '@/services/locationService';

interface LocationSimulatorProps {
    eventId: string;
    center: [number, number];
}

const LocationSimulator = ({ eventId, center }: LocationSimulatorProps) => {
    const [isRunning, setIsRunning] = useState(false);
    const [attendeeCount, setAttendeeCount] = useState(30);
    const [intervals, setIntervals] = useState<number[]>([]);

    // Generate random names for simulated attendees
    const generateName = (index: number) => {
        const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Rowan'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Lopez'];
        return `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
    };

    // Generate random location within radius of center
    const generateRandomLocation = (centerLat: number, centerLng: number, radiusKm: number = 0.5) => {
        const radiusInDegrees = radiusKm / 111; // Convert km to degrees (approximate)

        const u = Math.random();
        const v = Math.random();
        const w = radiusInDegrees * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y = w * Math.sin(t);

        return {
            lat: centerLat + y,
            lng: centerLng + (x / Math.cos(centerLat * Math.PI / 180))
        };
    };

    // Simulate attendee movement
    const simulateAttendee = (index: number) => {
        // Random starting position
        let currentPos = generateRandomLocation(center[0], center[1]);
        const userId = `sim_user_${index}`;
        const userName = generateName(index);

        // Random status (mostly safe)
        const statusRandom = Math.random();
        let status: 'safe' | 'attention' | 'emergency' = 'safe';
        if (statusRandom > 0.95) status = 'emergency';
        else if (statusRandom > 0.85) status = 'attention';

        // Update location every 3-7 seconds
        const updateInterval = 3000 + Math.random() * 4000;

        const intervalId = window.setInterval(() => {
            // Small random movement (simulate walking)
            const movement = generateRandomLocation(currentPos.lat, currentPos.lng, 0.05);
            currentPos = movement;

            updateAttendeeLocation(
                eventId,
                userId,
                { lat: currentPos.lat, lng: currentPos.lng },
                status,
                userName
            ).catch(console.error);
        }, updateInterval);

        return intervalId;
    };

    const startSimulation = () => {
        if (isRunning) return;

        const intervalIds: number[] = [];
        for (let i = 0; i < attendeeCount; i++) {
            const intervalId = simulateAttendee(i);
            intervalIds.push(intervalId);
        }

        setIntervals(intervalIds);
        setIsRunning(true);
    };

    const stopSimulation = () => {
        intervals.forEach(id => window.clearInterval(id));
        setIntervals([]);
        setIsRunning(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            intervals.forEach(id => window.clearInterval(id));
        };
    }, [intervals]);

    // Only show in development mode
    if (import.meta.env.PROD) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[2000]">
            <Card className="p-4 shadow-2xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-600" />
                        <div>
                            <h3 className="font-bold text-sm">Demo Simulator</h3>
                            <p className="text-xs text-muted-foreground">For judges only</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="number"
                            min="5"
                            max="100"
                            value={attendeeCount}
                            onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 30)}
                            className="w-16 px-2 py-1 text-sm border rounded"
                            disabled={isRunning}
                        />
                        <span className="text-xs text-muted-foreground">attendees</span>
                    </div>

                    {isRunning && (
                        <Badge variant="default" className="w-full justify-center bg-green-500 animate-pulse">
                            ● LIVE SIMULATION
                        </Badge>
                    )}

                    <Button
                        onClick={isRunning ? stopSimulation : startSimulation}
                        variant={isRunning ? 'destructive' : 'default'}
                        size="sm"
                        className="w-full"
                    >
                        {isRunning ? (
                            <>
                                <StopCircle className="w-4 h-4 mr-2" />
                                Stop Simulation
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Simulation
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        {isRunning
                            ? `${attendeeCount} virtual attendees moving`
                            : 'Click to generate demo data'
                        }
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default LocationSimulator;
