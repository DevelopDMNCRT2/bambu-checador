require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const db = require('../config/db');

async function checkDataQuality() {
    console.log('--- INICIO DE ANÁLISIS DE CALIDAD DE DATOS (PRODUCCIÓN) ---');

    try {
        // 1. Check for Negative Stock
        const { rows: inventory } = await db.query(`
            WITH bought AS (
                SELECT 
                    LOWER(TRIM(pi.product_name)) as join_name,
                    MAX(pi.product_name) as display_name,
                    LOWER(TRIM(pi.unit)) as join_unit,
                    MAX(pi.unit) as display_unit,
                    SUM(pi.quantity) as total_quantity
                FROM purchase_items pi
                JOIN purchases p ON pi.purchase_id = p.id
                WHERE p.deleted_at IS NULL
                GROUP BY LOWER(TRIM(pi.product_name)), LOWER(TRIM(pi.unit))
            ),
            used AS (
                SELECT 
                    LOWER(TRIM(product_name)) as join_name,
                    LOWER(TRIM(unit)) as join_unit,
                    SUM(quantity) as total_used
                FROM inventory_usage
                GROUP BY LOWER(TRIM(product_name)), LOWER(TRIM(unit))
            ),
            adjusted AS (
                SELECT
                    LOWER(TRIM(product_name)) as join_name,
                    LOWER(TRIM(unit)) as join_unit,
                    SUM(quantity) as total_adjusted
                FROM inventory_adjustments
                GROUP BY LOWER(TRIM(product_name)), LOWER(TRIM(unit))
            ),
            all_products AS (
                SELECT join_name, join_unit FROM bought
                UNION
                SELECT join_name, join_unit FROM adjusted
            )
            SELECT 
                COALESCE(b.display_name, adj.join_name) as "productName",
                COALESCE(b.display_unit, adj.join_unit) as "unit",
                COALESCE(b.total_quantity, 0) as "totalQuantity",
                COALESCE(u.total_used, 0) as "usedQuantity",
                COALESCE(adj.total_adjusted, 0) as "adjustedQuantity",
                (COALESCE(b.total_quantity, 0) + COALESCE(adj.total_adjusted, 0) - COALESCE(u.total_used, 0)) as stock
            FROM all_products ap
            LEFT JOIN bought b ON ap.join_name = b.join_name AND ap.join_unit = b.join_unit
            LEFT JOIN adjusted adj ON ap.join_name = adj.join_name AND ap.join_unit = adj.join_unit
            LEFT JOIN used u ON ap.join_name = u.join_name AND ap.join_unit = u.join_unit
            ORDER BY stock ASC
        `);

        console.log('\n--- STOCK ACTUAL (Top 10 Menores/Negativos) ---');
        const negativeStock = inventory.filter(i => i.stock < 0);
        if (negativeStock.length > 0) {
            console.log(`⚠️ ALERTA: ${negativeStock.length} productos tienen stock negativo.`);
            negativeStock.forEach(i => console.log(`   - ${i.productName}: ${parseFloat(i.stock).toFixed(3)} ${i.unit} (Comprado: ${i.totalQuantity}, Usado: ${i.usedQuantity}, Ajustado: ${i.adjustedQuantity})`));
        } else {
            console.log('✅ No se encontraron stocks negativos.');
        }

        // 2. Check for Products without Units (Anomalies)
        console.log('\n--- ANOMALÍAS DE TEXTO ---');
        const weirdUnits = inventory.filter(i => !i.unit || i.unit.trim() === '');
        if (weirdUnits.length > 0) {
            console.log(`⚠️ ALERTA: ${weirdUnits.length} productos no tienen unidad definida.`);
            weirdUnits.forEach(i => console.log(`   - ${i.productName}`));
        } else {
            console.log('✅ Todas los productos tienen unidad.');
        }

    } catch (err) {
        console.error('Error durante el análisis:', err);
    } finally {
        process.exit();
    }
}

checkDataQuality();
