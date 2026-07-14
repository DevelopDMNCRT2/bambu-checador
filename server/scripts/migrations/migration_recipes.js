const { query } = require('../../src/config/db.js');

async function run() {
    try {
        console.log('Running recipes migration...');

        // Recipes Table
        await query(`
            CREATE TABLE IF NOT EXISTS recipes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                total_cost NUMERIC(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP,
                deleted_at TIMESTAMP
            );
        `);

        // Recipe Items Table
        await query(`
            CREATE TABLE IF NOT EXISTS recipe_items (
                id SERIAL PRIMARY KEY,
                recipe_id INTEGER REFERENCES recipes(id),
                product_name VARCHAR(255) NOT NULL,
                quantity NUMERIC(10, 2) NOT NULL,
                unit VARCHAR(50),
                unit_cost NUMERIC(10, 2),
                total_cost NUMERIC(10, 2),
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')
            );
        `);

        console.log('Recipes tables created.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
