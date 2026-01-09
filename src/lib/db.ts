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
    setDoc
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

export const updateParkingZone = async (id: string, data: any) => {
    try {
        const docRef = doc(db, "parking_zones", id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating parking zone:", error);
        throw error;
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
