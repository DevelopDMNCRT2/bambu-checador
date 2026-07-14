const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all expenses
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT 
                id, 
                concept, 
                TO_CHAR(date, 'YYYY-MM-DD') as date, 
                amount, 
                paid_to as "paidTo",
                payment_method as "paymentMethod"
            FROM expenses 
            WHERE deleted_at IS NULL 
            ORDER BY date DESC, created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single expense
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT 
                id, 
                concept, 
                TO_CHAR(date, 'YYYY-MM-DD') as date, 
                amount, 
                paid_to as "paidTo",
                payment_method as "paymentMethod"
            FROM expenses 
            WHERE id = $1 AND deleted_at IS NULL
        `, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE expense
router.post('/', async (req, res) => {
    const { concept, date, amount, paidTo, paymentMethod } = req.body;

    if (!concept || !date || !amount || !paidTo || !paymentMethod) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO expenses (concept, date, amount, paid_to, payment_method, created_at)
             VALUES ($1, $2, $3, $4, $5, (NOW() AT TIME ZONE 'America/Mexico_City')) RETURNING *`,
            [concept, date, amount, paidTo, paymentMethod]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE expense
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { concept, date, amount, paidTo, paymentMethod } = req.body;

    if (!concept || !date || !amount || !paidTo || !paymentMethod) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { rows } = await db.query(
            `UPDATE expenses 
             SET concept = $1, date = $2, amount = $3, paid_to = $4, payment_method = $5, updated_at = (NOW() AT TIME ZONE 'America/Mexico_City')
             WHERE id = $6 RETURNING *`,
            [concept, date, amount, paidTo, paymentMethod, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE expenses SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1", [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
