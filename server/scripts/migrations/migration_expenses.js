const { query } = require('../../src/config/db.js');

async function run() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                concept VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                paid_to VARCHAR(255) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                frequency VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP,
                deleted_at TIMESTAMP
            );
        `);
        console.log('Expenses table created successfully');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
