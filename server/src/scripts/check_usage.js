const db = require('../config/db');

async function checkUsage() {
    try {
        console.log('Checking inventory_usage table...');
        const { rows } = await db.query('SELECT * FROM inventory_usage');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUsage();
