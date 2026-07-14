// Node 18+ has native fetch
const { Pool } = require('pg');

// DB Config
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function testRedundantSubstitution() {
    const API_URL = 'http://localhost:3001';
    let client;

    try {
        console.log('🧪 Testing Redundant Substitution (Leche Entera -> Leche Entera)...\n');

        client = await pool.connect();

        // 1. Setup: Update "Entera" variant to have explicit redundant substitution
        console.log('1. Setting up redundant substitution in DB...');

        // Find the "Entera" variant for Latte (Menu ID 37)
        // Ensure it exists first
        const checkRes = await client.query(`
            SELECT id FROM menu_item_variants 
            WHERE menu_item_id = 37 AND (name = 'Entera' OR name = 'Leche Entera')
        `);

        if (checkRes.rows.length === 0) {
            console.log('❌ "Entera" variant not found for Latte (ID 37). Cannot test.');
            return;
        }

        const variantId = checkRes.rows[0].id;

        // Update to explicit mapping
        await client.query(`
            UPDATE menu_item_variants 
            SET inventory_product_name = 'Leche Entera',
                replaced_ingredient_name = 'Leche Entera'
            WHERE id = $1
        `, [variantId]);

        console.log(`✅ Configured variant (ID ${variantId}) to replace "Leche Entera" with "Leche Entera"`);

        // 2. Create Order
        console.log('\n2. Creating order with "Entera" variation...');

        // Get User
        // Using User 12 (Rich) from previous tests

        const orderPayload = {
            customerName: "Test Redundant",
            customerPhone: "",
            location: "Barra",
            paymentMethod: "Efectivo",
            deliveryTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            items: [{
                id: 37,
                title: "Latte",
                price: "49.00",
                quantity: 1,
                variations: [
                    "Tamaño: 12 Oz",
                    "Leche: Entera" // Select the redundant variant
                ],
                note: ""
            }],
            generalNote: "Test Redundant Sub",
            total: 49,
            userId: 12,
            userName: "Rich",
            status: "completed"
        };

        // Using native fetch if available, or just mocking the call if I can't use fetch easily in this environment without module setup.
        // I'll try to use the fetch if global, or the required one.
        // Actually, since I'm running with `node`, I'll use the native fetch if Node 18+, which it is.

        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            console.log('❌ Order creation failed:', await response.text());
        } else {
            const order = await response.json();
            console.log(`✅ Order created: ID ${order.id}`);
            console.log('\n3. PLEASE CHECK SERVER LOGS NOW for deduction details.');
            console.log('   Expect to see: "✓ Substitution: Leche Entera → Leche Entera"');
            console.log('   And ensuring "Leche Entera" is deducted ONLY ONCE.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

testRedundantSubstitution();
