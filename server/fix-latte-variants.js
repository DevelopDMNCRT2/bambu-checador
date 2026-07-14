require('dotenv').config();
const db = require('./src/config/db');

async function fixLatteVariants() {
    try {
        console.log('🔍 Verificando configuración del Latte...\n');

        // 1. Buscar el menu item "Latte"
        const latteResult = await db.query(`
            SELECT id, name, recipe_id, type
            FROM menu_items
            WHERE name = 'Latte' AND deleted_at IS NULL
        `);

        if (latteResult.rows.length === 0) {
            console.log('❌ No se encontró el producto "Latte"');
            process.exit(0);
        }

        const latte = latteResult.rows[0];
        console.log(`✅ Producto encontrado: ${latte.name} (ID: ${latte.id}, Tipo: ${latte.type})`);
        console.log(`   Recipe ID: ${latte.recipe_id}\n`);

        if (!latte.recipe_id) {
            console.log('❌ El Latte no tiene una receta asociada');
            process.exit(0);
        }

        // 2. Obtener las variantes de la receta
        const recipeVariantsResult = await db.query(`
            SELECT id, name, recipe_id
            FROM recipe_variants
            WHERE recipe_id = $1 AND deleted_at IS NULL
            ORDER BY id ASC
        `, [latte.recipe_id]);

        console.log(`📋 Variantes de receta encontradas (${recipeVariantsResult.rows.length}):`);
        recipeVariantsResult.rows.forEach(v => {
            console.log(`   - ${v.name} (ID: ${v.id})`);
        });
        console.log('');

        // 3. Obtener las variantes del menu item
        const menuVariantsResult = await db.query(`
            SELECT id, group_name, name, extra_price, recipe_variant_id
            FROM menu_item_variants
            WHERE menu_item_id = $1
            ORDER BY group_name, id
        `, [latte.id]);

        console.log(`📋 Variantes del menu item (${menuVariantsResult.rows.length}):`);
        menuVariantsResult.rows.forEach(v => {
            console.log(`   - Grupo: "${v.group_name}", Opción: "${v.name}", Extra: $${v.extra_price}, Recipe Variant ID: ${v.recipe_variant_id || 'NULL'}`);
        });
        console.log('');

        // 4. Mapeo sugerido
        console.log('═'.repeat(80));
        console.log('\n💡 MAPEO SUGERIDO:\n');

        const mapping = {
            '12 Oz': recipeVariantsResult.rows.find(v => v.name.includes('12')),
            '16 Oz': recipeVariantsResult.rows.find(v => v.name.includes('16'))
        };

        console.log('Para el grupo "Tamaño":');
        for (const [optionName, recipeVariant] of Object.entries(mapping)) {
            if (recipeVariant) {
                console.log(`   "${optionName}" → Variante de receta: "${recipeVariant.name}" (ID: ${recipeVariant.id})`);
            } else {
                console.log(`   "${optionName}" → ⚠️  No se encontró variante de receta correspondiente`);
            }
        }

        console.log('\n═'.repeat(80));
        console.log('\n🔧 ¿Deseas aplicar la corrección automática? (Este script solo muestra la información)\n');
        console.log('Para aplicar la corrección, necesitarás actualizar manualmente los recipe_variant_id');
        console.log('en la tabla menu_item_variants o a través del admin.\n');

        // Mostrar SQL para corrección manual
        console.log('📝 SQL para corrección manual:\n');

        const tamanioVariants = menuVariantsResult.rows.filter(v => v.group_name === 'Tamaño');

        for (const variant of tamanioVariants) {
            const suggestedRecipeVariant = mapping[variant.name];
            if (suggestedRecipeVariant) {
                console.log(`UPDATE menu_item_variants`);
                console.log(`SET recipe_variant_id = ${suggestedRecipeVariant.id}`);
                console.log(`WHERE id = ${variant.id}; -- ${variant.name}\n`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.pool.end();
        process.exit(0);
    }
}

fixLatteVariants();
