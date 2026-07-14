require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/db');

async function runMigration() {
    try {
        console.log('Adding discount column to orders table...');
        await db.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0;
        `);
        console.log('Migration successful: discount column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

runMigration();
