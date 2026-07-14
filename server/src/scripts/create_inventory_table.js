const db = require('../config/db');

const createTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS inventory_usage (
                id SERIAL PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                quantity NUMERIC(10,5) NOT NULL,
                unit VARCHAR(50),
                order_id INTEGER REFERENCES orders(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('Table inventory_usage created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
};

createTable();
