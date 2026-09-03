const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');

// Node-compatible import of jsPDF & autoTable
const jspdfModule = require(path.join(__dirname, '../../admin/node_modules/jspdf'));
const { jsPDF } = jspdfModule;
const autoTableRaw = require(path.join(__dirname, '../../admin/node_modules/jspdf-autotable'));
const autoTable = autoTableRaw.default || autoTableRaw;

async function generatePurchasesPDF(targetYearMonth) {
    // Default to July 2026 if not specified
    const yearMonth = targetYearMonth || '2026-07';
    const [year, month] = yearMonth.split('-');
    
    const startDate = `${yearMonth}-01`;
    const lastDayNum = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${yearMonth}-${String(lastDayNum).padStart(2, '0')}`;

    console.log(`📊 Generando Reporte PDF de Compras de Bambú para el período: ${startDate} al ${endDate}`);

    // Query 1: Overall Metrics
    const metricsRes = await db.query(`
        SELECT 
            COUNT(*)::int as "totalPurchases",
            COALESCE(SUM(total), 0)::float as "totalSpent",
            COALESCE(AVG(total), 0)::float as "averageTicket"
        FROM purchases
        WHERE deleted_at IS NULL
          AND purchase_date >= $1::date AND purchase_date <= $2::date
    `, [startDate, endDate]);

    const metrics = metricsRes.rows[0] || { totalPurchases: 0, totalSpent: 0, averageTicket: 0 };

    // Query 2: By Payment Method
    const pmRes = await db.query(`
        SELECT 
            COALESCE(payment_method, 'No especificado') as "paymentMethod",
            COUNT(*)::int as "count",
            COALESCE(SUM(total), 0)::float as "total"
        FROM purchases
        WHERE deleted_at IS NULL
          AND purchase_date >= $1::date AND purchase_date <= $2::date
        GROUP BY COALESCE(payment_method, 'No especificado')
        ORDER BY "total" DESC
    `, [startDate, endDate]);

    // Query 3: By Provider
    const provRes = await db.query(`
        SELECT 
            COALESCE(provider, 'Sin proveedor') as "provider",
            COUNT(*)::int as "count",
            COALESCE(SUM(total), 0)::float as "total"
        FROM purchases
        WHERE deleted_at IS NULL
          AND purchase_date >= $1::date AND purchase_date <= $2::date
        GROUP BY COALESCE(provider, 'Sin proveedor')
        ORDER BY "total" DESC
    `, [startDate, endDate]);

    // Query 4: By Cost Type / Category
    const costTypeRes = await db.query(`
        SELECT 
            COALESCE(pi.cost_type, 'Directo') as "costType",
            COUNT(*)::int as "count",
            COALESCE(SUM(pi.total), 0)::float as "total"
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.purchase_date >= $1::date AND p.purchase_date <= $2::date
        GROUP BY COALESCE(pi.cost_type, 'Directo')
        ORDER BY "total" DESC
    `, [startDate, endDate]);

    // Query 5: Top Accumulated Concepts
    const accumulatedRes = await db.query(`
        SELECT 
            pi.product_name,
            MAX(pi.unit) as unit,
            SUM(pi.quantity)::float as total_quantity,
            SUM(pi.total)::float as total_spent,
            (SUM(pi.total) / NULLIF(SUM(pi.quantity), 0))::float as avg_price
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE p.deleted_at IS NULL
          AND p.purchase_date >= $1::date AND p.purchase_date <= $2::date
        GROUP BY pi.product_name
        ORDER BY total_spent DESC
        LIMIT 15
    `, [startDate, endDate]);

    // Query 6: All Detailed Purchases
    const purchasesRes = await db.query(`
        SELECT 
            id, 
            ticket_number as "ticketNumber", 
            provider, 
            TO_CHAR(purchase_date, 'YYYY-MM-DD') as date, 
            total::float, 
            payment_method as "paymentMethod",
            status,
            COALESCE(has_iva, true) as "hasIva"
        FROM purchases 
        WHERE deleted_at IS NULL 
          AND purchase_date >= $1::date AND purchase_date <= $2::date
        ORDER BY purchase_date DESC, created_at DESC
    `, [startDate, endDate]);

    const totalSpent = metrics.totalSpent || 1; // Avoid divide by 0

    // Initialize jsPDF document
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const brandColor = [5, 150, 105]; // Emerald 600 #059669
    const secondaryColor = [31, 41, 55]; // Gray 800

    // Page Header (Branding)
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BAMBÚ ASISTENTE', 14, 11);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE MENSUAL DE COMPRAS Y GASTOS', 14, 18);

    // Meta box (Top Right)
    doc.setFontSize(8);
    doc.text(`Período: ${yearMonth}`, 196, 9, { align: 'right' });
    doc.text(`Emisión: ${new Date().toLocaleDateString('es-MX')}`, 196, 14, { align: 'right' });
    doc.text(`Moneda: MXN ($)`, 196, 19, { align: 'right' });

    let currentY = 32;

    // Executive Summary KPI Cards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('1. Resumen Ejecutivo Financiero', 14, currentY);

    currentY += 5;
    const cardWidth = 58;
    const cardHeight = 18;

    // Card 1: Total Invertido
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('TOTAL INVERTIDO', 18, currentY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${metrics.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 18, currentY + 14);

    // Card 2: Total de Compras
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(76, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('TOTAL DE COMPRAS', 80, currentY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metrics.totalPurchases} tickets`, 80, currentY + 14);

    // Card 3: Ticket Promedio
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(221, 214, 254);
    doc.roundedRect(138, currentY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(91, 33, 182);
    doc.text('TICKET PROMEDIO', 142, currentY + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${metrics.averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 142, currentY + 14);

    currentY += cardHeight + 10;

    // Section 2: Segmentación por Forma de Pago
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('2. Totalización por Forma de Pago y Categoría', 14, currentY);

    currentY += 4;

    // Table 1: Forma de Pago
    const pmRows = pmRes.rows.map(r => [
        r.paymentMethod,
        r.count.toString(),
        `$${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `${((r.total / totalSpent) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Forma de Pago', 'Compras', 'Total Invertido', '% Total']],
        body: pmRows,
        headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 45, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // Section 3: Totalización por Proveedor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('3. Totalización por Proveedor', 14, currentY);

    currentY += 4;

    const provRows = provRes.rows.map(r => [
        r.provider,
        r.count.toString(),
        `$${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `${((r.total / totalSpent) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Proveedor', 'Compras', 'Total Invertido', '% Total']],
        body: provRows,
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 50, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // Check page space for section 4 & 5
    if (currentY > 220) {
        doc.addPage();
        currentY = 20;
    }

    // Section 4: Top Insumos Acumulados
    if (accumulatedRes.rows.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('4. Principales Insumos Comprados en el Mes', 14, currentY);

        currentY += 4;

        const accumulatedRows = accumulatedRes.rows.map(r => [
            r.product_name,
            `${Number(r.total_quantity).toFixed(2)} ${r.unit}`,
            `$${Number(r.avg_price).toFixed(2)}`,
            `$${Number(r.total_spent).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Producto / Insumo', 'Cantidad Total', 'Precio Promedio', 'Total Invertido']],
            body: accumulatedRows,
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 75 },
                1: { cellWidth: 35, halign: 'center' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        currentY = doc.lastAutoTable.finalY + 8;
    }

    if (currentY > 220) {
        doc.addPage();
        currentY = 20;
    }

    // Section 5: Desglose Completo de Compras
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('5. Desglose Detallado de Tickets y Facturas del Mes', 14, currentY);

    currentY += 4;

    const purchaseRows = purchasesRes.rows.map(p => [
        `#${p.ticketNumber}`,
        p.provider,
        p.date,
        p.paymentMethod,
        p.hasIva ? 'Con IVA' : 'Sin IVA',
        p.status,
        `$${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Ticket', 'Proveedor', 'Fecha', 'Forma Pago', 'IVA', 'Estado', 'Importe']],
        body: purchaseRows,
        headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 45 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25 },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 22, halign: 'center' },
            6: { cellWidth: 20, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Página ${i} de ${totalPages}`, 196, 290, { align: 'right' });
        doc.text('Bambú Asistente | Sistema de Control Operativo y Financiero - Documento Confidencial', 14, 290);
    }

    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `reporte_compras_Bambu_${yearMonth}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ Reporte PDF generado exitosamente en: ${outputPath}`);
    console.log(`📄 Tamaño del archivo: ${(pdfBuffer.length / 1024).toFixed(2)} KB | Total Páginas: ${totalPages}`);

    return outputPath;
}

if (require.main === module) {
    const targetMonth = process.argv[2] || '2026-07';
    generatePurchasesPDF(targetMonth)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Error generando PDF:', err);
            process.exit(1);
        });
}

module.exports = { generatePurchasesPDF };
