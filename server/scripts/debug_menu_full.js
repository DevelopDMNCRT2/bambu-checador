const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../src/config/db.js');

const testMenuFetch = async () => {
    try {
        console.log('Testing Admin Menu Fetch Query...');

        // Check Column Types
        const schemaQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('recipe_items', 'purchase_items') 
            AND column_name IN ('quantity', 'unit_price', 'product_name');
        `;
        const schemaRes = await query(schemaQuery);
        console.table(schemaRes.rows);


        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testMenuFetch();
