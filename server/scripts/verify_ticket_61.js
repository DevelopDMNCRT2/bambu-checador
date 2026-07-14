
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
});

const PURCHASE_ID = 61;

async function verify() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT id, product_name, quantity, total
            FROM purchase_items
            WHERE purchase_id = $1
            ORDER BY id ASC;
        `, [PURCHASE_ID]);

        console.log(`Found ${res.rows.length} items for purchase ${PURCHASE_ID}:`);
        res.rows.forEach(row => {
            console.log(`${row.id}: ${row.product_name} - Qty: ${row.quantity} - Total: ${row.total}`);
        });

        const statusRes = await client.query(`SELECT status FROM purchases WHERE id = $1`, [PURCHASE_ID]);
        console.log('Purchase Status:', statusRes.rows[0]?.status);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

verify();
