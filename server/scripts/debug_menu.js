const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../src/config/db.js');

const checkImageSizes = async () => {
    try {
        console.log('Checking image_url sizes...');
        const sql = `
            SELECT id, name, length(image_url) as url_length, left(image_url, 30) as start_of_url
            FROM menu_items
            WHERE image_url IS NOT NULL
            ORDER BY length(image_url) DESC
            LIMIT 5;
        `;
        const res = await query(sql);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkImageSizes();
