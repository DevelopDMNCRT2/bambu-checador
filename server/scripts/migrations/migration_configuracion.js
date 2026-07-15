const db = require('../../src/config/db');

async function run() {
    try {
        console.log("Starting configuration table migration...");
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave VARCHAR(50) PRIMARY KEY,
                valor TEXT NOT NULL
            )
        `);
        console.log("Table 'configuracion' checked/created successfully.");

        // Insert initial coordinates and radius
        await db.query(`
            INSERT INTO configuracion (clave, valor) VALUES
            ('restaurante_latitud', '19.4422797'),
            ('restaurante_longitud', '-99.2032339'),
            ('restaurante_radio', '200')
            ON CONFLICT (clave) DO NOTHING
        `);
        console.log("Default configuration seeded successfully.");

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
