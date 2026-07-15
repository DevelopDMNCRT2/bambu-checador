const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Running exception schedules migration...');

        // Create table
        await query(`
            CREATE TABLE IF NOT EXISTS horarios_excepciones (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
                tipo VARCHAR(50) DEFAULT 'laboral',
                pagado BOOLEAN DEFAULT FALSE,
                hora_entrada TIME,
                hora_salida TIME,
                CONSTRAINT range_valid CHECK (fecha_inicio <= fecha_fin)
            );
        `);

        // Create indexes for faster range queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_horarios_excep_user_range 
            ON horarios_excepciones(usuario_id, fecha_inicio, fecha_fin);
        `);

        console.log('Exception schedules migration finished successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running exception schedules migration:', err);
        process.exit(1);
    }
};

runMigration();
