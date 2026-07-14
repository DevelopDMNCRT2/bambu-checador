const db = require('../config/db');

/**
 * Deducts inventory based on the recipe of the items in the order.
 * @param {number} orderId 
 */
async function deductInventoryForOrder(orderId) {
    console.log(`🔥🔥🔥 [Inventory] deductInventoryForOrder CALLED for order ${orderId} 🔥🔥🔥`);

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`[Inventory] Processing deduction for order ${orderId}`);

        // 1. Fetch Order Items for this order
        const { rows: items } = await client.query(`
            SELECT oi.id, oi.menu_item_id, oi.quantity, oi.variations, 
                   m.type, m.recipe_id, m.name as product_name
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = $1
        `, [orderId]);

        for (const item of items) {
            if (!item.recipe_id) continue;

            let recipeVariantIds = [];

            console.log(`[Inventory] processing item: ${item.product_name} (type: ${item.type})`);

            if (item.type === 'simple') {
                // Use first variant of recipe
                const { rows: vs } = await client.query(`
                     SELECT id FROM recipe_variants 
                     WHERE recipe_id = $1 
                     ORDER BY id ASC LIMIT 1
                 `, [item.recipe_id]);
                if (vs.length > 0) recipeVariantIds.push(vs[0].id);
            } else {
                // Check variations
                // item.variations might be a JSON object, array of objects, or array of strings (Postgres JSONB)
                let variations = item.variations;
                if (typeof variations === 'string') {
                    try { variations = JSON.parse(variations); } catch (e) { }
                }

                if (variations && typeof variations === 'object') {
                    let choicesList = [];
                    if (Array.isArray(variations)) {
                        choicesList = variations;
                    } else {
                        choicesList = Object.values(variations);
                    }

                    for (const choice of choicesList) {
                        let choiceName = null;

                        if (typeof choice === 'string') {
                            // Handle "Group: Option" format (e.g. "Tamaño: 12 Oz")
                            if (choice.includes(':')) {
                                // Split by first colon only to be safe
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

                        if (choiceName) {
                            const { rows: matches } = await client.query(`
                                SELECT recipe_variant_id 
                                FROM menu_item_variants 
                                WHERE menu_item_id = $1 AND name = $2
                                LIMIT 1
                            `, [item.menu_item_id, choiceName]);

                            if (matches.length > 0 && matches[0].recipe_variant_id) {
                                recipeVariantIds.push(matches[0].recipe_variant_id);
                            }
                        }
                    }
                }

                // Fallback: If no variants selected or found, maybe we should use the "default" first variant?
                // Usually for variable products, if no options link to a recipe, nothing is deducted?
                // Or maybe the User intended a "Base" that is always applied?
                // Current schema links recipe ONLY through variants in 'variable' products.
                // So if I have a "Base" cost, where is it?
                // If the user set "Latte" -> Recipe "Latte".
                // Recipe "Latte" -> Variant "Standard"? 
                // If Menu Item is variable, it usually doesn't have a "Base Recipe Variant" configured in menu_items table.
                // It relies on menu_item_variants.
                // However, we can check if recipe_variantIds is empty. 
                if (recipeVariantIds.length === 0) {
                    // Maybe try the first variant of recipe just in case? similar to simple?
                    // Dangerous assumption. I will log it.
                    console.log(`[Inventory] No recipe variants mapped for variable product ${item.product_name}. Skipping.`);
                }
            }

            // Deduct ingredients for each recipe variant
            for (const varId of recipeVariantIds) {
                const { rows: ingredients } = await client.query(`
                     SELECT product_name, quantity, unit
                     FROM recipe_items
                     WHERE variant_id = $1
                 `, [varId]);

                console.log(`[Inventory] Recipe variant ${varId} has ${ingredients.length} ingredients`);

                // Get substitution mappings from menu item variants (if any)
                const { rows: substitutions } = await client.query(`
                    SELECT name, inventory_product_name, replaced_ingredient_name
                    FROM menu_item_variants
                    WHERE menu_item_id = $1 
                      AND inventory_product_name IS NOT NULL 
                      AND inventory_product_name != ''
                      AND replaced_ingredient_name IS NOT NULL
                      AND replaced_ingredient_name != ''
                `, [item.menu_item_id]);

                console.log(`[Inventory] Found ${substitutions.length} explicit substitution mappings for menu item ${item.menu_item_id}`);
                if (substitutions.length > 0) {
                    console.log('[Inventory] Available substitutions:', substitutions.map(s => `"${s.name}": ${s.replaced_ingredient_name} -> ${s.inventory_product_name}`));
                }

                // Build a map of selected variant names from this order item
                const selectedVariantNames = new Set();
                if (item.variations && Array.isArray(item.variations)) {
                    for (const variation of item.variations) {
                        if (typeof variation === 'string' && variation.includes(':')) {
                            const parts = variation.split(':');
                            if (parts.length > 1) {
                                const variantName = parts.slice(1).join(':').trim();
                                selectedVariantNames.add(variantName);
                                console.log(`[Inventory] Selected variant: "${variantName}"`);
                            }
                        }
                    }
                }

                console.log('[Inventory] Building substitution map...');
                // Create explicit substitution map: ingredient_name -> replacement_product
                const substitutionMap = {};
                for (const sub of substitutions) {
                    if (selectedVariantNames.has(sub.name)) {
                        substitutionMap[sub.replaced_ingredient_name] = sub.inventory_product_name;
                        console.log(`[Inventory] ✓ Active substitution: "${sub.replaced_ingredient_name}" -> "${sub.inventory_product_name}" (via variant "${sub.name}")`);
                    }
                }

                // Process each ingredient
                for (const ing of ingredients) {
                    const totalQty = parseFloat(ing.quantity) * parseFloat(item.quantity);
                    let finalProductName = ing.product_name;

                    // Check for EXPLICIT substitution
                    if (substitutionMap[ing.product_name]) {
                        finalProductName = substitutionMap[ing.product_name];
                        console.log(`[Inventory] ✓ Substitution: ${ing.product_name} → ${finalProductName}`);
                    }

                    console.log(`[Inventory] Deducting: ${finalProductName} - ${totalQty} ${ing.unit}`);

                    // Insert into inventory_usage
                    await client.query(`
                         INSERT INTO inventory_usage (product_name, quantity, unit, order_id, created_at)
                         VALUES ($1, $2, $3, $4, (NOW() AT TIME ZONE 'America/Mexico_City'))
                     `, [finalProductName, totalQty, ing.unit, orderId]);
                }
            }
        }

        await client.query('COMMIT');
        console.log(`[Inventory] Deduction complete for order ${orderId}`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Inventory] Error deducting inventory:', err);
        // We don't throw here to avoid failing the HTTP request? 
        // Or we should? Ideally if inventory fail, maybe log but don't crash order?
        // But data consistency...
        // I will log only.
    } finally {
        client.release();
    }
}

module.exports = { deductInventoryForOrder };
