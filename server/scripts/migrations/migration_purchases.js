const { query } = require('../../src/config/db.js');

async function run() {
    try {
        console.log('Creating Purchases table...');

        await query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(100),
                provider VARCHAR(150),
                purchase_date TIMESTAMP WITH TIME ZONE,
                total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                payment_method VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Sin Desglose',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE
            )
        `);

        console.log('Purchases table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
}

run();
