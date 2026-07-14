const db = require('../config/db');

async function addReplacedIngredientColumn() {
    try {
        // Add column to specify which ingredient from the recipe is being replaced
        await db.query(`
            ALTER TABLE menu_item_variants 
            ADD COLUMN IF NOT EXISTS replaced_ingredient_name VARCHAR(255);
        `);

        console.log('✅ Column replaced_ingredient_name added to menu_item_variants');

        // Add comment for documentation
        await db.query(`
            COMMENT ON COLUMN menu_item_variants.replaced_ingredient_name IS 
            'Name of the ingredient from the recipe that will be replaced by inventory_product_name. Explicit mapping for ingredient substitution.';
        `);

        console.log('✅ Column comment added');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

addReplacedIngredientColumn();
