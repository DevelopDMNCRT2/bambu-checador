const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Creating View for Dynamic Recipe Costs...');

        // 1. Drop view if exists ensuring clean slate
        await query('DROP VIEW IF EXISTS recipes_with_dynamic_cost');

        // 2. Create the View
        // This view calculates the total cost of each recipe dynamically based on the LAST purchase price of its ingredients.
        // It handles deleted items, deleted purchases, and case-insensitive matching.
        await query(`
            CREATE OR REPLACE VIEW recipes_with_dynamic_cost AS
            SELECT 
                r.id,
                r.name,
                r.category,
                r.created_at,
                r.deleted_at,
                COALESCE(
                    (
                        SELECT SUM(
                            (ri.quantity::numeric) * COALESCE(
                                (
                                    SELECT pi.unit_price::numeric
                                    FROM purchase_items pi 
                                    JOIN purchases p ON pi.purchase_id = p.id 
                                    WHERE p.deleted_at IS NULL 
                                    AND pi.deleted_at IS NULL
                                    AND LOWER(TRIM(pi.product_name)) = LOWER(TRIM(ri.product_name))
                                    ORDER BY p.purchase_date DESC, p.created_at DESC 
                                    LIMIT 1
                                ), 
                                0
                            )
                        )
                        FROM recipe_items ri
                        WHERE ri.recipe_id = r.id
                    ), 
                0) as dynamic_total_cost
            FROM recipes r
            WHERE r.deleted_at IS NULL;
        `);

        console.log('View "recipes_with_dynamic_cost" created successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
