const { db } = require('../config/firebase');

const getAllEvents = async () => {
    const snapshot = await db.collection('events').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getEventById = async (id) => {
    const doc = await db.collection('events').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

const createEvent = async (eventData) => {
    const newEvent = {
        createdAt: new Date().toISOString(),
        ...eventData,
        mapConfig: eventData.mapConfig || {
            center: null,
            zoom: 13,
            boundaries: [],
            restrictedZones: [],
            routes: []
        }
    };

    // Add to Firestore
    const docRef = await db.collection('events').add(newEvent);
    return { id: docRef.id, ...newEvent };
};

const updateEvent = async (id, eventData) => {
    const eventRef = db.collection('events').doc(id);
    await eventRef.update(eventData);
    const doc = await eventRef.get();
    return { id: doc.id, ...doc.data() };
};

const deleteEvent = async (id) => {
    await db.collection('events').doc(id).delete();
    return { id };
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
