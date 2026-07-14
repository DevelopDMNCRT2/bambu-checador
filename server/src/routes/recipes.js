const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all recipes
router.get('/', async (req, res) => {
    try {
        // Fetch from Dynamic View (Real-Time Costs with Range)
        const { rows } = await db.query(`
            SELECT 
                id, 
                name, 
                category, 
                min_cost,
                max_cost,
                to_char(created_at, 'YYYY-MM-DD') as date 
            FROM recipes_with_dynamic_cost 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE recipe
router.post('/', async (req, res) => {
    const { name, category, variants } = req.body;
    // Expect: variants = [{ name: 'Estándar', items: [...] }]

    try {
        const { rows } = await db.query(
            `INSERT INTO recipes (name, category, created_at) 
             VALUES ($1, $2, (NOW() AT TIME ZONE 'America/Mexico_City')) 
             RETURNING id`,
            [name, category]
        );
        const recipeId = rows[0].id;

        // Loop through variants
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                const { rows: vRows } = await db.query(
                    `INSERT INTO recipe_variants (recipe_id, name) VALUES ($1, $2) RETURNING id`,
                    [recipeId, v.name]
                );
                const variantId = vRows[0].id;

                if (v.items && Array.isArray(v.items)) {
                    for (const item of v.items) {
                        await db.query(
                            `INSERT INTO recipe_items (recipe_id, variant_id, product_name, quantity, unit, unit_cost, total_cost, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, (NOW() AT TIME ZONE 'America/Mexico_City'))`,
                            [recipeId, variantId, item.productName, item.quantity, item.unit, item.unitCost, item.totalCost]
                        );
                    }
                }
            }
        }

        res.json({ message: 'Recipe created successfully', id: recipeId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single recipe
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const recipeRes = await db.query('SELECT * FROM recipes WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (recipeRes.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
        const recipe = recipeRes.rows[0];

        // Fetch Variants
        const variantsRes = await db.query('SELECT * FROM recipe_variants WHERE recipe_id = $1 AND deleted_at IS NULL ORDER BY id ASC', [id]);

        const variants = [];
        for (const v of variantsRes.rows) {
            // Fetch items for this variant
            const itemsRes = await db.query('SELECT * FROM recipe_items WHERE variant_id = $1 ORDER BY id ASC', [v.id]);
            variants.push({
                ...v,
                items: itemsRes.rows.map(item => ({
                    ...item,
                    unit_cost: Number(item.unit_cost),
                    total_cost: Number(item.quantity) * Number(item.unit_cost)
                }))
            });
        }

        recipe.variants = variants;
        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE recipe
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, variants } = req.body;

    try {
        // Update Recipe Info
        await db.query(
            `UPDATE recipes 
             SET name = $1, category = $2, updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') 
             WHERE id = $3`,
            [name, category, id]
        );

        if (variants && Array.isArray(variants)) {
            // Soft-delete removed variants
            const incomingIds = variants.filter(v => v.id).map(v => v.id);
            if (incomingIds.length === 0) {
                await db.query(`UPDATE recipe_variants SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE recipe_id = $1`, [id]);
            } else {
                await db.query(`UPDATE recipe_variants SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE recipe_id = $1 AND NOT (id = ANY($2::int[]))`, [id, incomingIds]);
            }

            for (const v of variants) {
                let variantId = v.id;
                if (variantId) {
                    // Update name
                    await db.query('UPDATE recipe_variants SET name = $1 WHERE id = $2', [v.name, variantId]);
                } else {
                    // Create new variant
                    const { rows: newV } = await db.query('INSERT INTO recipe_variants (recipe_id, name) VALUES ($1, $2) RETURNING id', [id, v.name]);
                    variantId = newV[0].id;
                }

                // Replace Items for this variant
                await db.query('DELETE FROM recipe_items WHERE variant_id = $1', [variantId]);

                if (v.items && Array.isArray(v.items)) {
                    for (const item of v.items) {
                        await db.query(
                            `INSERT INTO recipe_items (recipe_id, variant_id, product_name, quantity, unit, unit_cost, total_cost, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, (NOW() AT TIME ZONE 'America/Mexico_City'))`,
                            [id, variantId, item.productName, item.quantity, item.unit, item.unitCost, item.totalCost]
                        );
                    }
                }
            }
        }

        res.json({ message: 'Recipe updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
