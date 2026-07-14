const db = require('../config/db');

async function addInventoryLinkColumn() {
    try {
        // Add column to link menu item variants to inventory products
        await db.query(`
            ALTER TABLE menu_item_variants 
            ADD COLUMN IF NOT EXISTS inventory_product_name VARCHAR(255);
        `);

        console.log('✅ Column inventory_product_name added to menu_item_variants');

        // Add comment for documentation
        await db.query(`
            COMMENT ON COLUMN menu_item_variants.inventory_product_name IS 
            'Name of the inventory product to substitute when this variant is selected. Used for ingredient substitution (e.g., Leche Entera -> Leche Deslactosada)';
        `);

        console.log('✅ Column comment added');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

addInventoryLinkColumn();
