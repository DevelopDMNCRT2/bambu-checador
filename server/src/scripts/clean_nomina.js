require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../config/db');

async function clean() {
    try {
        console.log('Clearing nomina, horarios_semanales, and asistencias tables...');
        
        await db.query('DELETE FROM asistencias');
        console.log('✓ Cleared asistencias');
        
        await db.query('DELETE FROM nomina');
        console.log('✓ Cleared nomina');
        
        await db.query('DELETE FROM horarios_semanales');
        console.log('✓ Cleared horarios_semanales');
        
        // Reset tokens on users
        await db.query('UPDATE users SET link_token = NULL, device_token = NULL');
        console.log('✓ Reset user tokens');

        console.log('All cleaned successfully!');
    } catch (err) {
        console.error('Error cleaning tables:', err);
    } finally {
        process.exit();
    }
}

clean();
