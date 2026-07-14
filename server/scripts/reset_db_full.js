const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../src/config/db.js');
const bcrypt = require('bcrypt');

async function run() {
    try {
        console.log('--- RESETTING DATABASE ---');

        // List of tables to truncate (order doesn't matter much with CASCADE)
        const tables = [
            'accounts_receivable',
            'order_items',
            'orders',
            'menu_items',
            'recipe_items',
            'recipe_variants',
            'recipes',
            'purchase_items',
            'purchases',
            'expenses',
            'products',
            'customers',
            'users'
        ];

        console.log('Truncating tables...');

        // Construct single TRUNCATE statement or loop. 
        // Single statement is faster but fails if one table is missing.
        // We'll loop to be safe against missing tables in dev/prod drift.
        for (const table of tables) {
            try {
                await query(`TRUNCATE TABLE ${table} CASCADE`);
                console.log(`Truncated ${table}`);
            } catch (err) {
                // Ignore "relation does not exist" error (code 42P01 in Postgres)
                if (err.code === '42P01') {
                    console.log(`Table ${table} does not exist, skipping.`);
                } else {
                    console.error(`Error truncating ${table}:`, err.message);
                }
            }
        }

        console.log('All tables truncated.');

        // Insert Admin User
        console.log('Creating Admin User...');

        const saltRounds = 10;
        const plainPassword = 'PamMartin1!';
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        const adminUser = {
            name: 'Ricardo Corona',
            username: 'Ricardo', // Case sensitive usually, keeping as requested
            role: 'Administrador',
            email: 'demiancrate@gmail.com',
            pin: '1204',
            password: hashedPassword
        };

        await query(
            `INSERT INTO users (name, username, role, email, pin, password) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                adminUser.name,
                adminUser.username,
                adminUser.role,
                adminUser.email,
                adminUser.pin,
                adminUser.password
            ]
        );

        console.log('Admin user created successfully.');
        console.log('--- RESET COMPLETE ---');
        process.exit(0);

    } catch (e) {
        console.error('Fatal Error during reset:', e);
        process.exit(1);
    }
}

run();
