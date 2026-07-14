const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function fix() {
    try {
        console.log("Attempting to add 'Gerencia' to 'user_role' enum...");
        // Valid for Postgres 12+
        await db.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Gerencia'");
        console.log("Success.");
    } catch (e) {
        console.error("Initial Error:", e.message);
        
        // Fallback for older Postgres or if syntax error
        if (e.message.includes("syntax error") || e.message.includes("IF NOT EXISTS")) {
             try {
                console.log("Retrying without IF NOT EXISTS...");
                await db.query("ALTER TYPE user_role ADD VALUE 'Gerencia'");
                console.log("Success.");
            } catch (e2) {
                if (e2.message.includes("already exists")) {
                     console.log("Value 'Gerencia' already exists.");
                } else {
                    console.error("Retry Error:", e2);
                }
            }
        }
    } finally {
        process.exit();
    }
}
fix();
