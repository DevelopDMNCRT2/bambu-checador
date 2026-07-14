const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running CXC migration...');

        // 1. Customers Table
        await query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP
            );
        `);

        // 2. Accounts Receivable (CXC) Table
        // Links order to customer and tracks debt
        await query(`
            CREATE TABLE IF NOT EXISTS accounts_receivable (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                order_id INTEGER REFERENCES orders(id),
                amount NUMERIC(10, 2) NOT NULL,
                paid_amount NUMERIC(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'active', -- active, paid, voided
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP
            );
        `);

        console.log('CXC tables created.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
