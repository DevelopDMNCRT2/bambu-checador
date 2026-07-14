const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running Orders migration...');

        // Create orders table
        console.log('Creating orders table...');
        await query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(150),
                customer_phone VARCHAR(50),
                location VARCHAR(100),
                payment_method VARCHAR(50) DEFAULT 'Efectivo',
                total DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'new',
                general_note TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')
            );
        `);

        // Create order_items table
        console.log('Creating order_items table...');
        await query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                menu_item_id INTEGER REFERENCES menu_items(id),
                name VARCHAR(150),
                quantity DECIMAL(10, 2) DEFAULT 1,
                price DECIMAL(10, 2) DEFAULT 0,
                variations JSONB,  -- Stores array: ["12 Oz", "Almendras"]
                note TEXT
            );
        `);

        console.log('Orders schema created successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running orders migration:', err);
        process.exit(1);
    }
};

runMigration();
