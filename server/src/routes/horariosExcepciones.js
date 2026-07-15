const express = require('express');
const router = express.Router();
const db = require('../config/db');

// PUT /api/horarios-excepciones/:usuario_id
// Reemplaza o registra excepciones de horario para un rango de fechas.
// Body: { fecha_inicio, fecha_fin, dias: [{ dia_semana, tipo, pagado, hora_entrada, hora_salida }] }
router.put('/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    const { fecha_inicio, fecha_fin, dias } = req.body;

    if (!fecha_inicio || !fecha_fin || !Array.isArray(dias)) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (fecha_inicio, fecha_fin, dias)' });
    }

    try {
        // 1. Eliminar cualquier excepción previa que se solape con el nuevo rango
        await db.query(
            `DELETE FROM horarios_excepciones 
             WHERE usuario_id = $1 
               AND NOT (fecha_fin < $2 OR fecha_inicio > $3)`,
            [usuario_id, fecha_inicio, fecha_fin]
        );

        // 2. Insertar los nuevos horarios de excepción
        for (const d of dias) {
            if (d.dia_semana === undefined || d.dia_semana === null) continue;
            await db.query(
                `INSERT INTO horarios_excepciones (usuario_id, fecha_inicio, fecha_fin, dia_semana, tipo, pagado, hora_entrada, hora_salida)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    usuario_id,
                    fecha_inicio,
                    fecha_fin,
                    d.dia_semana,
                    d.tipo || 'laboral',
                    d.tipo === 'descanso' ? !!d.pagado : false,
                    d.tipo === 'descanso' ? null : (d.hora_entrada || null),
                    d.tipo === 'descanso' ? null : (d.hora_salida  || null),
                ]
            );
        }

        // 3. Sincronizar de inmediato los registros en la tabla nomina para el rango de fechas
        const start = new Date(fecha_inicio + 'T12:00:00');
        const end = new Date(fecha_fin + 'T12:00:00');
        
        const userRes = await db.query("SELECT role FROM users WHERE id = $1", [usuario_id]);
        const userRole = userRes.rows[0]?.role || 'N/A';

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeekJS = d.getDay();
            const diaSemanaDB = dayOfWeekJS === 0 ? 6 : dayOfWeekJS - 1;

            const configDia = dias.find(dia => dia.dia_semana === diaSemanaDB);

            if (configDia) {
                if (configDia.tipo === 'laboral' && configDia.hora_entrada && configDia.hora_salida) {
                    await db.query(
                        `INSERT INTO nomina (usuario_id, rol, hora_entrada, hora_salida, fecha)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (usuario_id, fecha)
                         DO UPDATE SET hora_entrada = $3, hora_salida = $4, rol = $2`,
                        [usuario_id, userRole, configDia.hora_entrada, configDia.hora_salida, dateStr]
                    );
                } else if (configDia.tipo === 'descanso') {
                    await db.query(
                        `DELETE FROM nomina WHERE usuario_id = $1 AND fecha = $2`,
                        [usuario_id, dateStr]
                    );
                }
            }
        }

        res.json({ message: 'Excepciones de horario guardadas y sincronizadas correctamente' });
    } catch (err) {
        console.error('Error PUT /api/horarios-excepciones:', err);
        res.status(500).json({ error: err.message || 'Error al guardar excepciones de horario' });
    }
});

module.exports = router;
