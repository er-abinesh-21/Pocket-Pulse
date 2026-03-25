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

// Fallback exchange rates (relative to USD) — used when API is unavailable
// These are approximate rates and should be updated periodically
const FALLBACK_RATES_USD = {
    USD: 1,
    INR: 83.50,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CAD: 1.36,
    AUD: 1.53
};

// Cache for live exchange rates
let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

/**
 * Fetch live exchange rates from ExchangeRate-API v6
 * Uses API key from environment variables
 * @param {string} baseCurrency - Base currency code
 * @returns {Promise<Object>} Exchange rates object
 */
export const fetchExchangeRates = async (baseCurrency = 'USD') => {
    // Check cache first
    if (cachedRates && cachedRates[baseCurrency] && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedRates[baseCurrency];
    }

    const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
    
    if (!apiKey) {
        console.warn('ExchangeRate API key not found in environment variables, using fallback rates');
        return getFallbackRates(baseCurrency);
    }

    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        
        if (data.result !== 'success') {
            throw new Error(data['error-type'] || 'Unknown API error');
        }

        // Cache all rates
        if (!cachedRates) cachedRates = {};
        cachedRates[baseCurrency] = data.conversion_rates;
        cacheTimestamp = Date.now();

        return data.conversion_rates;
    } catch (error) {
        console.warn('Failed to fetch live exchange rates, using fallback rates:', error.message);
        return getFallbackRates(baseCurrency);
    }
};

/**
 * Get fallback exchange rates relative to any base currency
 * @param {string} baseCurrency - Base currency code
 * @returns {Object} Exchange rates object
 */
const getFallbackRates = (baseCurrency = 'USD') => {
    const baseRate = FALLBACK_RATES_USD[baseCurrency] || 1;
    const rates = {};
    
    Object.keys(FALLBACK_RATES_USD).forEach(code => {
        rates[code] = FALLBACK_RATES_USD[code] / baseRate;
    });
    
    return rates;
};

/**
 * Convert an amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} rates - Exchange rates object (rates relative to fromCurrency)
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
    if (!amount || fromCurrency === toCurrency) return amount || 0;
    
    if (rates && rates[toCurrency]) {
        return amount * rates[toCurrency];
    }
    
    // Fallback conversion through USD
    const fallbackRates = getFallbackRates(fromCurrency);
    return amount * (fallbackRates[toCurrency] || 1);
};

/**
 * Get all exchange rates synchronously (fallback only)
 * @param {string} baseCurrency - Base currency code
 * @returns {Object} Exchange rates
 */
export const getExchangeRates = (baseCurrency = 'USD') => {
    // Return cached rates if available
    if (cachedRates && cachedRates[baseCurrency]) {
        return cachedRates[baseCurrency];
    }
    return getFallbackRates(baseCurrency);
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
