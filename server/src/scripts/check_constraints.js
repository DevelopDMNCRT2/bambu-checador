const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

const fs = require('fs');

async function check() {
    try {
        const constraints = await db.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass;
        `);
        
        const roleColumn = await db.query(`
            SELECT column_name, data_type, udt_name, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role';
        `);

        const output = {
            constraints: constraints.rows,
            roleColumn: roleColumn.rows
        };

        fs.writeFileSync('debug_output.txt', JSON.stringify(output, null, 2));
        console.log("Written to debug_output.txt");

    } catch (e) {
        console.error("Error:", e);
        fs.writeFileSync('debug_output.txt', "Error: " + e.message);
    } finally {
        // Force exit to close pool
        process.exit();
    }
}
check();
