const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running CXC Add UserId migration...');

        await query(`
            ALTER TABLE accounts_receivable 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
        `);

        console.log('Added user_id to accounts_receivable.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
