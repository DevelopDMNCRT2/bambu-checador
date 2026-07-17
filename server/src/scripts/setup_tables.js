const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function setup() {
    try {
        console.log("Checking and enabling pg_trgm extension...");
        await db.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
        console.log("pg_trgm extension checked.");

        console.log("Checking and creating purchase_product_aliases table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS purchase_product_aliases (
                id SERIAL PRIMARY KEY,
                supplier_description VARCHAR(255) NOT NULL,
                normalized_description VARCHAR(255) NOT NULL,
                canonical_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City'),
                UNIQUE(normalized_description)
            );
        `);
        console.log("✅ Table purchase_product_aliases verified/created successfully.");
    } catch (e) {
        console.error("❌ Error setting up database tables:", e);
    } finally {
        process.exit();
    }
}

setup();
