const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../src/config/db.js');

const checkDeliveryTime = async () => {
    try {
        console.log('Checking delivery_time format...');
        const result = await query('SELECT id, delivery_time FROM orders ORDER BY id DESC LIMIT 20');
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkDeliveryTime();
