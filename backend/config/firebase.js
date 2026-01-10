const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Initializing Firebase Admin SDK...');

// Build service account from environment variables
if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
) {
    console.error('❌ CRITICAL: Missing Firebase environment variables!');
    console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    throw new Error('Firebase credentials not configured');
}

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized successfully');
        console.log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        throw error;
    }
}

// Export Firestore instance
const db = admin.firestore();

module.exports = { db, admin };

