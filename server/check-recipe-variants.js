require('dotenv').config();
const db = require('./src/config/db');

async function checkRecipeVariants() {
    try {
        console.log('🔍 Verificando ingredientes de las variantes de receta del Latte...\n');

        // Obtener las variantes de receta del Latte
        const variantsResult = await db.query(`
            SELECT rv.id, rv.name, rv.recipe_id
            FROM recipe_variants rv
            JOIN recipes r ON rv.recipe_id = r.id
            WHERE r.name = 'Latte' AND rv.deleted_at IS NULL
            ORDER BY rv.id ASC
        `);

        console.log(`📋 Variantes de receta encontradas: ${variantsResult.rows.length}\n`);
        console.log('═'.repeat(80));

        for (const variant of variantsResult.rows) {
            console.log(`\n📦 VARIANTE: ${variant.name} (ID: ${variant.id})`);
            console.log('─'.repeat(80));

            // Obtener los ingredientes de esta variante
            const ingredientsResult = await db.query(`
                SELECT product_name, quantity, unit, unit_cost, total_cost
                FROM recipe_items
                WHERE variant_id = $1
                ORDER BY id ASC
            `, [variant.id]);

            if (ingredientsResult.rows.length === 0) {
                console.log('   ⚠️  No hay ingredientes configurados para esta variante');
            } else {
                console.log(`   Ingredientes (${ingredientsResult.rows.length}):`);
                ingredientsResult.rows.forEach(ing => {
                    console.log(`      • ${ing.product_name}: ${ing.quantity} ${ing.unit} @ $${parseFloat(ing.unit_cost).toFixed(2)} = $${parseFloat(ing.total_cost).toFixed(2)}`);
                });

                const totalCost = ingredientsResult.rows.reduce((sum, ing) => sum + parseFloat(ing.total_cost), 0);
                console.log(`\n   💰 Costo total de la variante: $${totalCost.toFixed(2)}`);
            }

            console.log('');
        }

        console.log('═'.repeat(80));
        console.log('\n✅ Análisis completado\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.pool.end();
        process.exit(0);
    }
}

checkRecipeVariants();
