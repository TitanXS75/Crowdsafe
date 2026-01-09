const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Checking Environment Variables...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET (' + process.env.EMAIL_USER + ')' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
