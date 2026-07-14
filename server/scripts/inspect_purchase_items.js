
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
});

async function inspect() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, column_default
            FROM information_schema.columns
            WHERE table_name = 'purchase_items' AND column_name = 'id';
        `);
        console.log('ID Default:', res.rows[0]);

        const res2 = await client.query(`
            SELECT DISTINCT cost_type FROM purchase_items;
        `);
        console.log('Cost Types:', res2.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
