const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: connectionString
});

const updates = [
    // Barra de Café
    { id: 1, url: '' }, // Americano
    { id: 2, url: '' }, // Capuccino
    { id: 3, url: '' }, // Frappe
    { id: 4, url: '' }, // Latte
    { id: 5, url: '' }, // Moka

    // Bebidas
    { id: 20, url: '' }, // Jugo Verde
    { id: 19, url: '' }, // Jugo de Naranja

    // Desayunos
    { id: 15, url: '' }, // Chilaquiles (Red/Green generic)
    { id: 14, url: '' }, // Chilaquiles con Pollo
    { id: 16, url: '' }, // Enchiladas Verdes
    { id: 17, url: '' }, // Fruta con Yogurt
    { id: 18, url: '' }, // Hot Cakes
    { id: 22, url: '' }, // Molletes (Simulated with bruschetta/similar)
    { id: 21, url: '' }, // Molletes con Jamón

    // Huevos
    { id: 31, url: '' }, // Huevos al Gusto
    { id: 29, url: '' }, // Omelette Vegetariano
    { id: 28, url: '' }, // Omelette con Jamón
    { id: 30, url: '' }, // Omelette de Champiñones

    // Menú del Día
    { id: 27, url: '' }, // Agua del Día
    { id: 24, url: '' }, // Combo Bambú Infantil
    { id: 23, url: '' }, // Combo Bambú Adulto
    { id: 26, url: '' }, // Plato Fuerte del Día
    { id: 25, url: '' }, // Sopa del Día

    // Sandwiches
    { id: 6, url: '' }, // Chapata de Atún (Generic panini)
    { id: 7, url: '' }, // Chapata de Pechuga de Pavo
    { id: 8, url: '' }, // Chapata de Pollo
    { id: 9, url: '' }, // Croissant de Jamón y Queso
    { id: 10, url: '' }, // Croissant de Queso con Zarzamora
    { id: 11, url: '' }, // Sandwich de Atún
    { id: 12, url: '' }, // Sandwich de Pechuga de Pavo
    { id: 13, url: '' }  // Sandwich de Pollo
];

async function updateImages() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Updating ${updates.length} products with stock images...`);

        for (const update of updates) {
            await client.query('UPDATE menu_items SET image_url = $1 WHERE id = $2', [update.url, update.id]);
        }

        await client.query('COMMIT');
        console.log('✅ All product images updated successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating images:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

updateImages();
