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
        // Auto-generación de registros de nómina basados en horarios activos (excepciones o plantillas)
        const { rows: users } = await db.query(
            "SELECT id, role FROM users WHERE role != 'Administrador' AND deleted_at IS NULL"
        );

        const d = new Date(fecha + 'T12:00:00');
        const dayOfWeekJS = d.getDay();
        const diaSemanaDB = dayOfWeekJS === 0 ? 6 : dayOfWeekJS - 1;

        for (const user of users) {
            const { rows: existing } = await db.query(
                `SELECT id FROM nomina WHERE usuario_id = $1 AND fecha = $2`,
                [user.id, fecha]
            );

            if (existing.length === 0) {
                const schedRes = await db.query(`
                    SELECT tipo, hora_entrada, hora_salida
                    FROM (
                        SELECT tipo, hora_entrada, hora_salida, 1 as prioridad
                        FROM horarios_excepciones
                        WHERE usuario_id = $1 
                          AND dia_semana = $2 
                          AND $3 BETWEEN fecha_inicio AND fecha_fin
                        
                        UNION ALL
                        
                        SELECT tipo, hora_entrada, hora_salida, 2 as prioridad
                        FROM horarios_semanales
                        WHERE usuario_id = $1 
                          AND dia_semana = $2
                    ) AS active_schedules
                    ORDER BY prioridad ASC
                    LIMIT 1
                `, [user.id, diaSemanaDB, fecha]);

                if (schedRes.rows.length > 0) {
                    const sched = schedRes.rows[0];
                    if (sched.tipo === 'laboral' && sched.hora_entrada && sched.hora_salida) {
                        await db.query(
                            `INSERT INTO nomina (usuario_id, rol, hora_entrada, hora_salida, fecha)
                             VALUES ($1, $2, $3, $4, $5)
                             ON CONFLICT (usuario_id, fecha) DO NOTHING`,
                            [user.id, user.role || 'N/A', sched.hora_entrada, sched.hora_salida, fecha]
                        );
                    }
                }
            }
        }

        // Nota: hora_real_entrada_fmt y hora_real_salida_fmt ya vienen formateadas en hora México
        // directamente desde PostgreSQL, sin depender del Intl API de Node.js.
        const query = `
            SELECT
                n.id,
                n.usuario_id,
                u.name AS usuario,
                n.rol,
                TO_CHAR(n.hora_entrada, 'HH24:MI') as hora_entrada,
                TO_CHAR(n.hora_salida,  'HH24:MI') as hora_salida,
                TO_CHAR(n.fecha, 'YYYY-MM-DD')     as fecha,
                (SELECT MIN(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Entrada' AND (created_at AT TIME ZONE 'America/Mexico_City')::date = n.fecha) as hora_real_entrada_ts,
                (SELECT MAX(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Salida'  AND (created_at AT TIME ZONE 'America/Mexico_City')::date = n.fecha) as hora_real_salida_ts,
                TO_CHAR((SELECT MIN(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Entrada' AND (created_at AT TIME ZONE 'America/Mexico_City')::date = n.fecha) AT TIME ZONE 'America/Mexico_City', 'HH12:MI AM') as hora_real_entrada_fmt,
                TO_CHAR((SELECT MAX(created_at) FROM asistencias WHERE usuario_id = n.usuario_id AND tipo = 'Salida'  AND (created_at AT TIME ZONE 'America/Mexico_City')::date = n.fecha) AT TIME ZONE 'America/Mexico_City', 'HH12:MI AM') as hora_real_salida_fmt
            FROM nomina n
            JOIN users u ON n.usuario_id = u.id
            WHERE TO_CHAR(n.fecha, 'YYYY-MM-DD') = $1
              AND u.deleted_at IS NULL
            ORDER BY n.hora_entrada ASC
        `;
        const { rows } = await db.query(query, [fecha]);

        // IMPORTANT: The server runs in UTC. Schedule times (hora_entrada/hora_salida) are
        // stored without timezone, so new Date(`${fecha}T15:00:00`) is interpreted as 15:00 UTC.
        // We must also compare against Mexico City wall-clock time (not UTC) to avoid false positives.
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

        const result = rows.map(row => {
            let estado = 'pendiente';
            let horaExacta = null;
            let horaExactaSalida = null;
            let horas_extras_mins = 0;

            const horaEntradaDate = new Date(`${fecha}T${row.hora_entrada}:00`);
            const horaSalidaDate = new Date(`${fecha}T${row.hora_salida}:00`);

            // Ventanas de tiempo actualizadas
            const ventanaPuntualMin = new Date(horaEntradaDate.getTime() -  15 * 60000); // -15 min (puede checar temprano)
            const ventanaPuntualMax = new Date(horaEntradaDate.getTime() +  20 * 60000); // +20 min (puntual hasta el min 20)
            const ventanaRetardoMax = new Date(horaEntradaDate.getTime() +  40 * 60000); // +40 min (retardo entre 20 y 40 min)
            const ventanaFalta      = new Date(horaEntradaDate.getTime() +   2 * 3600000); // +2 h (si no checa)
            const ventanaSalidaMax  = new Date(horaSalidaDate.getTime() +   30 * 60000); // +30 min tolerancia de salida

            if (row.hora_real_salida_ts) {
                const horaRealS = new Date(row.hora_real_salida_ts);
                horaExactaSalida = row.hora_real_salida_fmt || horaRealS.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
            }

            if (row.hora_real_entrada_ts) {
                const horaReal = new Date(row.hora_real_entrada_ts);
                horaExacta = row.hora_real_entrada_fmt || horaReal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

                if (horaReal >= ventanaPuntualMin && horaReal <= ventanaPuntualMax) {
                    estado = 'puntual';
                } else if (horaReal > ventanaPuntualMax && horaReal <= ventanaRetardoMax) {
                    estado = 'retardo';
                } else if (horaReal > ventanaRetardoMax) {
                    estado = 'regreso'; // Más de 40 mins = regreso al empleado
                } else {
                    estado = 'puntual'; // llegó antes de la ventana (válido porque el checador restringe -15 min máximo)
                }

                // Evaluar salida
                if (row.hora_real_salida_ts) {
                    const horaRealS = new Date(row.hora_real_salida_ts);
                    if (horaRealS > ventanaSalidaMax) {
                        estado = 'horas_extras';
                        const diffMins = Math.round((horaRealS.getTime() - horaSalidaDate.getTime()) / 60000);
                        horas_extras_mins = diffMins > 0 ? diffMins : 0;
                    }
                } else {
                    if (now > ventanaSalidaMax) {
                        estado = 'sin_salida';
                    }
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
                horas_extras_mins,
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
        const [semRes, exRes, nomRes, asisRes] = await Promise.all([
            db.query(`SELECT dia_semana, tipo, hora_entrada, hora_salida FROM horarios_semanales WHERE usuario_id = $1`, [usuario_id]),
            db.query(`SELECT fecha_inicio, fecha_fin, dia_semana, tipo, hora_entrada, hora_salida FROM horarios_excepciones WHERE usuario_id = $1 AND NOT (fecha_fin < $2 OR fecha_inicio > $3)`, [usuario_id, fecha_inicio, fecha_fin]),
            db.query(`SELECT id, rol, TO_CHAR(hora_entrada, 'HH24:MI') as hora_entrada, TO_CHAR(hora_salida, 'HH24:MI') as hora_salida, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha FROM nomina WHERE usuario_id = $1 AND fecha BETWEEN $2 AND $3`, [usuario_id, fecha_inicio, fecha_fin]),
            db.query(`SELECT tipo, created_at, TO_CHAR(created_at AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') as fecha, TO_CHAR(created_at AT TIME ZONE 'America/Mexico_City', 'HH12:MI AM') as hora_fmt FROM asistencias WHERE usuario_id = $1 AND (created_at AT TIME ZONE 'America/Mexico_City')::date BETWEEN $2 AND $3 ORDER BY created_at ASC`, [usuario_id, fecha_inicio, fecha_fin])
        ]);

        const userRes = await db.query('SELECT role, name FROM users WHERE id = $1', [usuario_id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const user = userRes.rows[0];

        const horariosSemanalesMap = {};
        semRes.rows.forEach(r => {
            horariosSemanalesMap[r.dia_semana] = r;
        });

        const exceptions = exRes.rows;

        const nominaMap = {};
        nomRes.rows.forEach(r => {
            nominaMap[r.fecha] = r;
        });

        const asistenciasMap = {};
        asisRes.rows.forEach(r => {
            if (!asistenciasMap[r.fecha]) {
                asistenciasMap[r.fecha] = { entradas: [], salidas: [] };
            }
            if (r.tipo === 'Entrada') {
                asistenciasMap[r.fecha].entradas.push({ ts: r.created_at, fmt: r.hora_fmt });
            } else if (r.tipo === 'Salida') {
                asistenciasMap[r.fecha].salidas.push({ ts: r.created_at, fmt: r.hora_fmt });
            }
        });

        const result = [];
        const pad = (n) => String(n).padStart(2, '0');
        let curr = new Date(fecha_inicio + 'T12:00:00');
        const end = new Date(fecha_fin + 'T12:00:00');
        // IMPORTANT: Same timezone fix — compare Mexico City wall-clock time against schedule times.
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

        while (curr <= end) {
            const y = curr.getFullYear();
            const m = pad(curr.getMonth() + 1);
            const d = pad(curr.getDate());
            const dateStr = `${y}-${m}-${d}`;

            const dayJS = curr.getDay(); // 0 = Sun, 1 = Mon...
            const diaSemanaDB = dayJS === 0 ? 6 : dayJS - 1;

            // 1. Resolver el horario de este día
            // Primero buscar excepciones
            let activeSched = null;
            const activeEx = exceptions.find(ex => {
                const start = new Date(ex.fecha_inicio);
                const endEx = new Date(ex.fecha_fin);
                start.setHours(0,0,0,0);
                endEx.setHours(23,59,59,999);
                return curr >= start && curr <= endEx && ex.dia_semana === diaSemanaDB;
            });

            if (activeEx) {
                activeSched = {
                    tipo: activeEx.tipo,
                    hora_entrada: activeEx.hora_entrada,
                    hora_salida: activeEx.hora_salida
                };
            } else {
                activeSched = horariosSemanalesMap[diaSemanaDB] || { tipo: 'descanso', hora_entrada: null, hora_salida: null };
            }

            // Si es descanso, lo excluimos completamente de la nómina
            if (activeSched.tipo === 'descanso') {
                curr.setDate(curr.getDate() + 1);
                continue;
            }

            // 2. Obtener datos de nómina/asistencias
            const nominaRow = nominaMap[dateStr];
            const asisRow = asistenciasMap[dateStr] || { entradas: [], salidas: [] };

            const finalRol = nominaRow ? nominaRow.rol : (user.role || 'N/A');
            let finalHoraEntrada = '';
            let finalHoraSalida = '';

            if (nominaRow) {
                finalHoraEntrada = nominaRow.hora_entrada;
                finalHoraSalida = nominaRow.hora_salida;
            } else {
                finalHoraEntrada = activeSched.hora_entrada ? activeSched.hora_entrada.slice(0, 5) : '';
                finalHoraSalida = activeSched.hora_salida ? activeSched.hora_salida.slice(0, 5) : '';
            }

            const horaRealEntradaRaw = asisRow.entradas.length > 0 ? asisRow.entradas[0] : null;
            const horaRealSalidaRaw = asisRow.salidas.length > 0 ? asisRow.salidas[asisRow.salidas.length - 1] : null;

            // Calcular estado
            let estado = 'pendiente';
            let horaExacta = null;
            let horaExactaSalida = null;
            let horas_extras_mins = 0;

            if (horaRealSalidaRaw) {
                const horaRealS = new Date(horaRealSalidaRaw.ts);
                horaExactaSalida = horaRealSalidaRaw.fmt || horaRealS.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
            }

            if (finalHoraEntrada) {
                const horaEntradaDate = new Date(`${dateStr}T${finalHoraEntrada}:00`);
                const horaSalidaDate = new Date(`${dateStr}T${finalHoraSalida}:00`);

                const ventanaPuntualMin = new Date(horaEntradaDate.getTime() -  15 * 60000);
                const ventanaPuntualMax = new Date(horaEntradaDate.getTime() +  20 * 60000);
                const ventanaRetardoMax = new Date(horaEntradaDate.getTime() +  40 * 60000);
                const ventanaFalta      = new Date(horaEntradaDate.getTime() +   2 * 3600000);
                const ventanaSalidaMax  = new Date(horaSalidaDate.getTime() +   30 * 60000);

                if (horaRealEntradaRaw) {
                    const horaReal = new Date(horaRealEntradaRaw.ts);
                    horaExacta = horaRealEntradaRaw.fmt || horaReal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

                    if (horaReal >= ventanaPuntualMin && horaReal <= ventanaPuntualMax) {
                        estado = 'puntual';
                    } else if (horaReal > ventanaPuntualMax && horaReal <= ventanaRetardoMax) {
                        estado = 'retardo';
                    } else if (horaReal > ventanaRetardoMax) {
                        estado = 'regreso';
                    } else {
                        estado = 'puntual';
                    }

                    if (horaRealSalidaRaw) {
                        const horaRealS = new Date(horaRealSalidaRaw.ts);
                        if (horaRealS > ventanaSalidaMax) {
                            estado = 'horas_extras';
                            const diffMins = Math.round((horaRealS.getTime() - horaSalidaDate.getTime()) / 60000);
                            horas_extras_mins = diffMins > 0 ? diffMins : 0;
                        }
                    } else {
                        if (now > ventanaSalidaMax) {
                            estado = 'sin_salida';
                        }
                    }
                } else {
                    if (now >= ventanaFalta) {
                        estado = 'falta';
                    } else {
                        estado = 'pendiente';
                    }
                }
            }

            result.push({
                id: nominaRow ? nominaRow.id : null,
                usuario_id: Number(usuario_id),
                usuario: user.name,
                rol: finalRol,
                hora_entrada: finalHoraEntrada,
                hora_salida: finalHoraSalida,
                fecha: dateStr,
                estadoChecado: estado,
                horaExacta,
                horaExactaSalida,
                horas_extras_mins,
            });

            curr.setDate(curr.getDate() + 1);
        }

        const resumen = {
            entradas: result.filter(r => r.horaExacta !== null).length,
            salidas: result.filter(r => r.horaExactaSalida !== null).length,
            dias_trabajados: result.filter(r => ['puntual', 'retardo', 'regreso', 'horas_extras', 'sin_salida'].includes(r.estadoChecado)).length,
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
