const express = require('express');
const router = express.Router();

// API Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CrowdSafe API',
        timestamp: new Date().toISOString()
    });
});

// Example: Get server status
router.get('/status', (req, res) => {
    res.json({
        server: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Add your custom API routes below
// ============================================

// Import services
const eventService = require('../services/eventService');
const routingService = require('../services/routingService');
const crowdService = require('../services/crowdService');

// ============================================
// Event Routes
// ============================================

// Get all events
router.get('/events', async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.json({
            status: 'success',
            data: events
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get single event
router.get('/events/:id', async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        res.json({
            status: 'success',
            data: event
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create new event
router.post('/events', async (req, res) => {
    try {
        const eventData = req.body;

        // Basic validation
        if (!eventData.name) {
            return res.status(400).json({
                status: 'error',
                message: 'Event name is required'
            });
        }

        const newEvent = await eventService.createEvent(eventData);


        res.status(201).json({
            status: 'success',
            message: 'Event created successfully',
            data: newEvent
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Update event
router.put('/events/:id', async (req, res) => {
    try {
        const updatedEvent = await eventService.updateEvent(req.params.id, req.body);
        if (!updatedEvent) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Event updated successfully',
            data: updatedEvent
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
    try {
        const deletedEvent = await eventService.deleteEvent(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Event deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});


// ============================================
// Real-Time & Navigation Routes
// ============================================

// Update User Location (Anonymous)
router.post('/realtime/location', (req, res) => {
    try {
        const { userId, lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Lat/Lng required' });
        }

        // Use a generated ID if none provided (anonymous)
        const id = userId || `anon-${Date.now()}`;

        crowdService.updateLocation(id, lat, lng);

        res.json({ status: 'ok', trackingId: id });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get Navigation Routes
router.post('/navigation/routes', (req, res) => {
    try {
        const { start, end, eventId } = req.body;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and End coordinates required' });
        }

        // Get event config for boundaries/zones
        const event = eventId ? eventService.getEventById(eventId) : null;
        const mapConfig = event ? event.mapConfig : null;

        const routes = routingService.generateRoutes(start, end, mapConfig);

        res.json({
            status: 'success',
            data: routes
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Email Service Setup
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SOS / Emergency Alert Endpoint
// SOS / Emergency Alert Endpoint
router.post('/send-sos', async (req, res) => {
    const { eventId, alertDetails } = req.body;
    const { db } = require('../config/firebase');

    if (!eventId || !alertDetails) {
        return res.status(400).json({ status: 'error', message: 'Missing eventId or alert details' });
    }

    console.log(`[SOS] Initiating emergency broadcast for Event ${eventId}`);

    try {
        // 1. Create Alert in Firestore (Server-side)
        const alertRef = await db.collection("alerts").add({
            ...alertDetails,
            eventId,
            active: true,
            createdAt: new Date(),
            time: new Date().toISOString()
        });
        console.log(`[SOS] Alert created in Firestore: ${alertRef.id}`);

        // 2. Fetch Attendees from Firestore
        const attendeesRef = db.collection("events").doc(eventId).collection("active_attendees");
        console.log(`[SOS] Querying attendees at path: events/${eventId}/active_attendees`);

        const attendeesSnapshot = await attendeesRef.get();
        console.log(`[SOS] Snapshot empty? ${attendeesSnapshot.empty}, Size: ${attendeesSnapshot.size}`);

        const recipients = attendeesSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`[SOS] Found candidate: ${data.email} (UID: ${doc.id})`);
            return data.email;
        }).filter(Boolean);

        console.log(`[SOS] Found ${recipients.length} recipients`);

        if (recipients.length === 0) {
            return res.json({
                status: 'ok',
                message: 'SOS Alert created, but no email recipients found.',
                alertId: alertRef.id
            });
        }

        // 3. Send Emails
        const emailPromises = recipients.map(email => {
            const mailOptions = {
                from: `"CrowdSafe Emergency" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `🚨 EMERGENCY ALERT: ${alertDetails.title}`,
                text: `
URGENT SAFETY ALERT

Event: ${alertDetails.zone || 'General Area'}
Severity: ${alertDetails.severity.toUpperCase()}

${alertDetails.message}

Please follow safety instructions immediately.
                `,
                html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; text-transform: uppercase;">🚨 Emergency Alert</h1>
    </div>
    <div style="padding: 24px; background-color: #fef2f2;">
        <h2 style="color: #991b1b; margin-top: 0;">${alertDetails.title}</h2>
        <p style="font-size: 16px; color: #7f1d1d; font-weight: bold;">Severity: ${alertDetails.severity.toUpperCase()}</p>
        
        <div style="background-color: white; padding: 16px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="font-size: 18px; line-height: 1.5; margin: 0;">${alertDetails.message}</p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This is an automated emergency broadcast from the CrowdSafe system.
            <br>
            Event ID: ${eventId}
        </p>
    </div>
</div>
                `
            };

            return transporter.sendMail(mailOptions).catch(err => {
                console.error(`[SOS] Failed to send to ${email}:`, err.message);
                return { error: err.message, email };
            });
        });

        await Promise.all(emailPromises);
        console.log('[SOS] Broadcast complete');

        res.json({
            status: 'ok',
            message: `Emergency alert sent to ${recipients.length} recipients`,
            alertId: alertRef.id
        });

    } catch (error) {
        console.error('[SOS] Broadcast critical error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to complete broadcast: ' + error.message });
    }
});
module.exports = router;
