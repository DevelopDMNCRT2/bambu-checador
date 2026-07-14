const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running CXC Payment Method migration...');

        // 1. Add column if not exists
        await query(`
            ALTER TABLE accounts_receivable 
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
        `);

        // 2. Backfill existing paid records using order information
        // We assume if status is 'paid', the order payment_method holds the liquidation method
        await query(`
             UPDATE accounts_receivable ar
             SET payment_method = o.payment_method
             FROM orders o
             WHERE ar.order_id = o.id 
             AND ar.status = 'paid'
             AND ar.payment_method IS NULL;
        `);

        console.log('CXC Payment Method column added and backfilled.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
