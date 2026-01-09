const events = [];

// Helper to generate a simple unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getAllEvents = () => {
    return events;
};

const getEventById = (id) => {
    return events.find(event => event.id === id);
};

const createEvent = (eventData) => {
    const newEvent = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...eventData,
        // Ensure mapConfig exists even if empty
        mapConfig: eventData.mapConfig || {
            center: null,
            zoom: 13,
            boundaries: [],
            restrictedZones: [],
            routes: []
        }
    };
    events.push(newEvent);
    return newEvent;
};

const updateEvent = (id, eventData) => {
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
        events[index] = { ...events[index], ...eventData };
        return events[index];
    }
    return null;
};

const deleteEvent = (id) => {
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
        const deleted = events[index];
        events.splice(index, 1);
        return deleted;
    }
    return null;
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
