const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/nomina?fecha=YYYY-MM-DD
// Devuelve todos los registros de nómina del día con cálculo de estado de asistencia
router.get('/', async (req, res) => {
    const { fecha } = req.query;
    if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
    }

    try {
        // Nota: Obtenemos hora_real_entrada y hora_real_salida dinámicamente de asistencias
        const query = `
            SELECT
                n.id,
                n.usuario_id,
                u.name AS usuario,
                n.rol,
                TO_CHAR(n.hora_entrada, 'HH24:MI') as hora_entrada,
                TO_CHAR(n.hora_salida,  'HH24:MI') as hora_salida,
                TO_CHAR(n.fecha, 'YYYY-MM-DD')     as fecha,
                (SELECT MIN(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Entrada' AND DATE(created_at) = n.fecha) as hora_real_entrada,
                (SELECT MAX(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Salida' AND DATE(created_at) = n.fecha) as hora_real_salida
            FROM nomina n
            JOIN users u ON n.usuario_id = u.id
            WHERE TO_CHAR(n.fecha, 'YYYY-MM-DD') = $1
              AND u.deleted_at IS NULL
            ORDER BY n.hora_entrada ASC
        `;
        const { rows } = await db.query(query, [fecha]);

        const now = new Date();

        const result = rows.map(row => {
            let estado = 'pendiente';
            let horaExacta = null;
            let horaExactaSalida = null;

            const horaEntradaDate = new Date(`${fecha}T${row.hora_entrada}:00`);

            // Ventanas de tiempo actualizadas
            const ventanaPuntualMin = new Date(horaEntradaDate.getTime() -  15 * 60000); // -15 min (puede checar temprano)
            const ventanaPuntualMax = new Date(horaEntradaDate.getTime() +  20 * 60000); // +20 min (puntual hasta el min 20)
            const ventanaRetardoMax = new Date(horaEntradaDate.getTime() +  40 * 60000); // +40 min (retardo entre 20 y 40 min)
            const ventanaFalta      = new Date(horaEntradaDate.getTime() +   2 * 3600000); // +2 h (si no checa)

            if (row.hora_real_salida) {
                const horaRealS = new Date(row.hora_real_salida);
                horaExactaSalida = horaRealS.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            }

            if (row.hora_real_entrada) {
                const horaReal = new Date(row.hora_real_entrada);
                horaExacta = horaReal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                if (horaReal >= ventanaPuntualMin && horaReal <= ventanaPuntualMax) {
                    estado = 'puntual';
                } else if (horaReal > ventanaPuntualMax && horaReal <= ventanaRetardoMax) {
                    estado = 'retardo';
                } else if (horaReal > ventanaRetardoMax) {
                    estado = 'regreso'; // Más de 40 mins = regreso al empleado
                } else {
                    estado = 'puntual'; // llegó antes de la ventana (válido porque el checador restringe -15 min máximo)
                }
            } else {
                // No ha checado
                if (now >= ventanaFalta) {
                    estado = 'falta';
                } else {
                    estado = 'pendiente';
                }
            }

            return {
                ...row,
                estadoChecado: estado,
                horaExacta,
                horaExactaSalida,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Error GET /api/nomina:', err);
        res.status(500).json({ error: 'Error al obtener la nómina' });
    }
});

// POST /api/nomina
// Acepta un registro o array de registros. Omite duplicados (mismo usuario_id + fecha).
router.post('/', async (req, res) => {
    const payload = req.body;
    const registros = Array.isArray(payload) ? payload : [payload];

    if (!registros.length) {
        return res.status(400).json({ error: 'Se requiere al menos un registro' });
    }

    for (const r of registros) {
        if (!r.usuario_id || !r.hora_entrada || !r.hora_salida || !r.fecha) {
            return res.status(400).json({ error: 'Faltan datos requeridos en uno o más registros' });
        }
    }

    try {
        const insertados = [];

        for (const r of registros) {
            // Evitar duplicados
            const existing = await db.query(
                `SELECT id FROM nomina WHERE usuario_id = $1 AND fecha = $2`,
                [r.usuario_id, r.fecha]
            );
            if (existing.rows.length > 0) continue;

            const { rows } = await db.query(
                `INSERT INTO nomina (usuario_id, rol, hora_entrada, hora_salida, fecha)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [r.usuario_id, r.rol || 'N/A', r.hora_entrada, r.hora_salida, r.fecha]
            );
            insertados.push(rows[0]);
        }

        res.status(201).json(insertados);
    } catch (err) {
        console.error('Error POST /api/nomina:', err);
        res.status(500).json({ error: err.message || 'Error al crear registros en nómina' });
    }
});

// GET /api/nomina/semana?usuario_id=X&semana_inicio=YYYY-MM-DD
// Devuelve todos los registros de nómina de un usuario en el rango lunes→domingo de esa semana
router.get('/semana', async (req, res) => {
    const { usuario_id, semana_inicio } = req.query;
    if (!usuario_id || !semana_inicio) {
        return res.status(400).json({ error: 'Se requieren usuario_id y semana_inicio' });
    }

    try {
        const base = new Date(semana_inicio + 'T12:00:00');
        const dayOfWeek = base.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(base);
        monday.setDate(base.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const { rows } = await db.query(
            `SELECT id, usuario_id, rol,
                TO_CHAR(hora_entrada, 'HH24:MI') as hora_entrada,
                TO_CHAR(hora_salida,  'HH24:MI') as hora_salida,
                TO_CHAR(fecha, 'YYYY-MM-DD')     as fecha
             FROM nomina
             WHERE usuario_id = $1
               AND fecha BETWEEN $2 AND $3
             ORDER BY fecha ASC`,
            [usuario_id, toStr(monday), toStr(sunday)]
        );

        res.json(rows);
    } catch (err) {
        console.error('Error GET /api/nomina/semana:', err);
        res.status(500).json({ error: 'Error al obtener nomina de la semana' });
    }
});

// PUT /api/nomina/semana
// Body: { usuario_id, rol, registros: [{ fecha, hora_entrada, hora_salida }] }
// Upsert: actualiza si existe, crea si no
router.put('/semana', async (req, res) => {
    const { usuario_id, rol, registros } = req.body;
    if (!usuario_id || !Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ error: 'Se requieren usuario_id y registros' });
    }

    try {
        const resultado = [];

        for (const r of registros) {
            if (!r.fecha || !r.hora_entrada || !r.hora_salida) continue;
            const { rows } = await db.query(
                `INSERT INTO nomina (usuario_id, rol, hora_entrada, hora_salida, fecha)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (usuario_id, fecha)
                 DO UPDATE SET hora_entrada = $3, hora_salida = $4, rol = $2
                 RETURNING id, usuario_id, rol,
                   TO_CHAR(hora_entrada, 'HH24:MI') as hora_entrada,
                   TO_CHAR(hora_salida,  'HH24:MI') as hora_salida,
                   TO_CHAR(fecha, 'YYYY-MM-DD')     as fecha`,
                [usuario_id, rol || 'N/A', r.hora_entrada, r.hora_salida, r.fecha]
            );
            resultado.push(rows[0]);
        }

        res.json(resultado);
    } catch (err) {
        console.error('Error PUT /api/nomina/semana:', err);
        res.status(500).json({ error: err.message || 'Error al actualizar nomina de la semana' });
    }
});

// GET /api/nomina/corte-quincenal
router.get('/corte-quincenal', async (req, res) => {
    const { usuario_id, fecha_inicio, fecha_fin } = req.query;
    if (!usuario_id || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Faltan parámetros (usuario_id, fecha_inicio, fecha_fin)' });
    }

    try {
        const query = `
            SELECT
                n.id,
                n.usuario_id,
                u.name AS usuario,
                n.rol,
                TO_CHAR(n.hora_entrada, 'HH24:MI') as hora_entrada,
                TO_CHAR(n.hora_salida,  'HH24:MI') as hora_salida,
                TO_CHAR(n.fecha, 'YYYY-MM-DD')     as fecha,
                (SELECT MIN(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Entrada' AND DATE(created_at) = n.fecha) as hora_real_entrada,
                (SELECT MAX(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Salida' AND DATE(created_at) = n.fecha) as hora_real_salida
            FROM nomina n
            JOIN users u ON n.usuario_id = u.id
            WHERE n.usuario_id = $1
              AND n.fecha BETWEEN $2 AND $3
              AND u.deleted_at IS NULL
            ORDER BY n.fecha ASC
        `;
        const { rows } = await db.query(query, [usuario_id, fecha_inicio, fecha_fin]);

        const now = new Date();

        const result = rows.map(row => {
            let estado = 'pendiente';
            let horaExacta = null;
            let horaExactaSalida = null;

            const horaEntradaDate = new Date(`${row.fecha}T${row.hora_entrada}:00`);

            // Ventanas de tiempo
            const ventanaPuntualMin = new Date(horaEntradaDate.getTime() -  15 * 60000);
            const ventanaPuntualMax = new Date(horaEntradaDate.getTime() +  20 * 60000);
            const ventanaRetardoMax = new Date(horaEntradaDate.getTime() +  40 * 60000);
            const ventanaFalta      = new Date(horaEntradaDate.getTime() +   2 * 3600000);

            if (row.hora_real_salida) {
                const horaRealS = new Date(row.hora_real_salida);
                horaExactaSalida = horaRealS.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            }

            if (row.hora_real_entrada) {
                const horaReal = new Date(row.hora_real_entrada);
                horaExacta = horaReal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                if (horaReal >= ventanaPuntualMin && horaReal <= ventanaPuntualMax) {
                    estado = 'puntual';
                } else if (horaReal > ventanaPuntualMax && horaReal <= ventanaRetardoMax) {
                    estado = 'retardo';
                } else if (horaReal > ventanaRetardoMax) {
                    estado = 'regreso';
                } else {
                    estado = 'puntual';
                }
            } else {
                if (now >= ventanaFalta) {
                    estado = 'falta';
                } else {
                    estado = 'pendiente';
                }
            }

            return {
                ...row,
                estadoChecado: estado,
                horaExacta,
                horaExactaSalida,
            };
        });

        // Calcular resumen: Entradas, Salidas, Días Trabajados, Retardos, Faltas
        const resumen = {
            entradas: result.filter(r => r.hora_real_entrada !== null).length,
            salidas: result.filter(r => r.hora_real_salida !== null).length,
            dias_trabajados: result.filter(r => ['puntual', 'retardo', 'regreso'].includes(r.estadoChecado)).length,
            retardos: result.filter(r => r.estadoChecado === 'retardo').length,
            faltas: result.filter(r => r.estadoChecado === 'falta').length,
        };

        res.json({ resumen, detalle: result });
    } catch (err) {
        console.error('Error GET /api/nomina/corte-quincenal:', err);
        res.status(500).json({ error: 'Error al obtener el corte quincenal' });
    }
});

// GET /api/nomina/cortes-guardados
// Lista todos los cortes automáticos guardados en el disco
router.get('/cortes-guardados', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const cortesDir = path.resolve(__dirname, '../../cortes');
        
        if (!fs.existsSync(cortesDir)) {
            return res.json([]);
        }
        
        const files = fs.readdirSync(cortesDir).filter(f => f.startsWith('corte_') && f.endsWith('.json'));
        const list = files.map(file => {
            const filePath = path.join(cortesDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return {
                archivo: file,
                periodo: content.periodo,
                generado_at: content.generado_at,
                resumenes: content.cortes.map(c => c.resumen)
            };
        });
        
        // Ordenar descendente por nombre de archivo
        list.sort((a, b) => b.archivo.localeCompare(a.archivo));
        res.json(list);
    } catch (err) {
        console.error('Error GET /api/nomina/cortes-guardados:', err);
        res.status(500).json({ error: 'Error al obtener cortes guardados' });
    }
});

// GET /api/nomina/cortes-guardados/:filename
// Obtiene el detalle completo de un corte quincenal guardado
router.get('/cortes-guardados/:filename', async (req, res) => {
    const { filename } = req.params;
    try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.resolve(__dirname, '../../cortes', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo de corte no encontrado' });
        }
        
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(content);
    } catch (err) {
        console.error('Error GET /api/nomina/cortes-guardados/:filename:', err);
        res.status(500).json({ error: 'Error al obtener detalle del corte' });
    }
});

// POST /api/nomina/corte-automatico-trigger
// Disparador manual para generar el corte actual inmediatamente (útil para pruebas/admin)
router.post('/corte-automatico-trigger', async (req, res) => {
    try {
        const { generateAutomaticCut } = require('../utils/scheduler');
        const result = await generateAutomaticCut();
        res.json(result);
    } catch (err) {
        console.error('Error POST /api/nomina/corte-automatico-trigger:', err);
        res.status(500).json({ error: err.message || 'Error al ejecutar corte automático' });
    }
});

module.exports = router;
