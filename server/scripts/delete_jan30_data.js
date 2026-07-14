require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function deleteJan30Data() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Define the date range for January 30, 2026
        const startDate = '2026-01-30 00:00:00';
        const endDate = '2026-01-31 00:00:00';
        
        console.log('🔍 Buscando datos del 30 de enero de 2026...\n');
        
        // 1. Check orders to be deleted
        const ordersCheck = await client.query(`
            SELECT id, created_at, total, payment_method, status
            FROM orders
            WHERE (created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
            AND (created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
            ORDER BY id
        `, [startDate, endDate]);
        
        console.log(`📦 Órdenes encontradas: ${ordersCheck.rows.length}`);
        if (ordersCheck.rows.length > 0) {
            console.log('Detalles de órdenes:');
            ordersCheck.rows.forEach(order => {
                console.log(`  - ID: ${order.id}, Total: $${order.total}, Método: ${order.payment_method}, Estado: ${order.status}`);
            });
        }
        
        // 2. Check CXC to be deleted
        const cxcCheck = await client.query(`
            SELECT ar.id, ar.order_id, ar.amount, ar.status, ar.created_at
            FROM accounts_receivable ar
            JOIN orders o ON ar.order_id = o.id
            WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
            AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
        `, [startDate, endDate]);
        
        console.log(`\n💳 CXC encontradas: ${cxcCheck.rows.length}`);
        if (cxcCheck.rows.length > 0) {
            console.log('Detalles de CXC:');
            cxcCheck.rows.forEach(cxc => {
                console.log(`  - ID: ${cxc.id}, Order ID: ${cxc.order_id}, Monto: $${cxc.amount}, Estado: ${cxc.status}`);
            });
        }
        
        // 3. Check order items to be deleted
        const itemsCheck = await client.query(`
            SELECT oi.id, oi.order_id, oi.name, oi.quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
            AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
        `, [startDate, endDate]);
        
        console.log(`\n🍽️  Items de órdenes encontrados: ${itemsCheck.rows.length}`);
        
        // Ask for confirmation
        console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará permanentemente:');
        console.log(`   - ${ordersCheck.rows.length} órdenes`);
        console.log(`   - ${cxcCheck.rows.length} cuentas por cobrar`);
        console.log(`   - ${itemsCheck.rows.length} items de órdenes`);
        console.log('\n¿Deseas continuar? (Este script requiere confirmación manual)\n');
        
        // For safety, we'll only proceed if explicitly confirmed
        const CONFIRM_DELETE = process.env.CONFIRM_DELETE === 'YES';
        
        if (!CONFIRM_DELETE) {
            console.log('❌ Eliminación cancelada. Para confirmar, ejecuta:');
            console.log('   CONFIRM_DELETE=YES node scripts/delete_jan30_data.js');
            await client.query('ROLLBACK');
            return;
        }
        
        console.log('🗑️  Procediendo con la eliminación...\n');
        
        // 4. Delete accounts_receivable first (foreign key constraint)
        const deleteCXC = await client.query(`
            DELETE FROM accounts_receivable
            WHERE order_id IN (
                SELECT id FROM orders
                WHERE (created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
                AND (created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
            )
        `, [startDate, endDate]);
        
        console.log(`✅ CXC eliminadas: ${deleteCXC.rowCount}`);
        
        // 5. Delete order_items
        const deleteItems = await client.query(`
            DELETE FROM order_items
            WHERE order_id IN (
                SELECT id FROM orders
                WHERE (created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
                AND (created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
            )
        `, [startDate, endDate]);
        
        console.log(`✅ Items eliminados: ${deleteItems.rowCount}`);
        
        // 6. Delete orders
        const deleteOrders = await client.query(`
            DELETE FROM orders
            WHERE (created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp
            AND (created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
        `, [startDate, endDate]);
        
        console.log(`✅ Órdenes eliminadas: ${deleteOrders.rowCount}`);
        
        await client.query('COMMIT');
        console.log('\n✨ Datos del 30 de enero eliminados exitosamente!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante la eliminación:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

deleteJan30Data()
    .then(() => {
        console.log('\n🎉 Proceso completado');
        process.exit(0);
    })
    .catch(err => {
        console.error('💥 Error fatal:', err);
        process.exit(1);
    });
