const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: connectionString
});

async function clearImages() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Clearing images from all products...');

        // Update all menu_items to have NULL image_url
        const res = await client.query('UPDATE menu_items SET image_url = NULL');

        await client.query('COMMIT');
        console.log(`✅ Successfully cleared images from ${res.rowCount} products!`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error clearing images:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

clearImages();
