const { query } = require('../../src/config/db.js');

const runMigration = async () => {
    try {
        console.log('Creating Users table...');

        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                pin VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                updated_at TIMESTAMP WITH TIME ZONE,
                deleted_at TIMESTAMP WITH TIME ZONE
            )
        `);

        console.log('Users table created successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
};

runMigration();
