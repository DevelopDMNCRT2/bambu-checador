const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../src/config/db.js');

const verifyOrderSort = async () => {
    try {
        console.log('Verifying Active Order Sorting (Delivery Time ASC)...');

        // Mimic the Active Orders Query
        const sql = `
            SELECT id, delivery_time, status, created_at 
            FROM orders 
            WHERE status IN ('new', 'preparing', 'delivering')
            ORDER BY delivery_time ASC, created_at ASC
            LIMIT 20;
        `;

        const result = await query(sql);

        console.table(result.rows);

        // Basic verification logic
        let passed = true;
        for (let i = 0; i < result.rows.length - 1; i++) {
            const current = result.rows[i];
            const next = result.rows[i + 1];

            if (current.delivery_time > next.delivery_time) {
                passed = false;
                console.error(`Sort Error at index ${i}: Order ${current.id} (${current.delivery_time}) comes before Order ${next.id} (${next.delivery_time})`);
            }
        }

        if (passed) {
            console.log('✅ verification PASSED: Orders are sorted by delivery_time ASC');
        } else {
            console.error('❌ verification FAILED: Orders are NOT sorted correctly');
            process.exit(1);
        }

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

verifyOrderSort();
