const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Creating Menu Items table...');

        // Table for Menu Items (Platillos de la Carta)
        // Links to a specific recipe_id (and optionally variant_id) to imply cost.
        /*
            Fields:
            - name: Display name on menu (e.g. "Latte Grande")
            - price: Selling Price (Precio Venta)
            - category: Menu Category
            - recipe_id: Link to recipe for cost calculation
            - variant_id: Link to specific recipe size/variant
            - status: 'active', 'inactive' (or separate boolean)
            - type: e.g. 'f&b', 'merch', etc. (or just use category)
        */
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
            )
        `);

        console.log('Menu Items table created successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
