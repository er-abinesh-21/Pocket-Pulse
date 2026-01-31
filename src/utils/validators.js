/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate amount (must be positive number)
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
    return value && value.toString().trim().length > 0;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Validate account form
 * @param {Object} formData - Account form data
 * @returns {Object} Validation result {isValid, errors}
 */
export const validateAccountForm = (formData) => {
    const errors = {};

    if (!isRequired(formData.name)) {
        errors.name = 'Account name is required';
    }

    if (!isValidAmount(formData.balance)) {
        errors.balance = 'Please enter a valid balance';
    }

    if (!formData.type) {
        errors.type = 'Please select an account type';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate transaction form
 * @param {Object} formData - Transaction form data
 * @returns {Object} Validation result {isValid, errors}
 */
export const validateTransactionForm = (formData) => {
    const errors = {};

    if (!isValidAmount(formData.amount)) {
        errors.amount = 'Please enter a valid amount';
    }

    if (!isRequired(formData.description)) {
        errors.description = 'Description is required';
    }

    if (!formData.account) {
        errors.account = 'Please select an account';
    }

    if (formData.type === 'expense' && !formData.category) {
        errors.category = 'Please select a category';
    }

    if (formData.type === 'income' && !formData.incomeSource) {
        errors.incomeSource = 'Please select an income source';
    }

    if (!isValidDate(formData.date)) {
        errors.date = 'Please enter a valid date';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate recurring transaction form
 * @param {Object} formData - Recurring transaction form data
 * @returns {Object} Validation result {isValid, errors}
 */
export const validateRecurringTransactionForm = (formData) => {
    const errors = {};

    // First validate as regular transaction
    const transactionValidation = validateTransactionForm(formData);
    Object.assign(errors, transactionValidation.errors);

    // Additional recurring-specific validation
    if (!formData.frequency) {
        errors.frequency = 'Please select a frequency';
    }

    if (!isValidDate(formData.startDate)) {
        errors.startDate = 'Please enter a valid start date';
    }

    if (formData.endDate && !isValidDate(formData.endDate)) {
        errors.endDate = 'Please enter a valid end date';
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
        errors.endDate = 'End date must be after start date';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
