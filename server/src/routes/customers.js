const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/customers - Search customers with stats
router.get('/', async (req, res) => {
    try {
        const { q, filter } = req.query;

        let query = `
            WITH all_customers AS (
                -- Get distinct customers from orders (that might not be in customers table)
                SELECT 
                    customer_phone as phone,
                    MAX(customer_name) as name, -- pick one name if multiple exist for same phone
                    MAX(created_at) as latest_activity
                FROM orders 
                WHERE customer_phone IS NOT NULL AND customer_phone != ''
                GROUP BY customer_phone
                
                UNION
                
                -- Get registered customers
                SELECT 
                    phone,
                    name,
                    created_at as latest_activity -- approximate
                FROM customers
            ),
            unique_customers AS (
                -- Consolidated unique list by phone
                SELECT 
                    phone,
                    MAX(name) as name
                FROM all_customers
                GROUP BY phone
            ),
            customer_stats AS (
                SELECT 
                    uc.name,
                    uc.phone,
                    -- Balance (Linked via Phone to AR or Customer ID if exists)
                    -- For strictness, AR is linked to customer_id. We need to find customer_id if exists.
                    COALESCE((
                        SELECT SUM(ar.amount)
                        FROM accounts_receivable ar
                        JOIN customers c ON c.id = ar.customer_id
                        WHERE c.phone = uc.phone AND ar.status = 'active'
                    ), 0) as balance,
                    -- Total Orders by phone
                    (
                        SELECT COUNT(*) 
                        FROM orders o 
                        WHERE o.customer_phone = uc.phone
                    ) as total_orders,
                    -- Last Order Date
                     (
                        SELECT created_at 
                        FROM orders o 
                        WHERE o.customer_phone = uc.phone
                        ORDER BY created_at DESC 
                        LIMIT 1
                    ) as last_order_date,
                    -- Favorite Dish
                    (
                        SELECT oi.name
                        FROM order_items oi
                        JOIN orders o ON o.id = oi.order_id
                        WHERE o.customer_phone = uc.phone
                        GROUP BY oi.name
                        ORDER BY COUNT(*) DESC
                        LIMIT 1
                    ) as favorite_dish
                FROM unique_customers uc
            )
            SELECT * FROM customer_stats WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (q) {
            query += ` AND (LOWER(name) LIKE $${paramIndex} OR phone LIKE $${paramIndex})`;
            params.push(`%${q.toLowerCase()}%`);
            paramIndex++;
        }

        if (filter === 'debt') {
            query += ` AND balance > 0`;
        }

        query += ` ORDER BY name ASC LIMIT 50`;

        const result = await db.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await db.query(
            'INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING *',
            [name, phone]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
