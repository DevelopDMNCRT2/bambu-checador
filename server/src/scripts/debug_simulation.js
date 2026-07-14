const db = require('../config/db');

async function debugSimulation() {
    try {
        console.log('--- Debug Simulation Started ---');

        // 1. Get Latest Order
        const orders = await db.query('SELECT id, total, payment_method, status, created_at FROM orders ORDER BY created_at DESC LIMIT 1');
        if (orders.rows.length === 0) {
            console.log('No orders found.');
            return;
        }

        const order = orders.rows[0];
        console.log('Latest Order:', order);

        // 2. Get Order Items
        const { rows: items } = await db.query(`
            SELECT oi.id, oi.menu_item_id, oi.quantity, oi.variations, 
                   m.type, m.recipe_id, m.name as product_name
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = $1
        `, [order.id]);

        console.log(`Found ${items.length} items in order.`);

        for (const item of items) {
            console.log(`\n--------------------------------------------------`);
            console.log(`Processing Item: ${item.product_name} (Type: ${item.type})`);
            console.log(`Variations Raw:`, item.variations, `(Type: ${typeof item.variations})`);

            let recipeVariantIds = [];

            if (item.type === 'variable') {
                let variations = item.variations;
                // Parse if string
                if (typeof variations === 'string') {
                    try { variations = JSON.parse(variations); } catch (e) { console.log('Parsed JSON error', e); }
                }

                // If it looks like array of strings (Postgres parser might have already made it an array if column is jsonb?)
                // Actually the column in DB might be text or json.
                // If it is just an array structure in JS:

                let choicesList = [];
                if (Array.isArray(variations)) {
                    choicesList = variations;
                } else if (typeof variations === 'object' && variations !== null) {
                    choicesList = Object.values(variations);
                }

                console.log('Choices List to Process:', choicesList);

                for (const choice of choicesList) {
                    let choiceName = null;
                    console.log(`   Checking choice: "${choice}" (${typeof choice})`);

                    if (typeof choice === 'string') {
                        if (choice.includes(':')) {
                            const parts = choice.split(':');
                            if (parts.length > 1) {
                                choiceName = parts.slice(1).join(':').trim();
                            } else {
                                choiceName = choice.trim();
                            }
                        } else {
                            choiceName = choice.trim();
                        }
                    } else if (typeof choice === 'object' && choice !== null) {
                        choiceName = choice.label || choice.name;
                    }

                    console.log(`   -> Extracted Name: "${choiceName}"`);

                    if (choiceName) {
                        const { rows: matches } = await db.query(`
                            SELECT id, name, recipe_variant_id 
                            FROM menu_item_variants 
                            WHERE menu_item_id = $1
                        `, [item.menu_item_id]);

                        // Let's filter in JS to see if strict match fails
                        const match = matches.find(m => m.name === choiceName);

                        if (match) {
                            console.log(`   -> MATCH FOUND! ID: ${match.id}, Recipe Variant ID: ${match.recipe_variant_id}`);
                            if (match.recipe_variant_id) {
                                recipeVariantIds.push(match.recipe_variant_id);
                            } else {
                                console.log(`   -> WARNING: Recipe Variant ID is NULL for this variant.`);
                            }
                        } else {
                            console.log(`   -> NO MATCH found for name "${choiceName}" in DB variants:`, matches.map(m => `"${m.name}"`).join(', '));
                        }
                    }
                }
            } else {
                console.log('Simple product logic...');
            }

            console.log(`Final Recipe Variant IDs to deduct:`, recipeVariantIds);

            for (const varId of recipeVariantIds) {
                const { rows: ingredients } = await db.query(`
                     SELECT product_name, quantity, unit, unit_cost
                     FROM recipe_items
                     WHERE variant_id = $1
                 `, [varId]);
                console.log(`   -> Recipe Ingredients for Variant ${varId}:`);
                console.table(ingredients);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugSimulation();
