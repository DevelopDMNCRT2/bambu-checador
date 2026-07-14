const { query } = require('../../src/config/db.js');

async function run() {
    try {
        await query(`ALTER TABLE expenses DROP COLUMN IF EXISTS frequency;`);
        console.log('Dropped frequency column from expenses');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
