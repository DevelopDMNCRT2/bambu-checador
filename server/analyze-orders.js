require('dotenv').config();
const db = require('./src/config/db');

async function analyzeOrders() {
    try {
        console.log('🔍 Analizando órdenes en el sistema...\n');

        // Obtener todas las órdenes con sus items
        const ordersResult = await db.query(`
            SELECT o.*, 
            to_char(o.created_at AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH12:MI a.m.') as formatted_time,
            u.username as cashier,
            (
                SELECT json_agg(
                    json_build_object(
                        'id', oi.id,
                        'menuItemId', oi.menu_item_id,
                        'name', oi.name,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'variations', oi.variations,
                        'note', oi.note
                    )
                )
                FROM order_items oi
                WHERE oi.order_id = o.id
            ) as items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 4
        `);

        if (ordersResult.rows.length === 0) {
            console.log('❌ No se encontraron órdenes en el sistema');
            process.exit(0);
        }

        console.log(`📦 Total de órdenes encontradas: ${ordersResult.rows.length}\n`);
        console.log('═'.repeat(80));

        for (const order of ordersResult.rows) {
            console.log(`\n🧾 ORDEN #${order.id}`);
            console.log(`   Fecha: ${order.formatted_time}`);
            console.log(`   Cajero: ${order.cashier || 'N/A'}`);
            console.log(`   Total: $${parseFloat(order.total).toFixed(2)}`);
            console.log(`   Método de pago: ${order.payment_method}`);
            console.log(`   Estado: ${order.status}`);
            console.log(`\n   📋 Items en la orden:`);

            const items = order.items || [];
            let totalInventoryImpact = {};

            for (const item of items) {
                console.log(`\n      • ${item.name} (x${item.quantity})`);
                console.log(`        Precio unitario: $${parseFloat(item.price).toFixed(2)}`);

                // Parse variations if it's a string
                let variations = item.variations;
                if (typeof variations === 'string') {
                    try {
                        variations = JSON.parse(variations);
                    } catch (e) {
                        variations = [];
                    }
                }

                if (variations && variations.length > 0) {
                    console.log(`        Variaciones: ${variations.join(', ')}`);
                }

                // Buscar el producto en menu_items para obtener la receta
                const menuItemResult = await db.query(
                    'SELECT id, name, recipe_id FROM menu_items WHERE id = $1 OR name = $2 LIMIT 1',
                    [item.menuItemId, item.name]
                );

                if (menuItemResult.rows.length > 0 && menuItemResult.rows[0].recipe_id) {
                    const recipeId = menuItemResult.rows[0].recipe_id;

                    // Obtener las variantes y sus items de la receta
                    const variantsResult = await db.query(`
                        SELECT id, name 
                        FROM recipe_variants 
                        WHERE recipe_id = $1 AND deleted_at IS NULL
                        ORDER BY id ASC
                    `, [recipeId]);

                    if (variantsResult.rows.length > 0) {
                        // Usar la primera variante (generalmente "Estándar")
                        const variantId = variantsResult.rows[0].id;
                        const variantName = variantsResult.rows[0].name;

                        // Obtener los items de la receta para esta variante
                        const recipeItemsResult = await db.query(`
                            SELECT 
                                product_name,
                                quantity,
                                unit,
                                unit_cost
                            FROM recipe_items
                            WHERE variant_id = $1
                            ORDER BY id ASC
                        `, [variantId]);

                        if (recipeItemsResult.rows.length > 0) {
                            console.log(`\n        📊 Impacto en inventario (Variante: ${variantName}):`);
                            for (const ingredient of recipeItemsResult.rows) {
                                const totalUsed = parseFloat(ingredient.quantity) * item.quantity;
                                console.log(`           - ${ingredient.product_name}: ${totalUsed.toFixed(2)} ${ingredient.unit}`);

                                // Acumular impacto total
                                const key = `${ingredient.product_name} (${ingredient.unit})`;
                                totalInventoryImpact[key] = (totalInventoryImpact[key] || 0) + totalUsed;
                            }
                        } else {
                            console.log(`        ⚠️  No se encontraron ingredientes en la variante de la receta`);
                        }
                    } else {
                        console.log(`        ⚠️  No se encontraron variantes en la receta`);
                    }
                } else {
                    console.log(`        ℹ️  Producto sin receta asociada (venta personalizada o sin configurar)`);
                }
            }

            // Mostrar resumen de impacto total de esta orden
            if (Object.keys(totalInventoryImpact).length > 0) {
                console.log(`\n   📊 RESUMEN DE REDUCCIÓN DE INVENTARIO (ORDEN #${order.id}):`);
                for (const [ingredient, quantity] of Object.entries(totalInventoryImpact)) {
                    console.log(`      • ${ingredient}: ${quantity.toFixed(2)}`);
                }
            }

            console.log('\n' + '═'.repeat(80));
        }

        console.log('\n✅ Análisis completado\n');

    } catch (error) {
        console.error('❌ Error al analizar órdenes:', error);
    } finally {
        await db.pool.end();
        process.exit(0);
    }
}

analyzeOrders();
