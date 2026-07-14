require('dotenv').config();
const db = require('./src/config/db');

async function checkInventoryUsage() {
    try {
        console.log('🔍 Verificando deducciones reales de inventario...\n');

        // Obtener las deducciones de inventario para las órdenes
        const usageResult = await db.query(`
            SELECT 
                iu.order_id,
                iu.product_name,
                iu.quantity,
                iu.unit,
                to_char(iu.created_at AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH12:MI a.m.') as created_time,
                o.total,
                (
                    SELECT json_agg(
                        json_build_object(
                            'name', oi.name,
                            'quantity', oi.quantity,
                            'variations', oi.variations
                        )
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                ) as items
            FROM inventory_usage iu
            JOIN orders o ON iu.order_id = o.id
            WHERE o.id IN (6, 7, 8, 9)
            ORDER BY iu.order_id, iu.id
        `);

        console.log(`📊 Deducciones de inventario encontradas: ${usageResult.rows.length}\n`);
        console.log('═'.repeat(80));

        let currentOrderId = null;

        for (const row of usageResult.rows) {
            if (currentOrderId !== row.order_id) {
                if (currentOrderId !== null) {
                    console.log('═'.repeat(80));
                }
                currentOrderId = row.order_id;

                console.log(`\n🧾 ORDEN #${row.order_id} (Total: $${parseFloat(row.total).toFixed(2)})`);
                console.log(`   Fecha: ${row.created_time}`);

                // Mostrar items de la orden
                const items = row.items || [];
                console.log(`\n   Items:`);
                items.forEach(item => {
                    let variations = item.variations;
                    if (typeof variations === 'string') {
                        try {
                            variations = JSON.parse(variations);
                        } catch (e) {
                            variations = [];
                        }
                    }
                    const varText = variations && variations.length > 0 ? ` (${variations.join(', ')})` : '';
                    console.log(`      • ${item.name} x${item.quantity}${varText}`);
                });

                console.log(`\n   Deducciones de inventario:`);
            }

            console.log(`      - ${row.product_name}: ${parseFloat(row.quantity).toFixed(2)} ${row.unit}`);
        }

        console.log('\n' + '═'.repeat(80));
        console.log('\n✅ Análisis completado\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.pool.end();
        process.exit(0);
    }
}

checkInventoryUsage();
