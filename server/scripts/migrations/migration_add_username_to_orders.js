const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running Add Username to Orders migration...');

        // Add user_name column to orders table
        await query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS user_name VARCHAR(150);
        `);

        console.log('Added user_name column to orders table.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
