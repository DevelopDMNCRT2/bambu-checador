require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../config/db');

async function checkConnection() {
    try {
        console.log('--- CHECKING DATABASE CONNECTION ---');
        console.log('Host:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);

        // Query to get current database and user
        const res = await db.query('SELECT current_database(), current_user, version();');
        console.log('Current Database:', res.rows[0].current_database);
        console.log('Current User:', res.rows[0].current_user);
        console.log('Version:', res.rows[0].version);

        // Try to query pg_settings for application_name or similar if available (cloud specific)
        // Neon sometimes puts branch in the compute endpoint name (the host)

    } catch (err) {
        console.error('Error connecting:', err);
    } finally {
        process.exit();
    }
}

checkConnection();
