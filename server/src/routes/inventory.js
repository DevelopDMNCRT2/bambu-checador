const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(`
            WITH bought AS (
                SELECT 
                    LOWER(TRIM(pi.product_name)) as join_name,
                    MAX(pi.product_name) as display_name,
                    LOWER(TRIM(pi.unit)) as join_unit,
                    MAX(pi.unit) as display_unit,
                    SUM(pi.quantity) as total_quantity,
                    SUM(pi.total) as total_spent,
                    MAX(p.purchase_date) as last_purchase_date
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
                    MAX(product_name) as display_name,
                    LOWER(TRIM(unit)) as join_unit,
                    MAX(unit) as display_unit,
                    SUM(quantity) as total_adjusted,
                    MIN(created_at) as first_adjustment_date
                FROM inventory_adjustments
                GROUP BY LOWER(TRIM(product_name)), LOWER(TRIM(unit))
            ),
            latest_cost_type AS (
                SELECT DISTINCT ON (LOWER(TRIM(pi.product_name)), LOWER(TRIM(pi.unit)))
                    LOWER(TRIM(pi.product_name)) as join_name,
                    LOWER(TRIM(pi.unit)) as join_unit,
                    pi.cost_type
                FROM purchase_items pi
                JOIN purchases p ON pi.purchase_id = p.id
                WHERE p.deleted_at IS NULL
                ORDER BY LOWER(TRIM(pi.product_name)), LOWER(TRIM(pi.unit)), p.purchase_date DESC
            ),
            all_products AS (
                SELECT join_name, join_unit FROM bought
                UNION
                SELECT join_name, join_unit FROM adjusted
            )
            SELECT 
                COALESCE(b.display_name, adj.display_name) as "productName",
                COALESCE(b.display_unit, adj.display_unit) as "unit",
                COALESCE(b.total_quantity, 0) as "totalQuantity",
                COALESCE(u.total_used, 0) as "usedQuantity",
                COALESCE(adj.total_adjusted, 0) as "adjustedQuantity",
                COALESCE(b.total_spent, 0) as "totalSpent",
                b.last_purchase_date as "lastPurchaseDate",
                adj.first_adjustment_date as "firstAdjustmentDate",
                COALESCE(lct.cost_type, 'Directo') as "costType"
            FROM all_products ap
            LEFT JOIN bought b ON ap.join_name = b.join_name AND ap.join_unit = b.join_unit
            LEFT JOIN adjusted adj ON ap.join_name = adj.join_name AND ap.join_unit = adj.join_unit
            LEFT JOIN used u ON ap.join_name = u.join_name AND ap.join_unit = u.join_unit
            LEFT JOIN latest_cost_type lct ON ap.join_name = lct.join_name AND ap.join_unit = lct.join_unit
            ORDER BY "productName" ASC
        `);

        const inventory = rows.map(row => {
            let lastPurchase = 'N/A';
            if (row.lastPurchaseDate) {
                lastPurchase = new Date(row.lastPurchaseDate).toISOString().split('T')[0];
            } else if (row.firstAdjustmentDate) {
                lastPurchase = new Date(row.firstAdjustmentDate).toISOString().split('T')[0];
            }

            let avgCost = '0.00';
            if (row.totalQuantity > 0) {
                avgCost = (Number(row.totalSpent) / Number(row.totalQuantity)).toFixed(2);
            } else if (Number(row.totalSpent) === 0 && Number(row.totalQuantity) === 0) {
                avgCost = '-'; // Manual product
            }

            let costType = row.costType;
            if (Number(row.totalSpent) === 0 && Number(row.totalQuantity) === 0 && !row.lastPurchaseDate) {
                costType = '-'; // Manual product
            }

            return {
                productName: row.productName,
                quantity: Number(row.totalQuantity),
                unit: row.unit,
                averageCost: avgCost,
                lastPurchase: lastPurchase,
                stock: (Number(row.totalQuantity) + Number(row.adjustedQuantity)) - Number(row.usedQuantity),
                costType: costType
            };
        });

        res.json(inventory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Manual Inventory Adjustment
router.post('/adjust', require('../middleware/auth'), async (req, res) => {
    const { productName, quantity, unit, reason } = req.body;
    const adminId = req.user.id; // From auth middleware

    if (!productName || !quantity || !unit) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await db.query(`
            INSERT INTO inventory_adjustments (product_name, quantity, unit, reason, admin_id)
            VALUES ($1, $2, $3, $4, $5)
        `, [productName, quantity, unit, reason, adminId]);

        res.json({ message: 'Adjustment recorded successfully' });
    } catch (err) {
        console.error('Error recording adjustment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get list of inventory product names (for dropdown in menu item variant editor)
router.get('/products', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT DISTINCT TRIM(product_name) as name
            FROM purchase_items
            WHERE deleted_at IS NULL
            ORDER BY name ASC
        `);

        res.json(rows.map(r => r.name));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
