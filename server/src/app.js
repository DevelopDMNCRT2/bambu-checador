const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const publicRoutes = require('./routes/public');
const protectedRoutes = require('./routes/private');
const nominaRoutes = require('./routes/nomina');
const horariosSemanalesRoutes = require('./routes/horariosSemanales');
const horariosExcepcionesRoutes = require('./routes/horariosExcepciones');
const checadorRoutes = require('./routes/checador');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(require('compression')()); // Optimize response size
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', publicRoutes);
app.use('/api/admin', protectedRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/menu-items', require('./routes/menuItems'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/cxc', require('./routes/cxc'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/nomina', nominaRoutes);
app.use('/api/horarios-semanales', horariosSemanalesRoutes);
app.use('/api/horarios-excepciones', horariosExcepcionesRoutes);
app.use('/api/checador', checadorRoutes);

// Health check
app.use('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = app;
