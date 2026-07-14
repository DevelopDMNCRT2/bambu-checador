const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const migrationsDir = path.join(__dirname, 'migrations');

// Define order for some critical migrations, others can be alphabetical
const priorityMigrations = [
    'migration_users.js',
    'migration_recipes.js',
    'migration_variants.js',
    'migration_menu.js',
    'migration_menu_final.js',
    'migration_orders.js',
    'migration_cxc.js',
    'migration_expenses.js',
    'migration_purchases.js',
    'migration_breakdown.js'
];

fs.readdir(migrationsDir, async (err, files) => {
    if (err) {
        console.error('Error reading migrations directory:', err);
        process.exit(1);
    }

    const allFiles = files.filter(f => f.endsWith('.js'));
    const pendingFiles = allFiles.filter(f => !priorityMigrations.includes(f));

    const orderedFiles = [...priorityMigrations, ...pendingFiles]; // priority first, then others

    // Unique files
    const uniqueFiles = [...new Set(orderedFiles)];

    console.log(`Found ${uniqueFiles.length} migrations.`);

    for (const file of uniqueFiles) {
        if (!allFiles.includes(file)) {
            console.warn(`Warning: Priority file ${file} not found in directory.`);
            continue;
        }

        const filePath = path.join(migrationsDir, file);
        console.log(`Running ${file}...`);

        await new Promise((resolve, reject) => {
            exec(`node -r dotenv/config "${filePath}"`, (error, stdout, stderr) => {
                if (stdout) console.log(stdout.trim());
                if (stderr) console.error(stderr.trim());

                if (error) {
                    console.error(`Migration ${file} failed.`);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    console.log('All migrations finished.');
});
