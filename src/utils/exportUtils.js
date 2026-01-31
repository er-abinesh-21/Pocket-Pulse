import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { formatCurrency, formatCurrencyForPDF } from './currency';
import { formatDate } from './dateHelpers';

/**
 * Export Utilities
 * Functions to export transactions as PDF or CSV
 */

/**
 * Generate PDF statement
 * @param {Array} transactions - Transactions to export
 * @param {Object} summary - Summary statistics
 * @param {string} dateRange - Date range string
 * @param {string} currency - Currency code
 */
export const generatePDF = (transactions, summary, dateRange, currency = 'USD') => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple
    doc.text('Pocket Pulse', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Transaction Statement', 14, 30);

    // Period and Summary
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${dateRange}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 45);

    // Summary Box
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 50, 182, 25, 'F');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 18, 58);

    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Total Income: ${formatCurrencyForPDF(summary.income, currency)}`, 18, 65);

    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Total Expenses: ${formatCurrencyForPDF(summary.expenses, currency)}`, 18, 70);

    doc.setTextColor(0, 0, 0);
    const netAmount = summary.income - summary.expenses;
    doc.text(`Net: ${formatCurrencyForPDF(netAmount, currency)}`, 18, 75);

    // Transactions Table (already sorted newest first with correct balances)
    const tableData = transactions.map(t => [
        formatDate(t.date),
        t.description,
        t.category || t.incomeSource || '-',
        t.type === 'income' ? `+${formatCurrencyForPDF(t.amount, currency)}` : `-${formatCurrencyForPDF(t.amount, currency)}`,
        t.balanceAfter ? formatCurrencyForPDF(t.balanceAfter, currency) : '-'
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['Date', 'Description', 'Category', 'Amount', 'Balance']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [139, 92, 246], // Purple
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            valign: 'middle'
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        columnStyles: {
            0: { cellWidth: 25, halign: 'left' },
            1: { cellWidth: 55, halign: 'left' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 35, halign: 'right', cellPadding: { right: 3 } },
            4: { cellWidth: 35, halign: 'right', cellPadding: { right: 3 } }
        },
        didParseCell: function (data) {
            // Ensure Amount and Balance headers are also right-aligned
            if (data.section === 'head' && (data.column.index === 3 || data.column.index === 4)) {
                data.cell.styles.halign = 'right';
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const filename = `pocket-pulse-statement-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

/**
 * Generate CSV export
 * @param {Array} transactions - Transactions to export
 * @param {string} currency - Currency code
 */
export const generateCSV = (transactions, currency = 'USD') => {
    // Prepare data
    const csvData = transactions.map(t => ({
        Date: t.date,
        Description: t.description,
        Type: t.type,
        Category: t.category || t.incomeSource || '',
        Amount: t.amount,
        Account: t.accountName || t.account,
        'Balance After': t.balanceAfter || '',
        Notes: t.notes || ''
    }));

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pocket-pulse-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Calculate summary statistics for transactions
 * @param {Array} transactions - Transactions to summarize
 * @returns {Object} Summary with income, expenses, and count
 */
export const calculateSummary = (transactions) => {
    return transactions.reduce((summary, t) => {
        if (t.type === 'income' || t.type === 'loan') {
            summary.income += t.amount;
        } else if (t.type === 'expense' || t.type === 'loan-payment') {
            summary.expenses += t.amount;
        }
        summary.count++;
        return summary;
    }, { income: 0, expenses: 0, count: 0 });
};

export default {
    generatePDF,
    generateCSV,
    calculateSummary
};
