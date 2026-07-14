const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all menu items with variants (Optimized)
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/menu-items request received');
        // 1. Fetch Items
        const itemsQuery = `
            SELECT 
                m.id,
                m.name,
                m.description,
                m.price,
                m.category,
                m.status,
                m.type,
                m.recipe_id,
                to_char(m.created_at, 'YYYY-MM-DD') as date,
                0 as real_cost
                -- TODO: Re-implement real_cost calculation safely. 
                -- Previous subquery caused 500 errors in production.
            FROM menu_items m
            WHERE m.deleted_at IS NULL
            ORDER BY m.created_at DESC
        `;

        const itemsResult = await db.query(itemsQuery);

        // 2. Fetch All Variants with Cost
        const variantsResult = await db.query(`
            SELECT 
                miv.menu_item_id, 
                miv.group_name, 
                miv.name, 
                miv.extra_price, 
                miv.recipe_variant_id, 
                miv.inventory_product_name, 
                miv.replaced_ingredient_name,
                -- miv.group_order, -- Disabled due to DB mismatch in Prod
                0 as variant_cost
            FROM menu_item_variants miv
            ORDER BY miv.menu_item_id, miv.id ASC -- Fallback to ID sort
        `);

        // 3. Map variants to items
        // Create a lookup map: itemId -> [variants]
        const variantsMap = {};
        variantsResult.rows.forEach(v => {
            if (!variantsMap[v.menu_item_id]) {
                variantsMap[v.menu_item_id] = [];
            }
            variantsMap[v.menu_item_id].push(v);
        });

        // 4. Construct response with variantGroups
        const items = itemsResult.rows.map(item => {
            if (item.type === 'variable' && variantsMap[item.id]) {
                const groups = {};
                variantsMap[item.id].forEach(v => {
                    if (!groups[v.group_name]) {
                        groups[v.group_name] = {
                            groupName: v.group_name,
                            groupOrder: 0, // Default to 0 since column is missing in prod
                            options: []
                        };
                    }
                    groups[v.group_name].options.push({
                        name: v.name,
                        extraPrice: parseFloat(v.extra_price),
                        recipeVariantId: v.recipe_variant_id,
                        variantCost: parseFloat(v.variant_cost)
                    });
                });
                // Sort by ID/Creation implicitly or name if needed. Disabling groupOrder sort.
                item.variantGroups = Object.values(groups);
            } else {
                item.variantGroups = [];
            }
            return item;
        });

        res.json(items);
    } catch (err) {
        console.error('Error in GET /api/menu-items:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE menu item
router.post('/', async (req, res) => {
    const { name, description, category, type, price, status, recipeId, icon, variantGroups } = req.body;

    // Validate required
    if (!name || !category) {
        return res.status(400).json({ error: 'Name and Category are required' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insert Menu Item
        // Note: 'icon' field currently coming from frontend might be base64 image string.
        // We'll store it in 'image_url' for now.
        const insertItemQuery = `
            INSERT INTO menu_items (
                name, description, category, type, price, status, 
                recipe_id, image_url, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (NOW() AT TIME ZONE 'America/Mexico_City'))
            RETURNING id
        `;
        const itemRes = await client.query(insertItemQuery, [
            name,
            description || '',
            category,
            type || 'simple',
            price || 0,
            status || 'active',
            recipeId || null,
            icon || null // This is the base64 string or url
        ]);

        const menuItemId = itemRes.rows[0].id;

        // 2. Insert Variants if type is variable
        if (type === 'variable' && variantGroups && Array.isArray(variantGroups)) {
            let groupIndex = 0;
            for (const group of variantGroups) {
                if (group.groupName && group.options && Array.isArray(group.options)) {
                    for (const opt of group.options) {
                        await client.query(`
                            INSERT INTO menu_item_variants (
                                menu_item_id, group_name, name, extra_price, recipe_variant_id, inventory_product_name, replaced_ingredient_name
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [
                            menuItemId,
                            group.groupName,
                            opt.name,
                            opt.extraPrice || 0,
                            opt.recipeVariantId || null,
                            opt.inventoryProductName || null,
                            opt.replacedIngredientName || null
                        ]);
                    }
                    groupIndex++;
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Menu item created', id: menuItemId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating menu item:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET single menu item with variants
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const itemRes = await db.query(`
            SELECT 
                id, name, description, category, type, price, status, 
                recipe_id as "recipeId", image_url as icon, created_at
            FROM menu_items 
            WHERE id = $1 AND deleted_at IS NULL
        `, [id]);

        if (itemRes.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        const item = itemRes.rows[0];

        // Fetch variants if applicable
        if (item.type === 'variable') {
            const varRes = await db.query(`
                SELECT 
                    group_name, 
                    name, 
                    extra_price, 
                    recipe_variant_id, 
                    inventory_product_name, 
                    replaced_ingredient_name, 
                    -- group_order -- Disabled
                    0 as group_order
                FROM menu_item_variants
                WHERE menu_item_id = $1
                ORDER BY id ASC -- Fallback sort
            `, [id]);

            // Reconstruct variantGroups structure
            const groups = {};
            varRes.rows.forEach(v => {
                if (!groups[v.group_name]) {
                    groups[v.group_name] = {
                        groupName: v.group_name,
                        groupOrder: 0, // Fallback
                        options: []
                    };
                }
                groups[v.group_name].options.push({
                    name: v.name,
                    extraPrice: parseFloat(v.extra_price),
                    recipeVariantId: v.recipe_variant_id,
                    inventoryProductName: v.inventory_product_name,
                    replacedIngredientName: v.replaced_ingredient_name
                });
            });
            // The query already orders by group_order, so Object.values should roughly respect it,
            // but for safety we sort again.
            item.variantGroups = Object.values(groups);
        } else {
            item.variantGroups = [];
        }

        res.json(item);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE menu item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, category, type, price, status, recipeId, icon, variantGroups } = req.body;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Update Menu Item
        // We update image_url only if icon is provided (it might allow clearing or replacing)
        // If data.icon is explicitly null?? frontend sends existing url or new base64. 
        // We will just update it.
        const updateQuery = `
            UPDATE menu_items 
            SET name = $1, description = $2, category = $3, type = $4, 
                price = $5, status = $6, recipe_id = $7, image_url = $8,
                updated_at = (NOW() AT TIME ZONE 'America/Mexico_City')
            WHERE id = $9
        `;

        await client.query(updateQuery, [
            name,
            description || '',
            category,
            type,
            price,
            status,
            recipeId || null,
            icon,
            id
        ]);

        // 2. Refresh Variants
        // Easiest strategy: Delete all existing variants for this item and re-insert new ones.
        await client.query('DELETE FROM menu_item_variants WHERE menu_item_id = $1', [id]);

        if (type === 'variable' && variantGroups && Array.isArray(variantGroups)) {
            let groupIndex = 0;
            for (const group of variantGroups) {
                if (group.groupName && group.options && Array.isArray(group.options)) {
                    for (const opt of group.options) {
                        await client.query(`
                            INSERT INTO menu_item_variants (
                                menu_item_id, group_name, name, extra_price, recipe_variant_id, inventory_product_name, replaced_ingredient_name
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [
                            id,
                            group.groupName,
                            opt.name,
                            opt.extraPrice || 0,
                            opt.recipeVariantId || null,
                            opt.inventoryProductName || null,
                            opt.replacedIngredientName || null
                        ]);
                    }
                    groupIndex++;
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Menu item updated' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating menu item:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// DELETE menu item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE menu_items SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1`, [id]);
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
