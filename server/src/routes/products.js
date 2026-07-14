const express = require('express');
const router = express.Router();
const db = require('../config/db');

// SEARCH products
router.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
        let queryText = `
            SELECT DISTINCT product_name 
            FROM purchase_items 
            WHERE 1=1
        `;
        const params = [];

        if (q) {
            queryText += ` AND product_name ILIKE $1`;
            params.push(`%${q}%`);
        }

        queryText += ` ORDER BY product_name ASC LIMIT 10`;

        const { rows } = await db.query(queryText, params);
        res.json(rows.map(r => r.product_name));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET product cost (last purchase)
router.get('/cost', async (req, res) => {
    const { name } = req.query;
    try {
        const { rows } = await db.query(`
            SELECT 
                pi.unit_price as "lastCost",
                pi.unit as "lastUnit"
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            WHERE p.deleted_at IS NULL AND TRIM(pi.product_name) ILIKE $1
            ORDER BY p.purchase_date DESC, p.created_at DESC
            LIMIT 1
        `, [name.trim()]);

        if (rows.length > 0) {
            res.json({ cost: Number(rows[0].lastCost), unit: rows[0].lastUnit });
        } else {
            res.json({ cost: 0, unit: 'Pzas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
