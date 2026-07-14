const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Starting migration to Recipe Variants...');

        // 1. Create recipe_variants table
        await query(`
            CREATE TABLE IF NOT EXISTS recipe_variants (
                id SERIAL PRIMARY KEY,
                recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')
            )
        `);

        // 2. Add variant_id to recipe_items
        await query(`
            ALTER TABLE recipe_items 
            ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES recipe_variants(id) ON DELETE CASCADE
        `);

        // 3. Migrate existing data: Create a default variant for each existing recipe
        const { rows: recipes } = await query('SELECT id FROM recipes WHERE deleted_at IS NULL');

        for (const recipe of recipes) {
            // Check if variants already exist (idempotency)
            const check = await query('SELECT id FROM recipe_variants WHERE recipe_id = $1', [recipe.id]);
            if (check.rows.length === 0) {
                // Create 'Estándar' variant
                const { rows: variantRows } = await query(
                    `INSERT INTO recipe_variants (recipe_id, name) VALUES ($1, 'Estándar') RETURNING id`,
                    [recipe.id]
                );
                const variantId = variantRows[0].id;

                // Link existing items to this new variant
                await query(
                    `UPDATE recipe_items SET variant_id = $1 WHERE recipe_id = $2 AND variant_id IS NULL`,
                    [variantId, recipe.id]
                );
            }
        }

        console.log('Migration to Recipe Variants completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
