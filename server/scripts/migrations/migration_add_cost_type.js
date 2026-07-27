require('dotenv').config();
const { query } = require('../../src/config/db.js');

async function run() {
    try {
        console.log('Running migration: Add cost_type to purchase_items and has_iva to purchases...');

        // 1. Add cost_type to purchase_items
        await query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS cost_type VARCHAR(50) DEFAULT 'Directo';`);
        console.log('✓ Column cost_type added to purchase_items table.');

        // 2. Add has_iva to purchases
        await query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS has_iva BOOLEAN DEFAULT true;`);
        console.log('✓ Column has_iva added to purchases table.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
}

run();
