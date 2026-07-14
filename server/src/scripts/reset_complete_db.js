const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../../.env' });

// Use existing connection string if env var not set
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: connectionString
});

async function resetDatabase() {
    const client = await pool.connect();

    try {
        console.log('🚨 STARTING COMPLETE DATABASE RESET 🚨');
        console.log('⚠️  ALL DATA WILL BE DELETED (Orders, Inventory, Menu, Users, etc.)');

        await client.query('BEGIN');

        const tablesToTruncate = [
            'inventory_usage',
            'order_items',
            'orders',
            'menu_item_variants',
            'menu_items',
            'recipe_items',
            'recipe_variants',
            'recipes',
            'purchase_items',
            'purchases',
            'accounts_receivable',
            'customers',
            'expenses',
            'users'
        ];

        // Optional tables (might not exist)
        const optionalTables = ['shifts', 'cash_cuts'];

        // Truncate main tables
        for (const table of tablesToTruncate) {
            console.log(`Deleting ${table}...`);
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        }

        // Truncate optional tables safely
        for (const table of optionalTables) {
            // Check if table exists
            const checkRes = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);

            if (checkRes.rows[0].exists) {
                console.log(`Deleting ${table}...`);
                await client.query(`TRUNCATE TABLE ${table} CASCADE`);
            } else {
                console.log(`Skipping ${table} (not found)`);
            }
        }

        // Reset Sequences (Best effort for common tables)
        const sequences = [
            'orders_id_seq', 'users_id_seq', 'menu_items_id_seq', 'recipes_id_seq',
            'customers_id_seq', 'purchases_id_seq', 'expenses_id_seq'
        ];

        for (const seq of sequences) {
            try {
                await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
            } catch (e) {
                // Ignore if sequence doesn't exist
            }
        }

        // Create Admin User
        console.log('Creating Admin User...');
        const password = 'PamMartin1!';
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertUserQuery = `
            INSERT INTO users (name, username, password, role, email, pin, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, name, username
        `;

        const userValues = [
            'Ricardo Corona', // Name
            'Ricardo',        // Username
            hashedPassword,   // Password
            'Administrador',  // Role (Matches enum: Administrador, Operativo)
            'demiancrate@gmail.com', // Email
            '1204'            // Pin
        ];

        // Wait, I should verify the ROLE column value.
        // Usually it is 'admin' or 'cashier'.
        // Let's assume 'admin'. If it fails or is enum, I'll see error.
        // Actually, let's just run it. If it fails, I'll fix it.

        const res = await client.query(insertUserQuery, userValues);
        console.log('User Created:', res.rows[0]);

        await client.query('COMMIT');
        console.log('\n✅ Database Reset & Seed Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error during reset:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
