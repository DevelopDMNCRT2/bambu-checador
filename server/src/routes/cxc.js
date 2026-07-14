const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/cxc - Get active accounts receivable
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                ar.id,
                ar.amount,
                ar.order_id,
                ar.created_at,
                c.name as customer_name,
                c.phone as customer_phone,
                o.total as order_total,
                to_char(ar.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH12:MI AM') as formatted_date
            FROM accounts_receivable ar
            JOIN customers c ON ar.customer_id = c.id
            JOIN orders o ON ar.order_id = o.id
            WHERE ar.status = 'active'
            ORDER BY ar.created_at DESC
        `;

        const result = await db.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching CXC:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
