const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET all users (excluding soft-deleted)
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, name, email, username, role, pin FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single user
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT id, name, email, username, role, pin FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new user
router.post('/', async (req, res) => {
    const { name, email, username, role, password, pin } = req.body;
    if (!name || !email || !username || !role || !password || !pin) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await db.query(
            'INSERT INTO users (name, email, username, role, password, pin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, username, role, hashedPassword, pin]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_email_key') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        if (err.constraint === 'users_username_key') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, username, role, pin, password } = req.body;

    if (!name || !email || !username || !role || !pin) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        let query, params;
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = "UPDATE users SET name = $1, email = $2, username = $3, role = $4, pin = $5, password = $6, updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $7 RETURNING *";
            params = [name, email, username, role, pin, hashedPassword, id];
        } else {
            query = "UPDATE users SET name = $1, email = $2, username = $3, role = $4, pin = $5, updated_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $6 RETURNING *";
            params = [name, email, username, role, pin, id];
        }

        const { rows } = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_email_key') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        if (err.constraint === 'users_username_key') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE user (Soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE users SET deleted_at = (NOW() AT TIME ZONE 'America/Mexico_City') WHERE id = $1", [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
