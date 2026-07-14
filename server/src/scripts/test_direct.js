const { Client } = require('pg');

async function test() {
    const urls = [
        "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    ];

    for (const url of urls) {
        console.log("Testing:", url.split('@')[1]);
        const client = new Client({
            connectionString: url,
            ssl: { rejectUnauthorized: false }
        });
        try {
            await client.connect();
            const res = await client.query("SELECT current_database(), current_user");
            console.log("Success! DB:", res.rows[0]);
            await client.end();
        } catch (e) {
            console.error("Failed:", e.message);
        }
    }
}
test();
