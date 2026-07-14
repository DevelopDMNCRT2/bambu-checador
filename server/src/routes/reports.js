const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/daily-sales
router.get('/daily-sales', async (req, res) => {
    try {
        const { date, userId } = req.query;

        // 1. Date Range Setup (Index Friendly)
        // casting ::date prevents index usage. We use >= start AND < end
        const inputDate = date || new Date().toISOString().split('T')[0];
        const startOfDay = inputDate; // Postgres checks: '2023-01-01' -> '2023-01-01 00:00:00'

        // Calculate next day for upper bound
        const endOfDayDate = new Date(inputDate);
        endOfDayDate.setDate(endOfDayDate.getDate() + 1);
        const endOfDay = endOfDayDate.toISOString().split('T')[0];

        const targetUserId = userId || null;
        const params = [startOfDay, endOfDay];
        if (targetUserId) params.push(targetUserId);

        const userFilterOrder = targetUserId ? 'AND o.user_id = $3' : '';
        const userFilterAR = targetUserId ? 'AND ar.user_id = $3' : ''; // user who created debt
        const userFilterColl = targetUserId ? 'AND o.user_id = $3' : ''; // user who collected (via order update)

        const bigQuery = `
            WITH direct_sales AS (
                SELECT o.payment_method, SUM(o.total) as total
                FROM orders o
                LEFT JOIN accounts_receivable ar ON o.id = ar.order_id
                WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND o.status = 'completed' -- Only count completed orders
                AND o.payment_method NOT IN ('CXC', 'Cortesía')
                AND ar.id IS NULL
                ${userFilterOrder}
                GROUP BY o.payment_method
            ),
            collections AS (
                SELECT ar.payment_method, SUM(ar.paid_amount) as total
                FROM accounts_receivable ar
                JOIN orders o ON ar.order_id = o.id
                WHERE ar.status = 'paid'
                AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                ${userFilterColl}
                GROUP BY ar.payment_method
            ),
            cxc_generated AS (
                SELECT SUM(amount) as total
                FROM accounts_receivable ar
                WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND status = 'active'
                ${userFilterAR}
            ),
            courtesies AS (
                SELECT SUM(o.total) as total
                FROM orders o
                LEFT JOIN accounts_receivable ar ON o.id = ar.order_id
                WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND o.status = 'completed' -- Only count completed courtesies
                AND o.payment_method = 'Cortesía'
                AND ar.id IS NULL
                ${userFilterOrder}
            )
            SELECT 
                (SELECT json_agg(row_to_json(direct_sales)) FROM direct_sales) as direct_sales_data,
                (SELECT json_agg(row_to_json(collections)) FROM collections) as collections_data,
                (SELECT total FROM cxc_generated) as cxc_total,
                (SELECT total FROM courtesies) as courtesy_total
        `;

        const result = await db.query(bigQuery, params);
        const row = result.rows[0];

        // Aggregation
        const incomeByMethod = {
            'Efectivo': 0,
            'Tarjeta': 0,
            'Transferencia': 0,
            'Uber Eats': 0
        };


        const directData = row.direct_sales_data || [];
        const collectionData = row.collections_data || [];

        let courtesyTotal = Number(row.courtesy_total || 0);

        directData.forEach(item => {
            const method = item.payment_method;
            const val = Number(item.total) || 0;
            incomeByMethod[method] = (incomeByMethod[method] || 0) + val;
        });

        collectionData.forEach(item => {
            const method = item.payment_method;
            const val = Number(item.total) || 0;

            if (method === 'CXC') return; // Should not happen in paid status but safety check

            if (method === 'Cortesía') {
                courtesyTotal += val;
            } else {
                incomeByMethod[method] = (incomeByMethod[method] || 0) + val;
            }
        });

        const totalIncome = Object.values(incomeByMethod).reduce((a, b) => a + b, 0);

        res.json({
            date: inputDate,
            incomeByMethod,
            totalIncome,
            cxcGenerated: parseFloat(row.cxc_total || 0),
            courtesyTotal: parseFloat(courtesyTotal)
        });


    } catch (err) {
        console.error('Error in daily sales report:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Defaults to current month if not provided
        let tempStart, tempEnd;
        if (!startDate || !endDate) {
            const now = new Date();
            tempStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            // End of current month
            tempEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else {
            tempStart = startDate;
            tempEnd = endDate;
        }

        // Adjust end date to cover the full day (next day 00:00:00)
        const dEnd = new Date(tempEnd);
        dEnd.setDate(dEnd.getDate() + 1);
        const qEnd = dEnd.toISOString().split('T')[0]; // YYYY-MM-DD
        const qStart = tempStart;

        // Determine Previous Period
        const durationMs = new Date(qEnd).getTime() - new Date(qStart).getTime();
        const prevEndMsg = new Date(qStart).getTime();
        const prevStartMsg = prevEndMsg - durationMs;

        const prevStart = new Date(prevStartMsg).toISOString().split('T')[0];
        const prevEnd = new Date(prevEndMsg).toISOString().split('T')[0];

        // Helper to get stats for a range
        const getStatsForRange = async (s, e) => {
            const params = [s, e];
            // 1. Income (Orders + Collections)
            // Reuse logic: Direct Sales (completed, not cxc, not cortesia) + Collections (paid)
            const incomeQuery = `
                 WITH direct_sales AS (
                    SELECT SUM(o.total) as total
                    FROM orders o
                    LEFT JOIN accounts_receivable ar ON o.id = ar.order_id
                    WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                    AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                    AND o.status = 'completed'
                    AND o.payment_method NOT IN ('CXC', 'Cortesía')
                    AND ar.id IS NULL
                 ),
                 collections AS (
                    SELECT SUM(ar.paid_amount) as total
                    FROM accounts_receivable ar
                    WHERE ar.status = 'paid'
                    AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                    AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                    AND ar.payment_method NOT IN ('Cortesía')
                 )
                 SELECT 
                    COALESCE((SELECT total FROM direct_sales), 0) + 
                    COALESCE((SELECT total FROM collections), 0) as total_income
             `;

            // 2. Expenses
            const expenseQuery = `
                SELECT COALESCE(SUM(amount), 0) as total
                FROM expenses
                WHERE date >= $1::date AND date < $2::date
                AND deleted_at IS NULL
             `;

            // 3. Purchases
            const purchaseQuery = `
                SELECT COALESCE(SUM(total), 0) as total
                FROM purchases
                WHERE purchase_date >= $1::date AND purchase_date < $2::date
                AND deleted_at IS NULL
             `;

            // 4. Courtesies
            const courtesyQuery = `
                SELECT COALESCE(SUM(total), 0) as total
                FROM orders
                WHERE (created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND status = 'completed'
                AND payment_method = 'Cortesía'
             `;

            const [incRes, expRes, purRes, courtesyRes] = await Promise.all([
                db.query(incomeQuery, params),
                db.query(expenseQuery, params),
                db.query(purchaseQuery, params),
                db.query(courtesyQuery, params)
            ]);

            return {
                income: Number(incRes.rows[0].total_income || 0),
                expenses: Number(expRes.rows[0].total || 0),
                purchases: Number(purRes.rows[0].total || 0),
                courtesies: Number(courtesyRes.rows[0].total || 0)
            };
        };

        const currentStats = await getStatsForRange(qStart, qEnd);
        const prevStats = await getStatsForRange(prevStart, prevEnd);

        const netProfit = currentStats.income - currentStats.expenses - currentStats.purchases;
        const prevNetProfit = prevStats.income - prevStats.expenses - prevStats.purchases;

        // Daily Trend (for Sparkline) - Grouping net profit by day
        const trendQueryRevised = `
            WITH dates AS (
                SELECT generate_series($1::date, $2::date - interval '1 day', '1 day')::date as day
            ),
            inc AS (
                -- Direct Sales
                SELECT 
                    (o.created_at AT TIME ZONE 'America/Mexico_City')::date as day,
                    SUM(o.total) as val
                FROM orders o
                LEFT JOIN accounts_receivable ar ON o.id = ar.order_id
                WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND o.status = 'completed'
                AND o.payment_method NOT IN ('CXC', 'Cortesía')
                AND ar.id IS NULL
                GROUP BY 1
                UNION ALL
                -- Collections
                SELECT 
                    (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date as day,
                    SUM(ar.paid_amount) as val
                FROM accounts_receivable ar
                WHERE ar.status = 'paid'
                AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
                AND (ar.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') < $2::timestamp
                AND ar.payment_method NOT IN ('Cortesía')
                GROUP BY 1
            ),
            exp AS (
                SELECT date as day, SUM(amount) as val
                FROM expenses
                WHERE date >= $1::date AND date < $2::date AND deleted_at IS NULL
                GROUP BY 1
            ),
            pur AS (
                SELECT purchase_date as day, SUM(total) as val
                FROM purchases
                WHERE purchase_date >= $1::date AND purchase_date < $2::date AND deleted_at IS NULL
                GROUP BY 1
            )
            SELECT 
                dates.day,
                (COALESCE((SELECT SUM(val) FROM inc WHERE inc.day = dates.day), 0) - 
                 COALESCE((SELECT SUM(val) FROM exp WHERE exp.day = dates.day), 0) - 
                 COALESCE((SELECT SUM(val) FROM pur WHERE pur.day = dates.day), 0)) as value
            FROM dates
            ORDER BY dates.day
        `;

        const trendRes = await db.query(trendQueryRevised, [qStart, qEnd]);
        const trend = trendRes.rows.map(r => ({ date: r.day, value: parseFloat(r.value) }));

        // Get current active CXC total (not tied to period, just current state)
        const cxcQuery = `
            SELECT COALESCE(SUM(amount - paid_amount), 0) as total
            FROM accounts_receivable
            WHERE status = 'active'
            AND (amount - paid_amount) > 0
        `;
        const cxcRes = await db.query(cxcQuery);
        const totalCXC = Number(cxcRes.rows[0].total || 0);

        // Calculate Profit Margins
        const currentMargin = currentStats.income > 0
            ? (netProfit / currentStats.income) * 100
            : 0;

        // Historical Average Margin (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const historicalStart = sixMonthsAgo.toISOString().split('T')[0];
        const historicalEnd = new Date().toISOString().split('T')[0];

        const historicalStats = await getStatsForRange(historicalStart, historicalEnd);
        const historicalMargin = historicalStats.income > 0
            ? ((historicalStats.income - historicalStats.expenses - historicalStats.purchases) / historicalStats.income) * 100
            : 0;

        // Top 5 Best Selling Items by Volume (current period)
        const topItemsQuery = `
            SELECT 
                oi.name as item_name,
                SUM(oi.quantity) as total_quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
            AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
            AND o.status = 'completed'
            GROUP BY oi.name
            ORDER BY total_quantity DESC
            LIMIT 5
        `;
        const topItemsRes = await db.query(topItemsQuery, [qStart, qEnd]);
        const topSellingItems = topItemsRes.rows.map(r => ({
            name: r.item_name,
            quantity: Number(r.total_quantity)
        }));

        // Top 5 Most Profitable Items (current period)
        const topProfitableQuery = `
            SELECT 
                oi.name as item_name,
                SUM(oi.quantity * oi.price) as total_revenue,
                SUM(oi.quantity * COALESCE(r.total_cost, 0)) as total_cost,
                SUM(oi.quantity * oi.price) - SUM(oi.quantity * COALESCE(r.total_cost, 0)) as profit
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            LEFT JOIN recipes r ON m.recipe_id = r.id
            WHERE (o.created_at AT TIME ZONE 'America/Mexico_City') >= $1::timestamp 
            AND (o.created_at AT TIME ZONE 'America/Mexico_City') < $2::timestamp
            AND o.status = 'completed'
            GROUP BY oi.name
            ORDER BY profit DESC
            LIMIT 5
        `;
        const topProfitableRes = await db.query(topProfitableQuery, [qStart, qEnd]);
        const topProfitableItems = topProfitableRes.rows.map(r => ({
            name: r.item_name,
            profit: Number(r.profit),
            revenue: Number(r.total_revenue),
            cost: Number(r.total_cost)
        }));

        const totalExpenses = currentStats.expenses + currentStats.purchases;
        const prevTotalExpenses = prevStats.expenses + prevStats.purchases;

        const balance = currentStats.income - totalExpenses;
        const prevBalance = prevStats.income - prevTotalExpenses;

        res.json({
            netProfit,
            prevNetProfit,
            income: currentStats.income,
            prevIncome: prevStats.income,
            expenses: totalExpenses,
            prevExpenses: prevTotalExpenses,
            balance,
            prevBalance,
            courtesies: currentStats.courtesies, // Add this line
            trend,
            totalCXC,
            profitMargin: {
                current: currentMargin,
                historical: historicalMargin
            },
            topSellingItems,
            topProfitableItems
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
