const { db } = require('./config/firebase');

const main = async () => {
    try {
        const events = await db.collection('events').get();
        if (events.empty) {
            console.log('No events found.');
            return;
        }

        for (const doc of events.docs) {
            console.log(`Event: ${doc.data().name} (${doc.id})`);
            const attendees = await db.collection('events').doc(doc.id).collection('active_attendees').get();
            console.log(`  Attendees count: ${attendees.size}`);
            attendees.docs.forEach(a => console.log(`    - ${a.data().email} (${a.id})`));
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

main();
