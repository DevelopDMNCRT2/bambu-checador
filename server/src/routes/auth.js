const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Find user
        const result = await db.query('SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare password
        // Note: For compatibility with existing plain text passwords in dev, we check both.
        // Ideally, migrate all to bcrypt.
        let match = false;

        // 1. Try bcrypt compare (assuming it might be hashed)
        const isHashed = user.password.startsWith('$2b$');
        if (isHashed) {
            match = await bcrypt.compare(password, user.password);
        } else {
            // 2. Fallback to plain text check (legacy/dev)
            match = (password === user.password);
        }

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        // Payload includes role for frontend guarding
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '8h' }
        );

        // Return user info (excluding password)
        const { password: _, ...userSafe } = user;

        res.json({
            token,
            user: userSafe
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
