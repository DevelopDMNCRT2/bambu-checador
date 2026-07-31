require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const bcrypt = require('bcrypt');

async function run() {
    const password = 'Sully2026!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = 'wallmitzy@gmail.com';
    const name = 'Mitzy Muro';
    const username = 'mitzymuro';

    // Check if user with this email or role 'Administrador' exists (including soft-deleted)
    const checkByEmail = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkByEmail.rows.length > 0) {
        const userId = checkByEmail.rows[0].id;
        await db.query(
            "UPDATE users SET name = $1, username = $2, password = $3, role = 'Administrador', deleted_at = NULL WHERE id = $4",
            [name, username, hashedPassword, userId]
        );
        console.log(`Admin user '${name}' (${email}) updated and restored successfully!`);
    } else {
        const checkByRole = await db.query("SELECT id FROM users WHERE role = 'Administrador'");
        if (checkByRole.rows.length > 0) {
            const userId = checkByRole.rows[0].id;
            await db.query(
                "UPDATE users SET name = $1, email = $2, username = $3, password = $4, role = 'Administrador', deleted_at = NULL WHERE id = $5",
                [name, email, username, hashedPassword, userId]
            );
            console.log(`Admin user '${name}' (${email}) updated and restored successfully!`);
        } else {
            await db.query(
                "INSERT INTO users (name, email, username, role, password, pin, deleted_at) VALUES ($1, $2, $3, 'Administrador', $4, '9999', NULL)",
                [name, email, username, hashedPassword]
            );
            console.log(`Admin user '${name}' (${email}) created successfully!`);
        }
    }
    process.exit(0);
}

run().catch(err => {
    console.error('Error seeding admin user:', err);
    process.exit(1);
});
