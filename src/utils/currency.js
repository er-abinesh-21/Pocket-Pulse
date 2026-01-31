// Currency configuration
export const CURRENCIES = {
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' }
};

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (USD, INR, etc.)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
    const currencyConfig = CURRENCIES[currencyCode] || CURRENCIES.USD;
    return new Intl.NumberFormat(currencyConfig.locale, {
        style: 'currency',
        currency: currencyCode
    }).format(amount || 0);
};

/**
 * Format currency for PDF export (ASCII-safe)
 * This function avoids Unicode characters that jsPDF cannot render properly
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (USD, INR, etc.)
 * @returns {string} Formatted currency string (ASCII-safe)
 */
export const formatCurrencyForPDF = (amount, currencyCode = 'USD') => {
    const currencyConfig = CURRENCIES[currencyCode] || CURRENCIES.USD;
    const formattedAmount = (amount || 0).toFixed(2);

    // Add thousands separators manually
    const parts = formattedAmount.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1];

    // Use simple ASCII currency symbols for PDF
    const pdfSymbol = currencyConfig.symbol.replace(/[^\x00-\x7F]/g, '');

    // For INR, use 'Rs.' instead of ₹ symbol
    const symbol = currencyCode === 'INR' ? 'Rs.' : pdfSymbol;

    return `${symbol}${integerPart}.${decimalPart}`;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
    if (typeof currencyString === 'number') return currencyString;
    const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
};
