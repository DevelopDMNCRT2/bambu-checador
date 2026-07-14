const db = require('../src/config/db');
const bcrypt = require('bcrypt');

async function run() {
    const password = 'pammartin';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if 'prueba' user already exists
    const check = await db.query("SELECT id FROM users WHERE username = 'prueba'");
    if (check.rows.length > 0) {
        // Update existing
        await db.query(
            "UPDATE users SET password = $1, role = 'Administrador' WHERE username = 'prueba'",
            [hashedPassword]
        );
        console.log("Admin user 'prueba' updated successfully!");
    } else {
        // Insert new
        await db.query(
            "INSERT INTO users (name, email, username, role, password, pin) VALUES ('Administrador', 'admin@bambu.com', 'prueba', 'Administrador', $1, '9999')",
            [hashedPassword]
        );
        console.log("Admin user 'prueba' created successfully!");
    }
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
