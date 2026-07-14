require('dotenv').config();
const db = require('../src/config/db');

async function fixDates() {
    try {
        console.log('Fixing dates for orders created after 2026-02-03 00:00:00...');
        
        // Update orders
        const res = await db.query(`
            UPDATE orders 
            SET created_at = created_at + interval '6 hours',
                updated_at = updated_at + interval '6 hours'
            WHERE created_at >= '2026-02-03 00:00:00'
            RETURNING id, created_at
        `);
        console.log(`Updated ${res.rowCount} orders.`);
        
        // Update accounts_receivable created_at? 
        // Likely similar issue.
        const resAR = await db.query(`
            UPDATE accounts_receivable
            SET created_at = created_at + interval '6 hours',
                updated_at = updated_at + interval '6 hours'
            WHERE created_at >= '2026-02-03 00:00:00'
            RETURNING id
        `);
         console.log(`Updated ${resAR.rowCount} accounts_receivable.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixDates();
