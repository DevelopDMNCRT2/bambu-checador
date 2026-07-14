require('dotenv').config();
const db = require('../src/config/db');

async function checkLastOrders() {
    try {
        const query = `
            SELECT id, created_at, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City' as local_time 
            FROM orders 
            ORDER BY created_at DESC
            LIMIT 10
        `;
        const res = await db.query(query);
        const tableData = res.rows.map(r => ({
            id: r.id,
            utc_raw: r.created_at.toISOString(),
            local_time_db_calc: r.local_time
        }));
        const fs = require('fs');
        fs.writeFileSync('debug_output_utf8.txt', JSON.stringify(tableData, null, 2));
        console.log('Written to debug_output_utf8.txt');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLastOrders();
