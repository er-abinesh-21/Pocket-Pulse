import jsPDF from 'jspdf';
import { formatCurrencyForPDF } from './currency';
import { formatDate } from './dateHelpers';

/**
 * Thermal Receipt PDF Generator
 * Produces a narrow (~80mm) monospace, black & white receipt for a single transaction,
 * mimicking a point-of-sale thermal printer slip.
 */

const RECEIPT_WIDTH_MM = 80; // standard thermal paper width
const SIDE_MARGIN = 4;
const CONTENT_WIDTH = RECEIPT_WIDTH_MM - SIDE_MARGIN * 2;

/**
 * Build the line array displayed in the receipt. Used for both the in-modal
 * preview animation and the actual PDF, so they stay in sync.
 *
 * @param {Object} transaction
 * @param {{ accountName?: string, currency?: string, balanceAfter?: number }} options
 * @returns {Array<{ kind: 'header'|'divider'|'title'|'kv'|'amount'|'stamp'|'footer'|'spacer', text?: string, label?: string, value?: string, align?: 'left'|'center'|'right', emphasis?: boolean }>}
 */
export const buildReceiptLines = (transaction, { accountName, currency = 'USD', balanceAfter } = {}) => {
    if (!transaction) return [];

    const lines = [];
    const isIncome = transaction.type === 'income' || transaction.type === 'loan';
    const sign = isIncome ? '+' : '-';
    const amountStr = `${sign}${formatCurrencyForPDF(Math.abs(Number(transaction.amount) || 0), currency)}`;
    const generatedAt = new Date();
    const txDate = transaction.date ? formatDate(transaction.date) : '-';
    const category = transaction.category || transaction.incomeSource || '-';

    lines.push({ kind: 'header', text: 'POCKET PULSE', align: 'center' });
    lines.push({ kind: 'header', text: 'Personal Finance Receipt', align: 'center' });
    lines.push({ kind: 'spacer' });
    lines.push({ kind: 'divider' });

    lines.push({ kind: 'title', text: transaction.description || '(No description)', align: 'center' });

    lines.push({ kind: 'spacer' });
    lines.push({ kind: 'kv', label: 'Date', value: txDate });
    lines.push({ kind: 'kv', label: 'Type', value: isIncome ? 'INCOME' : 'EXPENSE' });
    lines.push({ kind: 'kv', label: 'Category', value: category });
    if (accountName) lines.push({ kind: 'kv', label: 'Account', value: accountName });

    lines.push({ kind: 'divider' });
    lines.push({ kind: 'amount', label: 'AMOUNT', value: amountStr });
    if (typeof balanceAfter === 'number') {
        lines.push({ kind: 'kv', label: 'Bal. After', value: formatCurrencyForPDF(balanceAfter, currency) });
    }
    lines.push({ kind: 'divider' });

    lines.push({ kind: 'spacer' });
    lines.push({ kind: 'stamp', text: '* GENERATED *', align: 'center' });
    lines.push({ kind: 'spacer' });

    lines.push({
        kind: 'footer',
        text: `Generated: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        align: 'center'
    });
    lines.push({ kind: 'footer', text: 'Thank you for tracking with us!', align: 'center' });

    return lines;
};

/**
 * Render the receipt lines to a jsPDF doc and return it.
 *
 * @param {Object} transaction
 * @param {{ accountName?: string, currency?: string, balanceAfter?: number }} options
 * @returns {{ doc: jsPDF, filename: string }}
 */
export const buildThermalReceiptDoc = (transaction, options = {}) => {
    const lines = buildReceiptLines(transaction, options);

    // We don't know exact final height ahead of time; jsPDF requires it up front.
    // Estimate generously; trailing whitespace doesn't matter for downstream use.
    const lineHeight = 5; // mm per typical line
    const estimatedHeight = 30 + lines.length * lineHeight;

    const doc = new jsPDF({
        unit: 'mm',
        format: [RECEIPT_WIDTH_MM, estimatedHeight],
        orientation: 'portrait'
    });

    doc.setFont('courier', 'normal');
    doc.setTextColor(0, 0, 0);

    let y = 8;

    const writeText = (text, { align = 'left', size = 9, bold = false } = {}) => {
        doc.setFontSize(size);
        doc.setFont('courier', bold ? 'bold' : 'normal');

        // wrap long text
        const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH);
        wrapped.forEach((segment) => {
            let x = SIDE_MARGIN;
            if (align === 'center') {
                x = RECEIPT_WIDTH_MM / 2;
            } else if (align === 'right') {
                x = RECEIPT_WIDTH_MM - SIDE_MARGIN;
            }
            doc.text(segment, x, y, { align });
            y += lineHeight;
        });
    };

    const drawDivider = () => {
        // dotted line of dashes for that thermal vibe
        const dashCount = Math.floor(CONTENT_WIDTH / 1.6);
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.text('-'.repeat(dashCount), SIDE_MARGIN, y);
        y += lineHeight;
    };

    lines.forEach((line) => {
        switch (line.kind) {
            case 'header':
                writeText(line.text, { align: line.align || 'center', size: 11, bold: true });
                break;
            case 'title':
                writeText(line.text, { align: line.align || 'center', size: 10, bold: true });
                break;
            case 'divider':
                drawDivider();
                break;
            case 'kv': {
                // "Label.........VALUE" pattern, padded with dots for that receipt look
                doc.setFontSize(9);
                doc.setFont('courier', 'normal');
                const label = line.label || '';
                const value = String(line.value ?? '');
                const labelWidth = doc.getTextWidth(label);
                const valueWidth = doc.getTextWidth(value);
                const dotsWidth = CONTENT_WIDTH - labelWidth - valueWidth;
                const charWidth = doc.getTextWidth('.');
                const dotsCount = Math.max(2, Math.floor(dotsWidth / charWidth));
                const dots = ' ' + '.'.repeat(dotsCount - 2) + ' ';
                doc.text(label + dots + value, SIDE_MARGIN, y);
                y += lineHeight;
                break;
            }
            case 'amount': {
                doc.setFontSize(13);
                doc.setFont('courier', 'bold');
                doc.text(line.label || 'AMOUNT', SIDE_MARGIN, y);
                doc.text(String(line.value ?? ''), RECEIPT_WIDTH_MM - SIDE_MARGIN, y, { align: 'right' });
                y += lineHeight + 1;
                break;
            }
            case 'stamp':
                writeText(line.text, { align: line.align || 'center', size: 12, bold: true });
                break;
            case 'footer':
                writeText(line.text, { align: line.align || 'center', size: 8, bold: false });
                break;
            case 'spacer':
                y += lineHeight * 0.6;
                break;
            default:
                if (line.text) writeText(line.text, { align: line.align || 'left', size: 9 });
        }
    });

    const safeDesc = (transaction.description || 'transaction')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'transaction';
    const datePart = (transaction.date || new Date().toISOString().split('T')[0]).replace(/[^0-9-]/g, '');
    const filename = `pocket-pulse-receipt-${safeDesc}-${datePart}.pdf`;

    return { doc, filename };
};

/**
 * Trigger a browser download of the thermal receipt PDF.
 */
export const downloadThermalReceipt = (transaction, options = {}) => {
    const { doc, filename } = buildThermalReceiptDoc(transaction, options);
    doc.save(filename);
    return filename;
};

/**
 * Return a Blob + filename for the receipt, ready to share via Web Share API
 * or fall back to copy / link.
 */
export const getThermalReceiptBlob = (transaction, options = {}) => {
    const { doc, filename } = buildThermalReceiptDoc(transaction, options);
    const blob = doc.output('blob');
    return { blob, filename };
};

export default {
    buildReceiptLines,
    buildThermalReceiptDoc,
    downloadThermalReceipt,
    getThermalReceiptBlob
};
