require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../../src/config/db.js');

async function run() {
    try {
        console.log('Updating recipes_with_dynamic_cost view to exclude deleted variants...');

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
                    WHERE rv.deleted_at IS NULL
                    GROUP BY rv.id, rv.recipe_id
                ) v_calcs
                GROUP BY v_calcs.recipe_id
            ) costs ON costs.recipe_id = r.id
            WHERE r.deleted_at IS NULL;
        `);

        console.log('Migration successful: View updated.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
