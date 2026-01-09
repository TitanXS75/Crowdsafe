import {
    db
} from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    deleteDoc,
    setDoc,
    increment
} from "firebase/firestore";

// POI/Facility interface
export interface EventPOI {
    id: string;
    name: string;
    type: string;
    icon: string;
    location: [number, number]; // [lat, lng]
    zone?: string;
    description?: string;
    active: boolean;
}

export interface EventData {
    id?: string;
    name: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    expectedAttendees: string;
    mapEmbedUrl?: string;
    mapConfig?: {
        center: [number, number];
        zoom: number;
        boundaries: [number, number][];
        restrictedZones: [number, number][];
        routes: any[];
    };
    facilities?: EventPOI[];
    crowdLevel?: "low" | "medium" | "high";
    organizerId?: string;
    organizerEmail?: string;
    organizerName?: string;
    createdAt?: Date;
    activeAttendees?: number;
}
// Events
const API_URL = 'http://localhost:5000/api';

// Helper to convert nested arrays to objects for Firestore compatibility
// Firestore doesn't support nested arrays like [number, number][]
const convertMapConfigForFirestore = (eventData: EventData): any => {
    if (!eventData.mapConfig) return eventData;

    const convertCoords = (coords: [number, number][] | undefined) =>
        coords?.map(([lat, lng]) => ({ lat, lng })) || [];

    return {
        ...eventData,
        mapConfig: {
            ...eventData.mapConfig,
            center: eventData.mapConfig.center
                ? { lat: eventData.mapConfig.center[0], lng: eventData.mapConfig.center[1] }
                : null,
            boundaries: convertCoords(eventData.mapConfig.boundaries),
            restrictedZones: convertCoords(eventData.mapConfig.restrictedZones),
        },
        // Also convert facilities location if present
        facilities: eventData.facilities?.map(f => ({
            ...f,
            location: f.location ? { lat: f.location[0], lng: f.location[1] } : null
        }))
    };
};

export const createEvent = async (eventData: EventData) => {
    try {
        console.log("Creating event with data:", eventData);
        const firestoreData = convertMapConfigForFirestore(eventData);
        const docRef = await addDoc(collection(db, "events"), {
            ...firestoreData,
            createdAt: new Date()
        });
        console.log("Event created with ID: ", docRef.id);
        return docRef.id;
    } catch (e: any) {
        console.error("Error creating event: ", e);
        console.error("Error code:", e?.code);
        console.error("Error message:", e?.message);
        throw e;
    }
};

export const updateEvent = async (id: string, data: Partial<EventData>) => {
    try {
        console.log("💾 DB: updateEvent called");
        console.log("ID:", id);
        console.log("Data before conversion:", data);

        const docRef = doc(db, "events", id);
        // Convert nested arrays if mapConfig or facilities are being updated
        const firestoreData = convertMapConfigForFirestore(data as EventData);
        console.log("Data after Firestore conversion:", firestoreData);

        await updateDoc(docRef, firestoreData);
        console.log("✅ DB: Firestore updateDoc completed successfully for ID:", id);
    } catch (e) {
        console.error("❌ DB: Error updating event:", e);
        throw e;
    }
};

export const deleteEvent = async (id: string) => {
    try {
        await deleteDoc(doc(db, "events", id));
        console.log("Event deleted with ID: ", id);
    } catch (e) {
        console.error("Error deleting event: ", e);
        throw e;
    }
};

// Helper to convert Firestore objects back to arrays for Leaflet compatibility
// Firestore stores {lat, lng} but Leaflet expects [lat, lng]
const convertMapConfigFromFirestore = (eventData: any): EventData => {
    if (!eventData.mapConfig) return eventData;

    const convertToArray = (coords: any[] | undefined): [number, number][] => {
        if (!coords || !Array.isArray(coords)) return [];
        return coords.map((c: any) => {
            if (Array.isArray(c)) return c as [number, number];
            if (c && typeof c === 'object' && 'lat' in c && 'lng' in c) {
                return [c.lat, c.lng] as [number, number];
            }
            return [0, 0] as [number, number]; // fallback
        }).filter(c => c[0] !== 0 || c[1] !== 0); // filter out invalid
    };

    const convertCenter = (center: any): [number, number] | undefined => {
        if (!center) return undefined;
        if (Array.isArray(center)) return center as [number, number];
        if (typeof center === 'object' && 'lat' in center && 'lng' in center) {
            return [center.lat, center.lng];
        }
        return undefined;
    };

    return {
        ...eventData,
        mapConfig: {
            ...eventData.mapConfig,
            center: convertCenter(eventData.mapConfig.center),
            boundaries: convertToArray(eventData.mapConfig.boundaries),
            restrictedZones: convertToArray(eventData.mapConfig.restrictedZones),
        },
        facilities: eventData.facilities?.map((f: any) => ({
            ...f,
            location: f.location
                ? (Array.isArray(f.location)
                    ? f.location
                    : [f.location.lat, f.location.lng])
                : undefined
        }))
    };
};

export const getEvents = async () => {
    try {
        // Fetch directly from Firestore instead of backend API
        const eventsRef = collection(db, "events");
        const snapshot = await getDocs(eventsRef);
        const events: EventData[] = [];
        snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            // Convert Firestore format back to array format for Leaflet
            events.push(convertMapConfigFromFirestore(data));
        });
        return events;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

export const incrementActiveUsers = async (eventId: string) => {
    try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            activeAttendees: increment(1)
        });
        console.log("Incremented active users for", eventId);
    } catch (error) {
        console.error("Error incrementing active users:", error);
    }
};

export const decrementActiveUsers = async (eventId: string) => {
    try {
        const eventRef = doc(db, "events", eventId);
        // We might want to check if it's already 0, but Firestore increment(-1) is standard
        await updateDoc(eventRef, {
            activeAttendees: increment(-1)
        });
        console.log("Decremented active users for", eventId);
    } catch (error) {
        console.error("Error decrementing active users:", error);
    }
};

export const getEventRealtime = (eventId: string, callback: (event: EventData) => void) => {
    const eventRef = doc(db, "events", eventId);
    return onSnapshot(eventRef, (doc) => {
        if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            callback(convertMapConfigFromFirestore(data));
        }
    });
};


export const fetchRoutes = async (start: [number, number], end: [number, number], eventId: string) => {
    try {
        const response = await fetch(`${API_URL}/navigation/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end, eventId })
        });
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error("Error fetching routes:", error);
        return [];
    }
};

export const updateUserLocation = async (lat: number, lng: number, userId?: string) => {
    try {
        const response = await fetch(`${API_URL}/realtime/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, userId })
        });
        const result = await response.json();
        return result.trackingId;
    } catch (error) {
        console.error("Error updating location:", error);
        return null;
    }
};

export const getPendingMapEvents = async () => {
    // Determine pending events as those WITHOUT a mapEmbedUrl or where it's empty
    // Note: Firestore queries for "does not exist" or "is empty string" can be tricky combined.
    // For simplicity, we'll fetch all and filter in client or use a simple query if possible.
    // Let's fetch all for now as the number of events is likely small.
    const allEvents = await getEvents();
    return allEvents.filter(event => !event.mapEmbedUrl);
};

// Parking Zones
export const getParkingZones = (callback: (zones: any[]) => void) => {
    const q = query(collection(db, "parking_zones"));
    return onSnapshot(q, (snapshot) => {
        const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(zones);
    });
};

// Get parking zones for a specific event
export const getParkingZonesByEvent = (eventId: string, callback: (zones: any[]) => void) => {
    const q = query(collection(db, "parking_zones"), where("eventId", "==", eventId));
    return onSnapshot(q, (snapshot) => {
        const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(zones);
    });
};

export const updateParkingZone = async (id: string, data: any) => {
    try {
        const docRef = doc(db, "parking_zones", id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating parking zone:", error);
        throw error;
    }
};

export const createParkingZone = async (data: {
    name: string;
    capacity: number;
    eventId: string;
    coordinates?: { lat: number; lng: number };
    status?: string;
}) => {
    try {
        const docRef = await addDoc(collection(db, "parking_zones"), {
            ...data,
            occupied: 0,
            status: data.status || "open",
            published: false,
            createdAt: new Date()
        });
        console.log("Parking zone created:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating parking zone:", error);
        throw error;
    }
};

export const deleteParkingZone = async (id: string) => {
    try {
        await deleteDoc(doc(db, "parking_zones", id));
        console.log("Parking zone deleted:", id);
    } catch (error) {
        console.error("Error deleting parking zone:", error);
        throw error;
    }
};

// ============ PARKED VEHICLES ============

export interface ParkedVehicle {
    id?: string;
    userId: string;
    eventId: string;
    lat: number;
    lng: number;
    zoneId?: string;
    address: string;
    parkedAt: Date;
}

export const saveVehicleLocation = async (
    userId: string,
    eventId: string,
    lat: number,
    lng: number,
    address: string,
    zoneId?: string
) => {
    try {
        // Save to user's document (one vehicle per user per event)
        const docRef = doc(db, "parked_vehicles", `${eventId}_${userId}`);
        await setDoc(docRef, {
            userId,
            eventId,
            lat,
            lng,
            address,
            zoneId: zoneId || null,
            parkedAt: new Date()
        });
        console.log("Vehicle location saved");
        return docRef.id;
    } catch (error) {
        console.error("Error saving vehicle location:", error);
        throw error;
    }
};

export const removeVehicleLocation = async (userId: string, eventId: string) => {
    try {
        await deleteDoc(doc(db, "parked_vehicles", `${eventId}_${userId}`));
        console.log("Vehicle location removed");
    } catch (error) {
        console.error("Error removing vehicle location:", error);
        throw error;
    }
};

export const getParkedVehicles = (eventId: string, callback: (vehicles: ParkedVehicle[]) => void) => {
    const q = query(
        collection(db, "parked_vehicles"),
        where("eventId", "==", eventId)
    );
    return onSnapshot(q, (snapshot) => {
        const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkedVehicle));
        callback(vehicles);
    });
};

export const getParkedVehicleCount = async (eventId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, "parked_vehicles"),
            where("eventId", "==", eventId)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting parked vehicle count:", error);
        return 0;
    }
};

// ============ ALERTS ============

export interface AlertData {
    id?: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    zone: string;
    eventId?: string;
    organizerId?: string;
    reach?: number;
    time?: string;
    createdAt?: Date;
    type?: 'alert' | 'emergency';
    active?: boolean;
}

export interface EmergencyRequest {
    id?: string;
    type: string;
    description?: string; // For manual type
    userId: string;
    eventId: string;
    location?: {
        lat: number;
        lng: number;
        label?: string; // e.g. "Zone A"
    };
    status: 'pending' | 'responding' | 'resolved';
    timestamp: any;
    resolvedAt?: any;
    resolvedBy?: string;
}

// Get all alerts (real-time listener)
export const getAlerts = (callback: (alerts: AlertData[]) => void) => {
    const q = query(collection(db, "alerts")); // Removed orderBy to avoid index error
    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlertData[];
        // Sort in memory
        alerts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        callback(alerts);
    });
};

// Get active alerts (real-time)
export const getActiveAlerts = (callback: (alerts: AlertData[]) => void) => {
    const q = query(
        collection(db, "alerts"),
        where("active", "==", true)
    ); // Removed orderBy to avoid index error
    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlertData[];
        // Sort in memory
        alerts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        callback(alerts);
    });
};

// Create a new alert
export const createAlert = async (data: Omit<AlertData, 'id' | 'time' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, "alerts"), {
            ...data,
            time: new Date().toISOString(),
            createdAt: new Date(),
            active: true
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating alert:", error);
        throw error;
    }
};

// Create Emergency Request
export const createEmergencyRequest = async (data: EmergencyRequest) => {
    try {
        const docRef = await addDoc(collection(db, "emergency_requests"), {
            ...data,
            timestamp: new Date(),
            status: 'pending'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating emergency request:", error);
        throw error;
    }
};

// Update Emergency Request Status
export const updateEmergencyStatus = async (id: string, status: 'responding' | 'resolved', resolverId?: string) => {
    try {
        const docRef = doc(db, "emergency_requests", id);
        await updateDoc(docRef, {
            status,
            resolvedAt: status === 'resolved' ? new Date() : null,
            resolvedBy: resolverId || null
        });
    } catch (error) {
        console.error("Error updating emergency status:", error);
        throw error;
    }
};

// Get Active Emergency Requests (Real-time)
export const getActiveEmergencyRequests = (eventId: string, callback: (requests: EmergencyRequest[]) => void) => {
    // Basic query for now, can add compound index later if needed
    const q = query(
        collection(db, "emergency_requests"),
        where("eventId", "==", eventId),
        where("status", "in", ["pending", "responding"])
    );
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmergencyRequest[];
        // Sort by timestamp desc
        requests.sort((a, b) => {
            const tA = a.timestamp?.seconds || 0;
            const tB = b.timestamp?.seconds || 0;
            return tB - tA;
        });
        callback(requests);
    });
};

// Delete an alert
export const deleteAlert = async (alertId: string) => {
    try {
        await deleteDoc(doc(db, "alerts", alertId));
    } catch (error) {
        console.error("Error deleting alert:", error);
        throw error;
    }
};

// Facilities (Help Desks)
export const getFacilities = (callback: (facilities: any[]) => void) => {
    const q = query(collection(db, "facilities"));
    return onSnapshot(q, (snapshot) => {
        const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(facilities);
    });
};

// FAQs
export const getFAQs = (callback: (faqs: any[]) => void) => {
    const q = query(collection(db, "faqs"));
    return onSnapshot(q, (snapshot) => {
        const faqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(faqs);
    });
};

// User role types
export type UserRole = "attendee" | "organizer" | "admin";

export interface UserData {
    uid: string;
    email: string;
    role: UserRole;
    name?: string;
    orgName?: string;
    phone?: string;
    location?: string;
    address?: string;
    createdAt: any;
}

// Save user role to Firestore
export const saveUserRole = async (uid: string, email: string, role: UserRole, additionalData?: { name?: string; orgName?: string }) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            uid,
            email,
            role,
            ...additionalData,
            createdAt: new Date()
        });
        console.log("User role saved successfully");
    } catch (error) {
        console.error("Error saving user role:", error);
        throw error;
    }
};

// Get user role from Firestore
export const getUserRole = async (uid: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error getting user role:", error);
        throw error;
    }
};

// Update user data
export const updateUserData = async (uid: string, data: Partial<UserData>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
    } catch (error) {
        console.error("Error updating user data:", error);
        throw error;
    }
};

// Get all users
export const getAllUsers = async (): Promise<UserData[]> => {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users: UserData[] = [];
        snapshot.forEach((doc) => {
            users.push({ ...doc.data() } as UserData);
        });
        return users;
    } catch (error) {
        console.error("Error getting all users:", error);
        throw error;
    }
};

// Delete user
export const deleteUser = async (uid: string) => {
    try {
        await deleteDoc(doc(db, "users", uid));
        console.log("User deleted with UID: ", uid);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};
