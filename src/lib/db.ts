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

export const createEvent = async (eventData: EventData) => {
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            throw new Error('Failed to create event');
        }

        const result = await response.json();
        return result.data.id;
    } catch (e) {
        console.error("Error creating event: ", e);
        throw e;
    }
};

export const updateEvent = async (id: string, data: Partial<EventData>) => {
    try {
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update event');
        }
        console.log("Event updated with ID: ", id);
    } catch (e) {
        console.error("Error updating event: ", e);
        throw e;
    }
};

export const deleteEvent = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        console.log("Event deleted with ID: ", id);
    } catch (e) {
        console.error("Error deleting event: ", e);
        throw e;
    }
};

export const getEvents = async () => {
    try {
        // Fetch directly from Firestore instead of backend API
        const eventsRef = collection(db, "events");
        const snapshot = await getDocs(eventsRef);
        const events: EventData[] = [];
        snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() } as EventData);
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
    const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlertData[];
        callback(alerts);
    });
};

// Get active alerts (real-time)
export const getActiveAlerts = (callback: (alerts: AlertData[]) => void) => {
    const q = query(
        collection(db, "alerts"),
        where("active", "==", true),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlertData[];
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
