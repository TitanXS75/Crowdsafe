const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables strictly from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let serviceAccount;

try {
    // Try to load service account key file
    serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
    console.warn("WARNING: serviceAccountKey.json not found in backend/.");

    // Fallback to environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        console.log("Using Firebase credentials from environment variables.");
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    } else {
        console.error("CRITICAL: No Firebase credentials found (File or Env). SOS features will fail.");
    }
}

if (!admin.apps.length) {
    if (serviceAccount) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialized successfully.");
        } catch (initError) {
            console.error("Failed to initialize Firebase Admin:", initError.message);
        }
    } else {
        console.error("Skipping Firebase initialization due to missing credentials.");
    }
}

// Export a robust db object that throws clearer errors if accessed when not initialized
const db = admin.apps.length ? admin.firestore() : {
    collection: () => { throw new Error("Firebase not initialized. check backend credentials."); }
};

module.exports = { db };
