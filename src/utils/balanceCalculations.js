/**
 * Balance Calculation Utilities
 * Calculate running balance for transactions
 */

/**
 * Calculate running balance for a list of transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {number} initialBalance - Starting balance (default: 0)
 * @param {string} accountId - Optional account ID to filter by
 * @returns {Array} Transactions with balanceAfter field added
 */
export const calculateRunningBalance = (transactions, initialBalance = 0, accountId = null) => {
    // Filter by account if specified
    let filteredTransactions = accountId
        ? transactions.filter(t => t.account === accountId)
        : transactions;

    // Sort by date (oldest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    let balance = initialBalance;

    return sortedTransactions.map(transaction => {
        // Update balance based on transaction type
        if (transaction.type === 'income' || transaction.type === 'loan') {
            balance += transaction.amount;
        } else if (transaction.type === 'expense' || transaction.type === 'loan-payment') {
            balance -= transaction.amount;
        }

        return {
            ...transaction,
            balanceAfter: balance
        };
    });
};

/**
 * Get account balance at a specific date
 * @param {Array} transactions - Array of transaction objects
 * @param {number} initialBalance - Starting balance
 * @param {string} date - Date to calculate balance for (YYYY-MM-DD)
 * @returns {number} Balance at the specified date
 */
export const getBalanceAtDate = (transactions, initialBalance, date) => {
    const targetDate = new Date(date);

    const relevantTransactions = transactions.filter(t => {
        return new Date(t.date) <= targetDate;
    });

    return relevantTransactions.reduce((balance, transaction) => {
        if (transaction.type === 'income' || transaction.type === 'loan') {
            return balance + transaction.amount;
        } else if (transaction.type === 'expense' || transaction.type === 'loan-payment') {
            return balance - transaction.amount;
        }
        return balance;
    }, initialBalance);
};

/**
 * Calculate balance for multiple accounts
 * @param {Array} accounts - Array of account objects
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Map of accountId to current balance
 */
export const calculateAccountBalances = (accounts, transactions) => {
    const balances = {};

    accounts.forEach(account => {
        const accountTransactions = transactions.filter(t => t.account === account.id);
        const balance = accountTransactions.reduce((bal, transaction) => {
            if (transaction.type === 'income' || transaction.type === 'loan') {
                return bal + transaction.amount;
            } else if (transaction.type === 'expense' || transaction.type === 'loan-payment') {
                return bal - transaction.amount;
            }
            return bal;
        }, account.balance || 0);

        balances[account.id] = balance;
    });

    return balances;
};

export default {
    calculateRunningBalance,
    getBalanceAtDate,
    calculateAccountBalances
};
