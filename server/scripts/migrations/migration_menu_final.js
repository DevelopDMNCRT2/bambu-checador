const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running Menu final migration...');

        // Ensure menu_items table has all needed columns
        // We will assume it exists or create it if not (the previous migration script does this)
        // But let's make sure creating menu_item_variants works.

        await query(`
             CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0,
                category VARCHAR(100),
                recipe_id INTEGER REFERENCES recipes(id),
                variant_id INTEGER REFERENCES recipe_variants(id),
                status VARCHAR(20) DEFAULT 'active',
                type VARCHAR(50), 
                image_url TEXT,
                description TEXT,
                deleted_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        `);

        // Create menu_item_variants table
        console.log('Creating menu_item_variants table...');
        await query(`
            CREATE TABLE IF NOT EXISTS menu_item_variants (
                id SERIAL PRIMARY KEY,
                menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
                group_name VARCHAR(100),
                name VARCHAR(100),
                extra_price DECIMAL(10, 2) DEFAULT 0,
                recipe_variant_id INTEGER REFERENCES recipe_variants(id)
            );
        `);

        console.log('Menu schema updated successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
