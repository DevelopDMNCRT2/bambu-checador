const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Function to calculate quincenal details for all users
async function generateAutomaticCut() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    let is15th = (day === 15);
    const nextDay = new Date(year, month, day + 1);
    let isLastDay = (nextDay.getMonth() !== month);
    
    // Dates range
    let startDate, endDate;
    if (day <= 15) {
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-15`;
    } else {
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-16`;
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    }
    
    const periodo = `${startDate}_al_${endDate}`;
    console.log(`[Corte Automático] Calculando corte para el periodo: ${periodo}`);
    
    try {
        // Fetch all non-admin users
        const { rows: users } = await db.query(
            "SELECT id, name, role FROM users WHERE role != 'Administrador' AND deleted_at IS NULL"
        );
        
        const corteResult = [];
        
        for (const user of users) {
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
            const { rows: nominaRows } = await db.query(query, [user.id, startDate, endDate]);
            
            const detail = nominaRows.map(row => {
                let estado = 'pendiente';
                let horaExacta = null;
                let horaExactaSalida = null;
                const horaEntradaDate = new Date(`${row.fecha}T${row.hora_entrada}:00`);
                
                const ventanaPuntualMin = new Date(horaEntradaDate.getTime() - 15 * 60000);
                const ventanaPuntualMax = new Date(horaEntradaDate.getTime() + 20 * 60000);
                const ventanaRetardoMax = new Date(horaEntradaDate.getTime() + 40 * 60000);
                const ventanaFalta = new Date(horaEntradaDate.getTime() + 2 * 3600000);
                
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
                    horaExactaSalida
                };
            });
            
            const resumen = {
                usuario_id: user.id,
                usuario: user.name,
                rol: user.role,
                entradas: detail.filter(r => r.hora_real_entrada !== null).length,
                salidas: detail.filter(r => r.hora_real_salida !== null).length,
                dias_trabajados: detail.filter(r => ['puntual', 'retardo', 'regreso'].includes(r.estadoChecado)).length,
                retardos: detail.filter(r => r.estadoChecado === 'retardo').length,
                faltas: detail.filter(r => r.estadoChecado === 'falta').length,
            };
            
            corteResult.push({ resumen, detalle: detail });
        }
        
        const cortesDir = path.resolve(__dirname, '../../cortes');
        if (!fs.existsSync(cortesDir)) {
            fs.mkdirSync(cortesDir, { recursive: true });
        }
        
        const filePath = path.join(cortesDir, `corte_${periodo}.json`);
        fs.writeFileSync(filePath, JSON.stringify({ periodo, generado_at: now.toISOString(), cortes: corteResult }, null, 2), 'utf8');
        console.log(`[Corte Automático] Guardado con éxito en: ${filePath}`);
        return { success: true, periodo, filePath, cortes: corteResult };
        
    } catch (err) {
        console.error('[Corte Automático] Error al generar corte:', err);
        throw err;
    }
}

function startAutoCutScheduler() {
    console.log('[Scheduler] Iniciando programador de corte automático...');
    
    // Check every hour
    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const day = now.getDate();
        
        // Check if it is 1 PM (hour 13)
        if (currentHour === 13) {
            const nextDay = new Date(now.getFullYear(), now.getMonth(), day + 1);
            let is15th = (day === 15);
            let isLastDay = (nextDay.getMonth() !== now.getMonth());
            
            if (is15th || isLastDay) {
                const todayStr = now.toISOString().split('T')[0];
                const lastRunFile = path.resolve(__dirname, '../../cortes/last_run.txt');
                
                if (fs.existsSync(lastRunFile)) {
                    const lastRun = fs.readFileSync(lastRunFile, 'utf8').trim();
                    if (lastRun === todayStr) {
                        return; // Already run today
                    }
                }
                
                generateAutomaticCut()
                    .then(() => {
                        const cortesDir = path.resolve(__dirname, '../../cortes');
                        if (!fs.existsSync(cortesDir)) {
                            fs.mkdirSync(cortesDir, { recursive: true });
                        }
                        fs.writeFileSync(lastRunFile, todayStr, 'utf8');
                    })
                    .catch(err => console.error('[Scheduler] Error en corte:', err));
            }
        }
    }, 60 * 60 * 1000); // Check hourly
}

module.exports = {
    generateAutomaticCut,
    startAutoCutScheduler
};
