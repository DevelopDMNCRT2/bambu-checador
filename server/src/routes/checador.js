const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Coordenadas del restaurante (Opcional, si deseas validar ubicación).
// Si no quieres forzar distancia, puedes aumentar el radio o desactivar la validación.
const RESTAURANTE_LAT = parseFloat(process.env.RESTAURANTE_LAT || '19.4422797');
const RESTAURANTE_LNG = parseFloat(process.env.RESTAURANTE_LNG || '-99.2032339');

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la tierra en metros
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ── GET /api/checador/identificar ─────────────────────────────────────────────
// Identifica al usuario basado en el device_token
router.get('/identificar', async (req, res) => {
    const { deviceToken } = req.query;
    if (!deviceToken) return res.status(400).json({ error: 'Device token requerido' });

    try {
        const { rows } = await db.query(
            'SELECT id, name, role FROM users WHERE device_token = $1 AND deleted_at IS NULL',
            [deviceToken]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Dispositivo no registrado.' });
        }
        res.json({ usuario: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al identificar dispositivo' });
    }
});

// ── POST /api/checador/vincular ──────────────────────────────────────────────
// Vincula un deviceToken a un usuario si el link_token coincide
router.post('/vincular', async (req, res) => {
    const { linkToken, deviceToken } = req.body;
    if (!linkToken || !deviceToken) {
        return res.status(400).json({ error: 'Faltan parámetros (linkToken, deviceToken)' });
    }

    try {
        const userRes = await db.query(
            'SELECT id, name FROM users WHERE link_token = $1 AND deleted_at IS NULL',
            [linkToken]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Enlace inválido o expirado.' });
        }

        const user = userRes.rows[0];

        // Se vincula el dispositivo (reemplaza cualquier anterior) y se borra el link_token
        await db.query(
            'UPDATE users SET device_token = $1, link_token = NULL WHERE id = $2',
            [deviceToken, user.id]
        );

        res.json({ success: true, message: `Dispositivo vinculado a ${user.name}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al vincular el dispositivo' });
    }
});

// ── POST /api/checador/registro ──────────────────────────────────────────────
router.post('/registro', async (req, res) => {
    const { tipo, latitud, longitud, deviceToken } = req.body;

    if (!tipo || !deviceToken) {
        return res.status(400).json({ error: 'Faltan datos requeridos (tipo, deviceToken).' });
    }

    try {
        // Identificar al usuario
        const userRes = await db.query('SELECT id, name FROM users WHERE device_token = $1 AND deleted_at IS NULL', [deviceToken]);
        if (!userRes.rows.length) {
            return res.status(403).json({ error: 'Este dispositivo no está vinculado a ninguna cuenta.' });
        }
        const usuarioId = userRes.rows[0].id;

        // Validar ubicación con un radio estricto de 200 metros
        if (!latitud || !longitud) {
            return res.status(400).json({ error: 'La ubicación (GPS) es obligatoria para poder checar.' });
        }
        const distancia = calculateDistance(RESTAURANTE_LAT, RESTAURANTE_LNG, latitud, longitud);
        if (distancia > 200) {
            return res.status(403).json({ error: `Estás muy lejos del restaurante. Distancia: ${Math.round(distancia)}m (Límite: 200m).` });
        }

        // Validar lógica de Entrada/Salida en el día actual
        const asistHoyRes = await db.query(`
            SELECT tipo
            FROM asistencias
            WHERE usuario_id = $1
              AND (created_at AT TIME ZONE 'America/Mexico_City')::date = (NOW() AT TIME ZONE 'America/Mexico_City')::date
        `, [usuarioId]);
        const asistenciasHoy = asistHoyRes.rows.map(r => r.tipo);

        if (tipo === 'Entrada') {
            if (asistenciasHoy.includes('Entrada')) {
                return res.status(400).json({ error: 'Ya has registrado tu entrada el día de hoy.' });
            }
        } else if (tipo === 'Salida') {
            if (!asistenciasHoy.includes('Entrada')) {
                return res.status(400).json({ error: 'No puedes registrar salida sin haber registrado tu entrada hoy.' });
            }
            if (asistenciasHoy.includes('Salida')) {
                return res.status(400).json({ error: 'Ya has registrado tu salida el día de hoy.' });
            }
        }

        // Horario Semanal
        const ahora = new Date(); // Asumimos que el servidor está en la misma zona horaria o usando UTC
        const diaSemanaJS = ahora.getDay();
        const diaSemanaDB = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1; // Ajuste 0=Lun .. 6=Dom

        const horarioRes = await db.query(
            `SELECT tipo, hora_entrada
             FROM horarios_semanales
             WHERE usuario_id = $1 AND dia_semana = $2`,
            [usuarioId, diaSemanaDB]
        );

        if (!horarioRes.rows.length) {
            return res.status(403).json({ error: 'No tienes turno programado para hoy. Contacta a gerencia.' });
        }

        const horario = horarioRes.rows[0];
        if (horario.tipo === 'descanso') {
            return res.status(403).json({ error: 'Hoy es tu día de descanso. No puedes checar.' });
        }

        // Validar que no chequen demasiado temprano
        if (tipo === 'Entrada' && horario.hora_entrada) {
            const [hh, mm] = horario.hora_entrada.toString().split(':').map(Number);
            const inicioTurno = new Date(ahora);
            inicioTurno.setHours(hh, mm, 0, 0);

            const limiteMinimo = new Date(inicioTurno.getTime() - 15 * 60 * 1000); // 15 mins antes
            if (ahora < limiteMinimo) {
                const hMin = String(limiteMinimo.getHours()).padStart(2, '0');
                const mMin = String(limiteMinimo.getMinutes()).padStart(2, '0');
                return res.status(403).json({
                    error: `Es muy temprano. Puedes checar a partir de las ${hMin}:${mMin}.`
                });
            }
        }

        // Insertar asistencia
        const { rows } = await db.query(
            `INSERT INTO asistencias (usuario_id, tipo, latitud, longitud, distancia_metros)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, tipo, distancia_metros, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_hora`,
            [usuarioId, tipo, latitud, longitud, distancia ? Math.round(distancia) : null]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar asistencia' });
    }
});

// ── GET /api/checador/historial ──────────────────────────────────────────────
router.get('/historial', async (req, res) => {
    const { deviceToken } = req.query;
    if (!deviceToken) return res.status(400).json({ error: 'Device token requerido' });

    try {
        const userRes = await db.query('SELECT id FROM users WHERE device_token = $1', [deviceToken]);
        if (!userRes.rows.length) return res.json([]);

        const { rows } = await db.query(`
            SELECT a.id, a.tipo, TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_hora
            FROM asistencias a
            WHERE a.usuario_id = $1
            ORDER BY a.created_at DESC
            LIMIT 10
        `, [userRes.rows[0].id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// ── POST /api/checador/generar-link ──────────────────────────────────────────
// (Solo para admin)
router.post('/generar-link', async (req, res) => {
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

    try {
        const { v4: uuidv4 } = require('uuid');
        const token = uuidv4();

        await db.query('UPDATE users SET link_token = $1 WHERE id = $2', [token, usuarioId]);
        res.json({ linkToken: token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al generar enlace' });
    }
});

// ── POST /api/checador/desvincular ───────────────────────────────────────────
// (Solo para admin) Desvincula el dispositivo de un usuario
router.post('/desvincular', async (req, res) => {
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

    try {
        await db.query('UPDATE users SET device_token = NULL, link_token = NULL WHERE id = $1', [usuarioId]);
        res.json({ success: true, message: 'Dispositivo desvinculado con éxito.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al desvincular el dispositivo' });
    }
});

module.exports = router;
