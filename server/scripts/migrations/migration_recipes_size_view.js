const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Updating View for Dynamic Recipe Costs with Variants...');

        await query('DROP VIEW IF EXISTS recipes_with_dynamic_cost');

        // New View Logic:
        // We calculate cost PER VARIANT. 
        // For the main recipe list, we can show the cost range (min - max) or just the min cost (starting at).
        // Let's create a view that returns rows per recipe, but aggregates variant info.

        // Actually, to keep the frontend simple for now, let's make the view return the cost of the 'First' or 'Cheapest' active variant.
        // OR better: Create a view for VARIANTS, and the frontend will fetch variants.

        // Let's update 'recipes_with_dynamic_cost' to return data at the RECIPE level, 
        // summing up the cost of the FIRST variant found (usually 'Estándar') just so the list doesn't break.
        // But the real detailed cost will be fetched via API per variant.

        await query(`
            CREATE OR REPLACE VIEW recipes_with_dynamic_cost AS
            SELECT 
                r.id,
                r.name,
                r.category,
                r.created_at,
                r.deleted_at,
                COALESCE(costs.min_c, 0) as min_cost,
                COALESCE(costs.max_c, 0) as max_cost
            FROM recipes r
            LEFT JOIN (
                SELECT 
                    v_calcs.recipe_id, 
                    MIN(v_calcs.variant_total) as min_c, 
                    MAX(v_calcs.variant_total) as max_c
                FROM (
                    SELECT 
                        rv.id,
                        rv.recipe_id,
                        SUM(
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
                        ) as variant_total
                    FROM recipe_variants rv
                    JOIN recipe_items ri ON ri.variant_id = rv.id
                    GROUP BY rv.id, rv.recipe_id
                ) v_calcs
                GROUP BY v_calcs.recipe_id
            ) costs ON costs.recipe_id = r.id
            WHERE r.deleted_at IS NULL;
        `);

        console.log('View "recipes_with_dynamic_cost" updated successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error updating view:', err);
        process.exit(1);
    }
};

runMigration();
