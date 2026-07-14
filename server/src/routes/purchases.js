const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all purchases
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(`
      SELECT 
        id, 
        ticket_number as "ticketNumber", 
        provider, 
        TO_CHAR(purchase_date, 'YYYY-MM-DD') as date, 
        total, 
        payment_method as "paymentMethod",
        status
      FROM purchases 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single purchase
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(`
      SELECT 
        id, 
        ticket_number as "ticketNumber", 
        provider, 
        TO_CHAR(purchase_date, 'YYYY-MM-DD') as date, 
        total, 
        payment_method as "paymentMethod",
        status
      FROM purchases 
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE purchase
router.post('/', async (req, res) => {
    console.log('POST /api/purchases body:', req.body);
    const { ticketNumber, provider, date, total, paymentMethod } = req.body;

    if (!ticketNumber || !provider || !date || !total || !paymentMethod) {
        console.log('Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO purchases (ticket_number, provider, purchase_date, total, payment_method, created_at) 
       VALUES ($1, $2, $3, $4, $5, (NOW() AT TIME ZONE 'America/Mexico_City')) RETURNING *`,
            [ticketNumber, provider, date, total, paymentMethod]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE purchase
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`PUT /api/purchases/${id} body:`, req.body);
    const { ticketNumber, provider, date, total, paymentMethod } = req.body;

    if (!ticketNumber || !provider || !date || !total || !paymentMethod) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { rows } = await db.query(
            `UPDATE purchases SET ticket_number = $1, provider = $2, purchase_date = $3, total = $4, payment_method = $5, updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') 
             WHERE id = $6 RETURNING *`,
            [ticketNumber, provider, date, total, paymentMethod, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE purchase
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE purchases SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1", [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET Breakdown Items
router.get('/:id/items', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT 
                id, 
                product_name as "productName", 
                quantity, 
                unit, 
                unit_price as "unitPrice", 
                discount, 
                total,
                cost_type as "costType" 
            FROM purchase_items 
            WHERE purchase_id = $1 AND deleted_at IS NULL
            ORDER BY id ASC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SAVE Breakdown Items
router.post('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided' });
    }

    try {
        // 1. Clear existing items (to allow updates)
        await db.query(`DELETE FROM purchase_items WHERE purchase_id = $1`, [id]);

        // 2. Insert items
        for (const item of items) {
            if (!item.productName || !item.productName.trim()) continue;

            await db.query(
                `INSERT INTO purchase_items (purchase_id, product_name, quantity, unit, unit_price, discount, total, cost_type, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (NOW() AT TIME ZONE 'America/Mexico_City'))`,
                [id, item.productName.trim(), item.quantity, item.unit, item.unitPrice, item.discount, item.total, item.costType || 'Directo']
            );
        }

        // 2. Update status
        await db.query(`UPDATE purchases SET status = 'Desglosado', updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1`, [id]);

        res.json({ message: 'Breakdown saved successfully' });
    } catch (err) {
        console.error('Error saving breakdown:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
