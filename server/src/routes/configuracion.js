const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to extract lat/lng from any Google Maps URL
function extractCoordsFromUrl(url) {
    // 1. Check for @lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }
    // 2. Check for /search/lat,lng (sometimes with a '+' or '+-' sign before lng)
    const searchMatch = url.match(/\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
    if (searchMatch) {
        return { lat: parseFloat(searchMatch[1]), lng: parseFloat(searchMatch[2]) };
    }
    // 3. Check for q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }
    // 4. Check for ll=lat,lng
    const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }
    // 5. General check for any format: /decimal,decimal (e.g. /19.4422797,-99.2032339)
    const generalMatch = url.match(/\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
    if (generalMatch) {
        return { lat: parseFloat(generalMatch[1]), lng: parseFloat(generalMatch[2]) };
    }
    return null;
}

// GET /api/configuracion
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            "SELECT clave, valor FROM configuracion WHERE clave IN ('restaurante_latitud', 'restaurante_longitud', 'restaurante_radio')"
        );
        let latitud = 19.4422797;
        let longitud = -99.2032339;
        let radio = 200;

        rows.forEach(r => {
            if (r.clave === 'restaurante_latitud') latitud = parseFloat(r.valor);
            if (r.clave === 'restaurante_longitud') longitud = parseFloat(r.valor);
            if (r.clave === 'restaurante_radio') radio = parseFloat(r.valor);
        });

        res.json({ latitud, longitud, radio });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// PUT /api/configuracion
router.put('/', async (req, res) => {
    const { latitud, longitud, radio } = req.body;
    if (latitud === undefined || longitud === undefined || radio === undefined) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (latitud, longitud, radio)' });
    }

    try {
        await db.query("INSERT INTO configuracion (clave, valor) VALUES ('restaurante_latitud', $1) ON CONFLICT (clave) DO UPDATE SET valor = $1", [String(latitud)]);
        await db.query("INSERT INTO configuracion (clave, valor) VALUES ('restaurante_longitud', $1) ON CONFLICT (clave) DO UPDATE SET valor = $1", [String(longitud)]);
        await db.query("INSERT INTO configuracion (clave, valor) VALUES ('restaurante_radio', $1) ON CONFLICT (clave) DO UPDATE SET valor = $1", [String(radio)]);

        res.json({ success: true, message: 'Configuración actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// POST /api/configuracion/parse-link
router.post('/parse-link', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }

    try {
        let finalUrl = url;
        // If it is a short link or normal link, try to follow it
        if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || (url.includes('maps.google.com') && !url.includes('@'))) {
            const response = await fetch(url, { method: 'GET', redirect: 'follow' });
            finalUrl = response.url;
        }

        const coords = extractCoordsFromUrl(finalUrl);
        if (!coords) {
            return res.status(400).json({ error: 'No se encontraron coordenadas en el enlace de Google Maps. Por favor, asegúrate de copiar la URL completa desde la barra de direcciones de tu navegador.' });
        }

        res.json({ success: true, ...coords });
    } catch (err) {
        console.error('Error in parse-link:', err);
        res.status(400).json({ error: 'Error al resolver el enlace de Google Maps. Asegúrate de que el enlace sea válido.' });
    }
});

module.exports = router;
