const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to map category names to frontend IDs
const getCategoryId = (catName) => {
    if (!catName) return 'others';
    const lower = catName.toLowerCase();
    if (lower.includes('café') || lower.includes('cafe')) return 'cafe';
    if (lower.includes('bebida')) return 'bebidas';
    if (lower.includes('sandwich')) return 'sandwiches';
    if (lower.includes('desayuno')) return 'desayunos';
    if (lower.includes('huevo')) return 'huevos';
    if (lower.includes('menu') || lower.includes('menú')) return 'menu_dia';
    return lower.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// GET Public Menu
router.get('/menu', async (req, res) => {
    try {
        const itemsResult = await db.query(`
            SELECT m.id, m.name as title, m.description, m.price, m.category, m.type, m.image_url as image,
            COALESCE(SUM(oi.quantity), 0) as popularity
            FROM menu_items m
            LEFT JOIN order_items oi ON m.id = oi.menu_item_id
            WHERE m.status = 'active' AND m.deleted_at IS NULL
            GROUP BY m.id
            ORDER BY popularity DESC, m.category, m.id
        `);

        const items = itemsResult.rows;

        // 2. Fetch all variants for these items
        // We could do a JOIN, but fetching all variants and mapping in memory is often cleaner for nested structures
        // unless the dataset is huge.
        const variantsResult = await db.query(`
            SELECT menu_item_id, group_name, name, extra_price 
            FROM menu_item_variants
            ORDER BY menu_item_id, id
            `);

        const variantsMap = {};
        variantsResult.rows.forEach(v => {
            if (!variantsMap[v.menu_item_id]) {
                variantsMap[v.menu_item_id] = [];
            }
            variantsMap[v.menu_item_id].push(v);
        });

        // 3. Assemble the response object
        const formattedItems = items.map(item => {
            const product = {
                id: item.id,
                title: item.title,
                description: item.description,
                price: parseFloat(item.price), // ensure number
                category: item.category,
                category_id: getCategoryId(item.category),
                image: item.image,
                hasVariations: item.type === 'variable'
            };

            if (product.hasVariations && variantsMap[item.id]) {
                // Group variants by group_name
                const groups = {};
                variantsMap[item.id].forEach(v => {
                    if (!groups[v.group_name]) {
                        groups[v.group_name] = {
                            name: v.group_name,
                            choices: []
                        };
                    }

                    // Format choice
                    const choice = {
                        label: v.name
                    };

                    // Handling Price Logic logic from mockup:
                    // If group name is "Tamaño" (Size), it usually overrides base price logic in frontend?
                    // mockProducts.js: 
                    // choices: [{ label: '12 Oz', price: 49 }, { label: '16 Oz', price: 59 }]
                    // vs
                    // choices: [{ label: 'Almendras', extraPrice: 5 }]

                    // Our DB stores "extra_price".
                    // If it's a size update, we might need to handle it.
                    // For now, we will output `extraPrice` property.
                    // If the backend `extra_price` is meant to be the full price (for sizes), frontend might need adjustment
                    // OR we assume `extra_price` is always added to base.

                    // Let's stick to `extraPrice` as defined in DB schema.
                    if (parseFloat(v.extra_price) > 0) {
                        choice.extraPrice = parseFloat(v.extra_price);
                    } else {
                        choice.extraPrice = 0;
                    }

                    groups[v.group_name].choices.push(choice);
                });

                product.options = Object.values(groups);
            }

            return product;
        });

        res.json(formattedItems);

    } catch (err) {
        console.error('Error fetching public menu:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

module.exports = router;
