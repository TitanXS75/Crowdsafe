import { ref, set, onValue, off, remove, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export interface AttendeeLocation {
    lat: number;
    lng: number;
    status: 'safe' | 'attention' | 'emergency';
    name: string;
    userId: string;
    timestamp: number;
    lastSeen: number;
}

/**
 * Update current user's location to Firebase
 */
export const updateAttendeeLocation = async (
    eventId: string,
    userId: string,
    location: { lat: number; lng: number },
    status: 'safe' | 'attention' | 'emergency' = 'safe',
    userName: string = 'Anonymous'
): Promise<void> => {
    try {
        const locationRef = ref(realtimeDb, `events/${eventId}/live_locations/${userId}`);
        await set(locationRef, {
            lat: location.lat,
            lng: location.lng,
            status,
            name: userName,
            userId,
            timestamp: Date.now(),
            lastSeen: Date.now()
        });
    } catch (error) {
        console.error('Error updating location:', error);
        throw error;
    }
};

/**
 * Subscribe to all attendee locations for an event
 */
export const subscribeToEventLocations = (
    eventId: string,
    callback: (locations: Record<string, AttendeeLocation>) => void
): (() => void) => {
    const locationsRef = ref(realtimeDb, `events/${eventId}/live_locations`);

    const unsubscribe = onValue(locationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Filter out stale locations (older than 30 seconds)
            const now = Date.now();
            const activeLocations: Record<string, AttendeeLocation> = {};

            Object.entries(data).forEach(([userId, location]) => {
                const loc = location as AttendeeLocation;
                if (now - loc.lastSeen < 30000) { // 30 seconds threshold
                    activeLocations[userId] = loc;
                }
            });

            callback(activeLocations);
        } else {
            callback({});
        }
    });

    // Return cleanup function
    return () => {
        off(locationsRef);
    };
};

/**
 * Remove user's location when they leave
 */
export const removeAttendeeLocation = async (eventId: string, userId: string): Promise<void> => {
    try {
        const locationRef = ref(realtimeDb, `events/${eventId}/live_locations/${userId}`);
        await remove(locationRef);
    } catch (error) {
        console.error('Error removing location:', error);
    }
};

/**
 * Start continuous location tracking (every 5 seconds)
 */
export const startLocationTracking = (
    eventId: string,
    userId: string,
    userName: string,
    onError?: (error: Error) => void
): (() => void) => {
    let intervalId: number | null = null;
    let watchId: number | null = null;

    const updateLocation = (position: GeolocationPosition) => {
        updateAttendeeLocation(
            eventId,
            userId,
            {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            'safe',
            userName
        ).catch((error) => {
            if (onError) onError(error);
        });
    };

    const handleGeolocationError = (error: GeolocationPositionError) => {
        let errorMessage = 'Unknown location error';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please allow location access in your browser settings and refresh the page.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location service unavailable. Please check your device GPS settings.';
                break;
            case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
        }

        if (onError) onError(new Error(errorMessage));
    };

    // Check if geolocation is available
    if ('geolocation' in navigator) {
        // Get initial position
        navigator.geolocation.getCurrentPosition(
            updateLocation,
            handleGeolocationError,
            {
                enableHighAccuracy: false, // Changed to false for better compatibility
                timeout: 15000, // Increased timeout
                maximumAge: 10000
            }
        );

        // Watch position changes
        watchId = navigator.geolocation.watchPosition(
            updateLocation,
            handleGeolocationError,
            {
                enableHighAccuracy: false, // Changed to false for better compatibility
                maximumAge: 10000,
                timeout: 15000
            }
        );
    } else {
        if (onError) onError(new Error('Geolocation not supported'));
    }

    // Return cleanup function
    return () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        if (intervalId) {
            clearInterval(intervalId);
        }
        // Remove location on cleanup
        removeAttendeeLocation(eventId, userId);
    };
};
