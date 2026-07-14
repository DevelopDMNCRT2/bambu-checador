const { query } = require('../../src/config/db.js');

async function run() {
    try {
        // Add status to purchases if not exists
        // Note: Adding column with default fills existing rows.
        await query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Sin Desglose';`);

        // Update existing rows to have 'Sin Desglose' if they are null (in case column existed but was null, unlikely given my previous steps, but good safety)
        await query(`UPDATE purchases SET status = 'Sin Desglose' WHERE status IS NULL;`);

        // Create purchase_items table
        await query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id SERIAL PRIMARY KEY,
                purchase_id INTEGER REFERENCES purchases(id),
                product_name VARCHAR(255) NOT NULL,
                quantity NUMERIC(10, 2) NOT NULL,
                unit VARCHAR(20) NOT NULL,
                unit_price NUMERIC(10, 2) NOT NULL,
                discount NUMERIC(10, 2) DEFAULT 0,
                total NUMERIC(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP
            );
        `);
        console.log('Migration successful');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
