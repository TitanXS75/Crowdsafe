require('dotenv').config({ path: './.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.sendMail({
    from: `"SOS Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: 'SOS Alert Test Email',
    text: 'This is a test email from the SOS alert system.',
}).then(info => {
    console.log('✅ Test email sent:', info.response);
}).catch(err => {
    console.error('❌ Failed to send test email:', err);
});
