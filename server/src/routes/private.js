const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Apply JWT middleware to all routes in this router
router.use(verifyToken);

router.get('/dashboard', (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard', user: req.user });
});

module.exports = router;
