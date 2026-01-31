/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get the current month in YYYY-MM format
 * @returns {string} Current month
 */
export const getCurrentMonth = () => {
    return new Date().toISOString().substring(0, 7);
};

/**
 * Get the start of the current week (Monday)
 * @returns {Date} Start of week
 */
export const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
};

/**
 * Get date N days ago
 * @param {number} days - Number of days ago
 * @returns {Date} Date N days ago
 */
export const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date
 */
export const formatDate = (date, locale = 'en-US') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale);
};

/**
 * Check if date is in current month
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if in current month
 */
export const isCurrentMonth = (dateString) => {
    return dateString && dateString.startsWith(getCurrentMonth());
};

/**
 * Check if date is today
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if today
 */
export const isToday = (dateString) => {
    return dateString === getCurrentDate();
};

/**
 * Check if date is in current week
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if in current week
 */
export const isCurrentWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const startOfWeek = getStartOfWeek();
    const now = new Date();
    return date >= startOfWeek && date <= now;
};

/**
 * Get number of days in a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days
 */
export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

/**
 * Calculate next occurrence date based on frequency
 * @param {Date} startDate - Start date
 * @param {string} frequency - Frequency (daily, weekly, monthly, etc.)
 * @param {Date} fromDate - Calculate from this date (default: today)
 * @returns {Date} Next occurrence date
 */
export const calculateNextOccurrence = (startDate, frequency, fromDate = new Date()) => {
    const start = new Date(startDate);
    const from = new Date(fromDate);
    const next = new Date(start);

    // If start date is in the future, return it
    if (start > from) return start;

    switch (frequency) {
        case 'daily':
            next.setDate(from.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(from.getDate() + 7);
            break;
        case 'biweekly':
            next.setDate(from.getDate() + 14);
            break;
        case 'monthly':
            next.setMonth(from.getMonth() + 1);
            next.setDate(start.getDate());
            break;
        case 'quarterly':
            next.setMonth(from.getMonth() + 3);
            next.setDate(start.getDate());
            break;
        case 'yearly':
            next.setFullYear(from.getFullYear() + 1);
            next.setMonth(start.getMonth());
            next.setDate(start.getDate());
            break;
        default:
            return from;
    }

    return next;
};
