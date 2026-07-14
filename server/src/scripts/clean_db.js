const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); // Adjust path to .env if needed

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function cleanDatabase() {
    const client = await pool.connect();

    try {
        console.log('🧹 Starting Database Cleanup...');
        console.log('⚠️  WARNING: This will delete ALL transactional data (Orders, Inventory Usage, Shifts).');

        await client.query('BEGIN');

        // 1. Clear Inventory Usage (History of deductions)
        console.log('Deleting inventory_usage...');
        await client.query('TRUNCATE TABLE inventory_usage CASCADE');

        // 2. Clear Order Items (Details of sales)
        console.log('Deleting order_items...');
        await client.query('TRUNCATE TABLE order_items CASCADE');

        // 3. Clear Orders (Sales history)
        console.log('Deleting orders...');
        await client.query('TRUNCATE TABLE orders CASCADE');

        // 4. Clear Shifts/Cash Cuts if they exist
        // fail_silently in case table doesn't exist
        try {
            console.log('Deleting shifts/cash_cuts...');
            await client.query('TRUNCATE TABLE shifts CASCADE');
        } catch (e) { console.log('Skipping shifts (table might not exist)'); }

        try {
            await client.query('TRUNCATE TABLE cash_cuts CASCADE');
        } catch (e) { console.log('Skipping cash_cuts (table might not exist)'); }

        // 5. Reset Sequences only for transactional tables (Optional, but good for clean slate)
        console.log('Resetting order ID sequence...');
        await client.query("ALTER SEQUENCE orders_id_seq RESTART WITH 1");

        // Assuming transaction tables might have sequences too
        // await client.query("ALTER SEQUENCE inventory_usage_id_seq RESTART WITH 1");

        await client.query('COMMIT');

        console.log('\n✅ Database Cleanup Complete!');
        console.log('   - Users: KEPT');
        console.log('   - Menu/Recipes: KEPT');
        console.log('   - Inventory Definitions: KEPT');
        console.log('   - Orders/Sales: DELETED');
        console.log('   - Usage History: DELETED');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error during cleanup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanDatabase();
