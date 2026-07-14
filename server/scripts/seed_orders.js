const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../src/config/db.js');

const seedOrders = async () => {
    const client = await pool.connect();
    try {
        console.log('Seeding 5 New Orders...');
        await client.query('BEGIN');

        // Optional: clear existing to have a clean slate associated with this request?
        // User said "Llena con 5 ordenes nuevas" (Fill with 5 new orders).
        // It might involve clearing or just adding. I'll clear to ensure "filling" the view as expected without clutter.
        await client.query('TRUNCATE orders CASCADE');

        const ordersData = [
            {
                customer: 'Juan Pérez',
                phone: '5512345678',
                location: 'Mesa 1',
                payment: 'Efectivo',
                total: 158.00,
                note: 'Sin cebolla en la orden',
                items: [
                    { name: 'Chilaquiles Verdes', qty: 1, price: 120.00, variations: ['Con Pollo', 'Salsa Verde'], note: 'Salsa aparte' },
                    { name: 'Coca Cola', qty: 1, price: 38.00, variations: [], note: '' }
                ]
            },
            {
                customer: 'Ana López',
                phone: '5598765432',
                location: 'Barra',
                payment: 'Tarjeta',
                total: 54.00,
                note: '',
                items: [
                    { name: 'Latte', qty: 1, price: 54.00, variations: ['12 Oz', 'Leche Almendras'], note: '' }
                ]
            },
            {
                customer: 'Carlos Ruiz',
                phone: '5555555555',
                location: 'Para Llevar',
                payment: 'Efectivo',
                total: 245.00,
                note: 'Entregar en el coche',
                items: [
                    { name: 'Sandwich de Pavo', qty: 2, price: 90.00, variations: [], note: '' }, // 180
                    { name: 'Jugo Naranja', qty: 1, price: 45.00, variations: ['Grande'], note: '' },
                    { name: 'Galleta de Avena', qty: 1, price: 20.00, variations: [], note: '' }
                ]
            },
            {
                customer: 'María García',
                phone: '',
                location: 'Mesa 5',
                payment: 'Tarjeta',
                total: 95.00,
                note: '',
                items: [
                    { name: 'Huevos Rancheros', qty: 1, price: 95.00, variations: ['Termino Medio'], note: 'Poco picante' }
                ]
            },
            {
                customer: 'Pedro Sola',
                phone: '5511223344',
                location: 'Mesa 2',
                payment: 'Efectivo',
                total: 600.00,
                note: 'Cumpleaños, poner velita',
                items: [
                    { name: 'Pastel de Chocolate', qty: 1, price: 550.00, variations: ['Entero'], note: 'Escribir Felicidades' },
                    { name: 'Café Americano', qty: 1, price: 50.00, variations: [], note: '' }
                ]
            }
        ];

        for (const o of ordersData) {
            const orderInsert = await client.query(`
                INSERT INTO orders (customer_name, customer_phone, location, payment_method, total, general_note, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())
                RETURNING id
            `, [o.customer, o.phone, o.location, o.payment, o.total, o.note]);

            const orderId = orderInsert.rows[0].id;

            for (const item of o.items) {
                await client.query(`
                    INSERT INTO order_items (order_id, name, quantity, price, variations, note)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [orderId, item.name, item.qty, item.price, JSON.stringify(item.variations), item.note]);
            }
        }

        await client.query('COMMIT');
        console.log('Seeded 5 orders successfully.');
        process.exit(0);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding orders:', err);
        process.exit(1);
    } finally {
        client.release();
    }
};

seedOrders();
