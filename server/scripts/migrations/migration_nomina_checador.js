const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running payroll and check-in migration...');

        // 1. Extend users table
        console.log('Extending users table...');
        await query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS device_token VARCHAR(255);
        `);
        await query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS link_token VARCHAR(255);
        `);

        // 2. Create horarios_semanales table
        console.log('Creating horarios_semanales table...');
        await query(`
            CREATE TABLE IF NOT EXISTS horarios_semanales (
                usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
                tipo VARCHAR(50) DEFAULT 'laboral',
                pagado BOOLEAN DEFAULT FALSE,
                hora_entrada TIME,
                hora_salida TIME,
                PRIMARY KEY (usuario_id, dia_semana)
            )
        `);

        // 3. Create nomina table
        console.log('Creating nomina table...');
        await query(`
            CREATE TABLE IF NOT EXISTS nomina (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rol VARCHAR(100) DEFAULT 'N/A',
                hora_entrada TIME NOT NULL,
                hora_salida TIME NOT NULL,
                fecha DATE NOT NULL,
                UNIQUE (usuario_id, fecha)
            )
        `);

        // 4. Create asistencias table
        console.log('Creating asistencias table...');
        await query(`
            CREATE TABLE IF NOT EXISTS asistencias (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Entrada', 'Salida')),
                latitud NUMERIC(10, 8),
                longitud NUMERIC(11, 8),
                distancia_metros INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')
            )
        `);

        console.log('Payroll and check-in migration finished successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running payroll and check-in migration:', err);
        process.exit(1);
    }
};

runMigration();
