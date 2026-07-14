const db = require('../config/db');

async function debug() {
    try {
        console.log('--- Inventory Usage ---');
        const usage = await db.query('SELECT * FROM inventory_usage ORDER BY created_at DESC LIMIT 5');
        console.table(usage.rows);

        console.log('\n--- Recent Orders ---');
        const orders = await db.query('SELECT id, total, payment_method, status, created_at FROM orders ORDER BY created_at DESC LIMIT 1');
        console.table(orders.rows);

        if (orders.rows.length > 0) {
            const orderId = orders.rows[0].id;
            console.log(`\n--- Order Items for Order ${orderId} ---`);
            const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
            console.table(items.rows);

            for (const item of items.rows) {
                console.log(`\nChecking Item: ${item.name} (Menu Item ID: ${item.menu_item_id})`);

                const menuItem = await db.query('SELECT * FROM menu_items WHERE id = $1', [item.menu_item_id]);
                console.log('Menu Item:', menuItem.rows[0]);

                if (menuItem.rows[0].type === 'variable') {
                    console.log('Variations in Order Item:', item.variations);

                    const variants = await db.query('SELECT * FROM menu_item_variants WHERE menu_item_id = $1', [item.menu_item_id]);
                    console.log('Defined Menu Item Variants in DB:');
                    console.table(variants.rows);
                } else {
                    console.log('Simple Product. Recipe ID:', menuItem.rows[0].recipe_id);
                    const variants = await db.query('SELECT * FROM recipe_variants WHERE recipe_id = $1', [menuItem.rows[0].recipe_id]);
                    console.log('Recipe Variants:');
                    console.table(variants.rows);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
