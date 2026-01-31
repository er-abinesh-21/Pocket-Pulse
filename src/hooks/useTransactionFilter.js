import { useMemo } from 'react';

/**
 * Custom hook for filtering and searching transactions
 * @param {Array} transactions - Array of all transactions
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered transactions
 */
export const useTransactionFilter = (transactions, searchTerm, filters) => {
    return useMemo(() => {
        let filtered = [...transactions];

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.description?.toLowerCase().includes(term) ||
                t.category?.toLowerCase().includes(term) ||
                t.incomeSource?.toLowerCase().includes(term) ||
                t.amount?.toString().includes(term)
            );
        }

        // Apply type filter
        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }

        // Apply account filter
        if (filters.account) {
            filtered = filtered.filter(t => t.account === filters.account);
        }

        // Apply date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(t => t.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
            filtered = filtered.filter(t => t.date <= filters.dateTo);
        }

        // Apply amount range filter
        if (filters.amountMin) {
            const min = parseFloat(filters.amountMin);
            filtered = filtered.filter(t => t.amount >= min);
        }
        if (filters.amountMax) {
            const max = parseFloat(filters.amountMax);
            filtered = filtered.filter(t => t.amount <= max);
        }

        return filtered;
    }, [transactions, searchTerm, filters]);
};

export default useTransactionFilter;
