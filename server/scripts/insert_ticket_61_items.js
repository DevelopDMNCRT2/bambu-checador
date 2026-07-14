
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
});

const PURCHASE_ID = 61;

const items = [
    { name: 'Veggie Sal de Mar', type: 'Directo', qty: 20, unit: 'Pzas', price: 10.19566, discount: 0, total: 203.91320 },
    { name: 'Veggie Ranch', type: 'Directo', qty: 20, unit: 'Pzas', price: 10.19566, discount: 0, total: 203.91320 },
    { name: 'Veggie Wavy', type: 'Directo', qty: 20, unit: 'Pzas', price: 10.19566, discount: 0, total: 203.91320 },
    { name: 'Slim Pop Mezcla de Chiles', type: 'Directo', qty: 5, unit: 'Pzas', price: 9.33459, discount: 0, total: 46.67295 },
    { name: 'Slim Pop Limon y Sal de Mar', type: 'Directo', qty: 5, unit: 'Pzas', price: 9.33459, discount: 0, total: 46.67295 },
    { name: 'Slim Pop Sal de Mar', type: 'Directo', qty: 5, unit: 'Pzas', price: 9.33459, discount: 0, total: 46.67295 },
    { name: 'Slim Pop Sweet & Salty', type: 'Directo', qty: 4, unit: 'Pzas', price: 9.33459, discount: 0, total: 37.33836 },
    { name: 'Slim Pop Queso Chedar', type: 'Directo', qty: 5, unit: 'Pzas', price: 9.33459, discount: 0, total: 46.67295 },
    { name: 'Chispichocs', type: 'Directo', qty: 18, unit: 'Pzas', price: 8.46778, discount: 0, total: 152.42004 },
    { name: 'Natures Bakery Barra de Higo', type: 'Directo', qty: 40, unit: 'Pzas', price: 9.69275, discount: 0, total: 387.71000 },
    { name: 'Huevo Kinder', type: 'Directo', qty: 48, unit: 'Pzas', price: 21.67437, discount: 0, total: 1040.36976 },
    { name: 'Galleta Pascua Decorativa', type: 'Directo', qty: 24, unit: 'Pzas', price: 21.22666, discount: 0, total: 509.43984 },
    { name: 'Huevo Pascua Jelly Bean', type: 'Directo', qty: 60, unit: 'Pzas', price: 5.09750, discount: 0, total: 305.85000 },
    { name: 'Kinder Delice', type: 'Directo', qty: 15, unit: 'Pzas', price: 12.61667, discount: 0, total: 189.25005 },
    { name: 'Pringles Crema y Cebolla', type: 'Directo', qty: 3, unit: 'Pzas', price: 13.75900, discount: 0, total: 41.27700 },
    { name: 'Pringles Originales', type: 'Directo', qty: 14, unit: 'Pzas', price: 13.75900, discount: 0, total: 192.62600 },
    { name: 'Pringles Queso', type: 'Directo', qty: 3, unit: 'Pzas', price: 13.75900, discount: 0, total: 41.27700 },
    { name: 'Kinder Bueno', type: 'Directo', qty: 10, unit: 'Pzas', price: 20.35700, discount: 0, total: 203.57000 },
    { name: 'Conejos Turin', type: 'Directo', qty: 60, unit: 'Pzas', price: 10.19567, discount: 0, total: 611.74020 },
    { name: 'Galleta Gamesa Mini', type: 'Directo', qty: 48, unit: 'Pzas', price: 4.80000, discount: 34.57, total: 195.83000 },
    { name: 'Mamut Mini', type: 'Directo', qty: 32, unit: 'Pzas', price: 3.60000, discount: 34.57, total: 80.63000 },
    { name: 'Huevo Pascua de Chocolate', type: 'Directo', qty: 28, unit: 'Pzas', price: 11.65464, discount: 0, total: 326.32992 },
    { name: 'Galletas Chispas de Chocolate', type: 'Directo', qty: 24, unit: 'Pzas', price: 8.05583, discount: 0, total: 193.33992 },
    { name: 'Fruit Foot', type: 'Directo', qty: 48, unit: 'Pzas', price: 6.37229, discount: 0, total: 305.86992 },
    { name: 'Leche de Almedras', type: 'Directo', qty: 6, unit: 'Pzas', price: 25.40333, discount: 0, total: 152.41998 },
    { name: 'Croissant', type: 'Directo', qty: 12, unit: 'Pzas', price: 12.70167, discount: 0, total: 152.42004 },
    { name: 'Apple Sauce', type: 'Directo', qty: 24, unit: 'Pzas', price: 9.33458, discount: 0, total: 224.02992 },
    { name: 'Agua Mineral', type: 'Directo', qty: 40, unit: 'Pzas', price: 8.41400, discount: 0, total: 336.56000 },
    { name: 'Agua Santa María', type: 'Directo', qty: 40, unit: 'Pzas', price: 4.32600, discount: 0, total: 173.04000 }
];

async function insertItems() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Deleting existing items for purchase_id ${PURCHASE_ID}...`);
        await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [PURCHASE_ID]);

        console.log(`Inserting ${items.length} items...`);
        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_items (
                    purchase_id, product_name, quantity, unit, unit_price, discount, total, cost_type, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (NOW() AT TIME ZONE 'America/Mexico_City'))`,
                [PURCHASE_ID, item.name, item.qty, item.unit, item.price, item.discount, item.total, item.type]
            );
        }

        console.log('Updating purchase status to "Desglosado"...');
        await client.query(
            "UPDATE purchases SET status = 'Desglosado', updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1",
            [PURCHASE_ID]
        );

        await client.query('COMMIT');
        console.log('Successfully inserted items and updated status.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error inserting items:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

insertItems();
