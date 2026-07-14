const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { deductInventoryForOrder } = require("../utils/inventoryManager");

// GET /api/orders
// Returns orders relevant for the kitchen/cashier board (new, preparing, delivering).
// Optionally ?status=completed to see history, but default is active.
router.get("/", async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Validation for dates to prevent 500 errors
    if (startDate && !/^\d{4}-\d{2}-\d{2}/.test(startDate)) {
      console.error(`Invalid startDate received: ${startDate}`);
      return res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' });
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}/.test(endDate)) {
      console.error(`Invalid endDate received: ${endDate}`);
      return res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' });
    }

    let query = `
            SELECT o.*, 
            to_char(
               CASE 
                   WHEN ar.id IS NOT NULL AND ar.status = 'paid' THEN (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')
                   ELSE (o.created_at AT TIME ZONE 'America/Mexico_City')
               END, 
               'HH12:MI a.m.'
            ) as formatted_time,
            CASE
                WHEN ar.id IS NOT NULL AND ar.status = 'active' THEN 0
                ELSE o.total
            END as total,
            o.total as original_total,
            ar.status as cxc_status,
            (
                SELECT json_agg(
                    json_build_object(
                        'id', oi.id,
                        'menuItemId', oi.menu_item_id,
                        'name', oi.name,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'variations', oi.variations,
                        'note', oi.note
                    )
                )
                FROM order_items oi
                WHERE oi.order_id = o.id
            ) as items
            FROM orders o
            LEFT JOIN accounts_receivable ar ON o.id = ar.order_id
        `;

    const params = [];
    const conditions = [];

    if (req.query.id) {
      conditions.push(`o.id = $${params.length + 1}`);
      params.push(req.query.id);
    } else {
      if (status) {
        conditions.push(`o.status = $${params.length + 1}`);
        params.push(status);
      }

      if (startDate) {
        conditions.push(`
          (
            (ar.id IS NOT NULL AND ar.status = 'paid' AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $${params.length + 1}::timestamp)
            OR
            ((ar.id IS NULL OR ar.status = 'active') AND (o.created_at AT TIME ZONE 'America/Mexico_City') >= $${params.length + 1}::timestamp)
          )
        `);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`
          (
            (ar.id IS NOT NULL AND ar.status = 'paid' AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') <= $${params.length + 1}::timestamp)
            OR
            ((ar.id IS NULL OR ar.status = 'active') AND (o.created_at AT TIME ZONE 'America/Mexico_City') <= $${params.length + 1}::timestamp)
          )
        `);
        params.push(endDate);
      }

      // Only apply default active filter if NO status AND NO dates are provided (Kanban default)
      if (!status && !startDate && !endDate) {
        conditions.push(`o.status IN ('new', 'preparing', 'delivering')`);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    // Use FIFO (ASC) for Kanban (active orders), LIFO (DESC) for Sales History
    if (!status && !startDate && !endDate) {
      query += ` ORDER BY o.delivery_time ASC, o.created_at ASC`;
    } else {
      query += ` ORDER BY 
          CASE 
              WHEN ar.id IS NOT NULL AND ar.status = 'paid' THEN ar.updated_at 
              ELSE o.created_at 
          END DESC
      `;
    }

    const result = await db.query(query, params);

    // Format items: ensure 'items' property exists even if null
    const orders = result.rows.map((row) => ({
      ...row,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      paymentMethod: row.payment_method,
      generalNote: row.general_note,
      deliveryTime: row.delivery_time,
      items: row.items || [],
      time: row.formatted_time, // Use the SQL formatted time
      total: parseFloat(row.total),
      discount: parseFloat(row.discount || 0),
    }));

    res.json(orders);
  } catch (err) {
    const fs = require("fs");
    const path = require("path");
    fs.appendFileSync(
      path.join(__dirname, "../../server_error.log"),
      `${new Date().toISOString()} - Error fetching orders: ${err.message}\n${err.stack}\n`,
    );
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders
// Public endpoint to create a new order
router.post("/", async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const {
      customerName,
      customerPhone,
      location,
      paymentMethod,
      deliveryTime,
      items,
      generalNote,
      total,
      userId,
      status,
      userName,
    } = req.body;

    // Insert Order
    const orderResult = await client.query(
      `
            INSERT INTO orders (customer_name, customer_phone, location, payment_method, delivery_time, total, general_note, status, user_id, user_name, discount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, created_at
        `,
      [
        customerName,
        customerPhone,
        location,
        paymentMethod || "Efectivo",
        deliveryTime,
        total,
        generalNote,
        status || "new",
        userId,
        userName,
        req.body.discount || 0,
      ],
    );

    const orderId = orderResult.rows[0].id;

    // Insert Items (Bulk)
    if (items && items.length > 0) {
      const itemValues = [];
      const itemParams = [];
      let paramCounter = 1;

      items.forEach((item) => {
        // ($1, $2, $3, $4, $5, $6, $7)
        itemValues.push(
          `($${paramCounter}, $${paramCounter + 1}, $${paramCounter + 2}, $${paramCounter + 3}, $${paramCounter + 4}, $${paramCounter + 5}, $${paramCounter + 6})`,
        );

        itemParams.push(
          orderId,
          item.id,
          item.title || item.name,
          item.quantity || 1,
          item.price,
          JSON.stringify(item.variations || []),
          item.note,
        );
        paramCounter += 7;
      });

      const insertItemsQuery = `
                INSERT INTO order_items (order_id, menu_item_id, name, quantity, price, variations, note)
                VALUES ${itemValues.join(", ")}
            `;

      await client.query(insertItemsQuery, itemParams);
    }

    if (paymentMethod === "CXC") {
      const { cxcCustomerId, cxcCustomerName, cxcCustomerPhone } = req.body;
      let finalCustomerId = cxcCustomerId;

      // Create customer if needed
      if (!finalCustomerId && cxcCustomerName) {
        const newCustomerRes = await client.query(
          "INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id",
          [cxcCustomerName, cxcCustomerPhone],
        );
        finalCustomerId = newCustomerRes.rows[0].id;
      }

      if (finalCustomerId) {
        await client.query(
          `
                    INSERT INTO accounts_receivable (customer_id, order_id, amount, status, user_id)
                    VALUES ($1, $2, $3, 'active', $4)
                `,
          [finalCustomerId, orderId, total, userId],
        );
      }
    }

    await client.query("COMMIT");

    // Ideally, emit a socket event here for real-time updates
    // const io = req.app.get('io');
    // if(io) io.emit('new_order', { id: orderId, ... });

    // Inventory Deduction for Direct POS Sales
    // DESHABILITADO POR REQUERIMIENTO DEL USUARIO: "No debe reducir inventario de insumos ninguna venta"
    /*
        if (status === 'completed') {
            try {
                await deductInventoryForOrder(orderId);
            } catch (invError) {
                console.error('Inventory deduction failed (Direct POS Sale):', invError);
            }
        }
        */

    res.status(201).json({
      id: orderId,
      message: "Order created successfully",
      time:
        deliveryTime ||
        new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Mexico_City",
        }),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '../../server_error.log'), `${new Date().toISOString()} - Error creating order (POST): ${err.message}\n${err.stack}\n`);
    console.error("Error creating order:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id
// Update full order details (payment, total, status)
router.put("/:id", async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      status,
      paymentMethod,
      total,
      userName,
      userId,
      cxcCustomerId,
      cxcCustomerName,
      cxcCustomerPhone,
      discount,
    } = req.body;

    const result = await client.query(
      `
            UPDATE orders 
            SET status = COALESCE($1, status), 
                payment_method = COALESCE($2, payment_method),
                total = COALESCE($3, total),
                user_name = COALESCE($4, user_name),
                user_id = COALESCE($5, user_id),
                discount = COALESCE($7, discount),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `,
      [status, paymentMethod, total, userName, userId, id, discount],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = result.rows[0];

    // Handle CXC logic for existing order updates
    if (paymentMethod === "CXC") {
      let finalCustomerId = cxcCustomerId;

      // Create customer if needed
      if (!finalCustomerId && cxcCustomerName) {
        const newCustomerRes = await client.query(
          "INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id",
          [cxcCustomerName, cxcCustomerPhone],
        );
        finalCustomerId = newCustomerRes.rows[0].id;
      }

      if (finalCustomerId) {
        // Check if already exists to avoid duplicate debt for same order?
        // For simplicity, we assume if we are switching to CXC we create the debt.
        // In a robust system we'd check existence.
        const checkCxc = await client.query(
          "SELECT id FROM accounts_receivable WHERE order_id = $1",
          [id],
        );
        if (checkCxc.rows.length === 0) {
          await client.query(
            `
                        INSERT INTO accounts_receivable (customer_id, order_id, amount, status, user_id)
                        VALUES ($1, $2, $3, 'active', $4)
                    `,
            [finalCustomerId, id, updatedOrder.total, userId],
          );
        }
      }
    } else {
      // "Liquidar": If payment method is NOT CXC, mark any active AR as paid
      await client.query(
        `
                UPDATE accounts_receivable 
                SET status = 'paid', paid_amount = $1, payment_method = $3, updated_at = NOW()
                WHERE order_id = $2 AND status = 'active'
            `,
        [updatedOrder.total, id, paymentMethod],
      );
    }

    await client.query("COMMIT");

    // Inventory Deduction on Liquidation (POS Payment)
    // DESHABILITADO POR REQUERIMIENTO DEL USUARIO: "No debe reducir inventario de insumos ninguna venta"
    /*
        try {
            // Check if we already deducted for this order
            const checkUsage = await db.query('SELECT 1 FROM inventory_usage WHERE order_id = $1 LIMIT 1', [id]);
            if (checkUsage.rows.length === 0) {
                // Not deducted yet, so deduct now
                await deductInventoryForOrder(id);
            }
        } catch (inventoryErr) {
            console.error('Error in inventory deduction during liquidation:', inventoryErr);
        }
        */

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '../../server_error.log'), `${new Date().toISOString()} - Error updating order (PUT): ${err.message}\n${err.stack}\n`);
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status
// Update order status (new -> preparing -> delivering -> completed)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !["new", "preparing", "delivering", "completed", "cancelled"].includes(
        status,
      )
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await db.query(
      `
            UPDATE orders 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
