const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/horarios-semanales/:usuario_id
// Devuelve el horario semanal plantilla del usuario (0=Lun ... 6=Dom)
router.get('/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT
                dia_semana,
                tipo,
                pagado,
                TO_CHAR(hora_entrada, 'HH24:MI') as hora_entrada,
                TO_CHAR(hora_salida,  'HH24:MI') as hora_salida
             FROM horarios_semanales
             WHERE usuario_id = $1
             ORDER BY dia_semana ASC`,
            [usuario_id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error GET /api/horarios-semanales:', err);
        res.status(500).json({ error: 'Error al obtener horario semanal' });
    }
});

// PUT /api/horarios-semanales/:usuario_id
// Reemplaza el horario semanal completo del usuario.
// Body: { dias: [{ dia_semana, tipo, hora_entrada, hora_salida }] }
router.put('/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    const { dias } = req.body;

    if (!Array.isArray(dias)) {
        return res.status(400).json({ error: 'Se requiere un array de días' });
    }

    try {
        // Eliminar horario anterior
        await db.query(`DELETE FROM horarios_semanales WHERE usuario_id = $1`, [usuario_id]);
        // Insertar nuevos días
        for (const d of dias) {
            if (d.dia_semana === undefined || d.dia_semana === null) continue;
            await db.query(
                `INSERT INTO horarios_semanales (usuario_id, dia_semana, tipo, pagado, hora_entrada, hora_salida)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    usuario_id,
                    d.dia_semana,
                    d.tipo || 'laboral',
                    d.tipo === 'descanso' ? !!d.pagado : false,
                    d.tipo === 'descanso' ? null : (d.hora_entrada || null),
                    d.tipo === 'descanso' ? null : (d.hora_salida  || null),
                ]
            );
        }
        res.json({ message: 'Horario semanal guardado correctamente' });
    } catch (err) {
        console.error('Error PUT /api/horarios-semanales:', err);
        res.status(500).json({ error: err.message || 'Error al guardar horario semanal' });
    }
});

module.exports = router;
