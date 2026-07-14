require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

async function run() {
    try {
        console.log('Altering purchase_items quantity precision...');
        // Change quantity column to allow 5 decimal places
        await query(`ALTER TABLE purchase_items ALTER COLUMN quantity TYPE NUMERIC(15, 5);`);
        console.log('Migration successful: purchase_items quantity updated to NUMERIC(15, 5)');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
