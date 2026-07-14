const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Adding group_order to menu_item_variants...');

        await query(`
            ALTER TABLE menu_item_variants 
            ADD COLUMN IF NOT EXISTS group_order INTEGER DEFAULT 0
        `);

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
