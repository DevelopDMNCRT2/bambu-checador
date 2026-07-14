require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../config/db');

const createTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS inventory_adjustments (
                id SERIAL PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                quantity NUMERIC(10,5) NOT NULL,
                unit VARCHAR(50),
                reason TEXT,
                admin_id INTEGER, -- We'll keep it optional for now or link to users if available
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')
            );
        `);
        console.log('Table inventory_adjustments created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
};

createTable();
