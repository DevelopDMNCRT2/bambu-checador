const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../src/config/db.js');

const seedManyOrders = async () => {
    const client = await pool.connect();
    try {
        console.log('Seeding 15 more orders to force scroll...');
        await client.query('BEGIN');

        for (let i = 1; i <= 15; i++) {
            const num = Math.floor(Math.random() * 100);
            const total = (Math.random() * 200 + 50).toFixed(2);

            const insert = await client.query(`
                INSERT INTO orders (customer_name, customer_phone, location, payment_method, total, status, created_at)
                VALUES ($1, $2, $3, $4, $5, 'new', NOW() - ($6 || ' minutes')::INTERVAL)
                RETURNING id
            `, [`Cliente ${num}`, '5500000000', `Mesa ${Math.floor(Math.random() * 10) + 1}`, 'Efectivo', total, i * 2]);

            const id = insert.rows[0].id;

            await client.query(`
                 INSERT INTO order_items (order_id, name, quantity, price, variations)
                 VALUES ($1, 'Producto Test', 1, $2, '[]')
            `, [id, total]);
        }

        await client.query('COMMIT');
        console.log('Seeded 15 orders successfully.');
        process.exit(0);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding orders:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

seedManyOrders();
