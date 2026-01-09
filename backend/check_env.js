const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Checking Environment Variables...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET (' + process.env.EMAIL_USER + ')' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');
