const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ── UTILITIES FOR XML CONCEPT RESOLUTION ──────────────────

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '')     // Alphanumeric + spaces only
        .replace(/\s+/g, ' ')            // Collapse spaces
        .trim();
}

const STOPWORDS = new Set([
    'con', 'de', 'del', 'al', 'en', 'para', 'por', 'el', 'la', 'los', 'las',
    'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'a', 'que', 'se', 'su',
    'sin', 'mas', 'o', 'ni',
    'carton', 'envase', 'caja', 'bolsa', 'botella', 'lata', 'tarro', 'frasco',
    'paquete', 'sobre', 'barra', 'rollo', 'saco', 'costal', 'jarra', 'bote',
    'galon', 'cubierta', 'estuche',
    'litro', 'litros', 'kilogramo', 'kilogramos', 'gramo', 'gramos',
    'mililitro', 'mililitros', 'pieza', 'piezas', 'unidad', 'unidades',
]);

const UNIT_MAP = {
    'lt': 'l', 'lts': 'l', 'litro': 'l', 'litros': 'l',
    'kg': 'kg', 'kilo': 'kg', 'kilos': 'kg',
    'kilogramo': 'kg', 'kilogramos': 'kg',
    'gr': 'g', 'grs': 'g', 'gramo': 'g', 'gramos': 'g', 'gram': 'g',
    'ml': 'ml', 'mililitro': 'ml', 'mililitros': 'ml',
    'pza': 'pz', 'pzas': 'pz', 'pieza': 'pz', 'piezas': 'pz',
    'paq': 'pq', 'paquete': 'pq', 'paquetes': 'pq',
    'ud': 'ud', 'unidad': 'ud', 'unidades': 'ud',
};

function stemSpanish(word) {
    if (!word || word.length <= 3) return word;
    if (word.length > 4 && word.endsWith('es')) {
        const beforeEs = word[word.length - 3];
        if ('aeiou'.includes(beforeEs)) {
            return word.slice(0, -1);
        }
        const stem = word.slice(0, -2);
        if (stem.length > 2) return stem;
    }
    if (!word.endsWith('es') && word.endsWith('s') && word.length > 3) {
        const beforeS = word[word.length - 2];
        if ('aeiou'.includes(beforeS)) {
            return word.slice(0, -1);
        }
    }
    return word;
}

function extractKeywords(text) {
    if (!text) return '';
    const normalized = normalizeText(text);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const keywords = new Set();
    for (const token of tokens) {
        const mapped = UNIT_MAP[token] || token;
        const stemmed = stemSpanish(mapped);
        if (!STOPWORDS.has(stemmed) && !STOPWORDS.has(mapped) &&
            (stemmed.length > 1 || stemmed === 'l' || stemmed === 'g')) {
            keywords.add(stemmed);
        }
    }
    return [...keywords].sort().join(' ');
}

// GET accumulated purchases
router.get('/accumulated', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;
        if (!startDate || !endDate) {
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else {
            start = startDate;
            end = endDate;
        }

        const dEnd = new Date(end);
        dEnd.setDate(dEnd.getDate() + 1);
        const qEnd = dEnd.toISOString().split('T')[0];

        const query = `
            SELECT 
                pi.product_name,
                MAX(pi.unit) as unit,
                SUM(pi.quantity) as total_quantity,
                SUM(pi.total) as total_spent,
                (SUM(pi.total) / NULLIF(SUM(pi.quantity), 0)) as avg_price
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            WHERE p.deleted_at IS NULL
            AND p.purchase_date >= $1::date
            AND p.purchase_date < $2::date
            GROUP BY pi.product_name
            ORDER BY total_spent DESC
        `;

        const { rows } = await db.query(query, [start, qEnd]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
    const { ticketNumber, provider, date, total, paymentMethod, items } = req.body;

    if (!ticketNumber || !provider || !date || !total || !paymentMethod) {
        console.log('Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check if invoice number already exists for this provider to prevent duplicates
        if (ticketNumber.toUpperCase() !== 'S/N' && ticketNumber.trim() !== '') {
            const checkRes = await client.query(
                `SELECT id FROM purchases WHERE TRIM(ticket_number) ILIKE $1 AND TRIM(provider) ILIKE $2 AND deleted_at IS NULL`,
                [ticketNumber.trim(), provider.trim()]
            );
            if (checkRes.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `El ticket o factura ${ticketNumber} del proveedor ${provider} ya está registrado.` });
            }
        }

        const status = (items && Array.isArray(items) && items.length > 0) ? 'Desglosado' : 'Sin Desglose';

        const { rows } = await client.query(
            `INSERT INTO purchases (ticket_number, provider, purchase_date, total, payment_method, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, (NOW() AT TIME ZONE 'America/Mexico_City')) RETURNING *`,
            [ticketNumber, provider, date, total, paymentMethod, status]
        );
        const purchase = rows[0];

        if (items && Array.isArray(items)) {
            for (const item of items) {
                const prodName = item.productId || item.producto || item.productName;
                if (!prodName || !prodName.trim()) continue;

                await client.query(
                    `INSERT INTO purchase_items (purchase_id, product_name, quantity, unit, unit_price, discount, total, cost_type, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (NOW() AT TIME ZONE 'America/Mexico_City'))`,
                    [
                        purchase.id,
                        prodName.trim(),
                        item.cantidad || item.quantity,
                        item.medida || item.unit || 'Pzas',
                        item.precioUnitario !== undefined ? item.precioUnitario : (item.unitPrice || 0),
                        item.descuento || item.discount || 0,
                        item.total || ((item.cantidad || item.quantity) * (item.precioUnitario || item.unitPrice || 0)) - (item.descuento || item.discount || 0),
                        item.costType || 'Directo'
                    ]
                );
            }
        }

        await client.query('COMMIT');
        
        res.status(201).json({
            id: purchase.id,
            ticketNumber: purchase.ticket_number,
            provider: purchase.provider,
            date: purchase.purchase_date,
            total: purchase.total,
            paymentMethod: purchase.payment_method,
            status: purchase.status
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// POST /api/purchases/resolver-conceptos
router.post('/resolver-conceptos', async (req, res) => {
    const { conceptos } = req.body;
    if (!conceptos || !Array.isArray(conceptos)) {
        return res.status(400).json({ error: 'Se requiere un array de conceptos' });
    }

    try {
        const results = [];

        for (const concepto of conceptos) {
            if (!concepto || typeof concepto !== 'string') continue;
            const normalized = normalizeText(concepto);

            // Nivel 1 — Coincidencia exacta por alias normalizado
            const aliasRes = await db.query(
                `SELECT supplier_description, canonical_name
                 FROM purchase_product_aliases
                 WHERE normalized_description = $1`,
                [normalized]
            );

            if (aliasRes.rows.length > 0) {
                const match = aliasRes.rows[0];
                results.push({
                    supplierDescription: concepto,
                    mapped: true,
                    confidence: 'exact',
                    productId: match.canonical_name,
                    productName: match.canonical_name,
                    productUnit: 'Pzas',
                    suggestions: []
                });
                continue;
            }

            // Nivel 2 — Búsqueda difusa trigram comparando contra nombres únicos en purchase_items
            const queryKeywords = extractKeywords(concepto);

            const similarityRes = await db.query(
                `SELECT DISTINCT TRIM(product_name) as name,
                        similarity(TRIM(product_name), $1) as similarity_score
                 FROM purchase_items
                 WHERE similarity(TRIM(product_name), $1) > 0.10
                 ORDER BY similarity_score DESC
                 LIMIT 5`,
                [concepto]
            );

            const suggestions = similarityRes.rows.map(row => {
                const score = parseFloat(row.similarity_score);
                return {
                    id: row.name,
                    name: row.name,
                    unit: 'Pzas',
                    score: Math.round(score * 100)
                };
            });

            const topScore = suggestions[0]?.score ?? 0;

            // >= 80% → mapeo automático
            if (topScore >= 80) {
                const top = suggestions[0];
                results.push({
                    supplierDescription: concepto,
                    mapped: true,
                    confidence: 'auto',
                    productId: top.name,
                    productName: top.name,
                    productUnit: 'Pzas',
                    suggestions: []
                });
                continue;
            }

            // < 15% → Se marca para creación automática
            if (topScore < 15) {
                results.push({
                    supplierDescription: concepto,
                    mapped: false,
                    confidence: 'auto_new',
                    productId: null,
                    productName: null,
                    productUnit: null,
                    suggestions: []
                });
                continue;
            }

            // 40–79% → sugerencia fuerte
            // 15–39% → low
            const confidence = topScore >= 40 ? 'medium' : 'low';

            results.push({
                supplierDescription: concepto,
                mapped: false,
                confidence,
                productId: null,
                productName: null,
                productUnit: null,
                suggestions
            });
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al resolver conceptos' });
    }
});

// POST /api/purchases/aliases
router.post('/aliases', async (req, res) => {
    const { productId, supplierDescription } = req.body;
    if (!productId || !supplierDescription) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        const normalized = normalizeText(supplierDescription);
        const { rows } = await db.query(
            `INSERT INTO purchase_product_aliases (supplier_description, normalized_description, canonical_name)
             VALUES ($1, $2, $3)
             ON CONFLICT (normalized_description) 
             DO UPDATE SET canonical_name = EXCLUDED.canonical_name, supplier_description = EXCLUDED.supplier_description
             RETURNING id, supplier_description as "supplierDescription", canonical_name as "canonicalName"`,
            [supplierDescription.trim(), normalized, productId.trim()]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar alias' });
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
