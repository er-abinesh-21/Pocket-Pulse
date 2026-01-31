import { useState, useEffect, useCallback } from 'react';
import {
    getRecurringTransactions,
    processDueRecurringTransactions,
    pauseRecurringTransaction,
    resumeRecurringTransaction,
    deleteRecurringTransaction
} from '../services/recurring.service';

/**
 * Custom hook for managing recurring transactions
 * @param {string} userId - User ID
 * @param {Function} onTransactionCreated - Callback when auto-transaction is created
 * @returns {Object} Recurring transactions state and actions
 */
export const useRecurringTransactions = (userId, onTransactionCreated) => {
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load recurring transactions
    const loadRecurringTransactions = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getRecurringTransactions(userId);
            setRecurringTransactions(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading recurring transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Process due transactions
    const processDueTransactions = useCallback(async () => {
        if (!userId) return 0;

        try {
            const count = await processDueRecurringTransactions(userId, onTransactionCreated);
            if (count > 0) {
                await loadRecurringTransactions();
            }
            return count;
        } catch (err) {
            console.error('Error processing due transactions:', err);
            return 0;
        }
    }, [userId, onTransactionCreated, loadRecurringTransactions]);

    // Pause recurring transaction
    const pause = useCallback(async (recurringId) => {
        try {
            await pauseRecurringTransaction(userId, recurringId);
            await loadRecurringTransactions();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId, loadRecurringTransactions]);

    // Resume recurring transaction
    const resume = useCallback(async (recurringId) => {
        try {
            await resumeRecurringTransaction(userId, recurringId);
            await loadRecurringTransactions();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId, loadRecurringTransactions]);

    // Delete recurring transaction
    const remove = useCallback(async (recurringId) => {
        try {
            await deleteRecurringTransaction(userId, recurringId);
            await loadRecurringTransactions();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId, loadRecurringTransactions]);

    // Load on mount and when userId changes
    useEffect(() => {
        loadRecurringTransactions();
    }, [loadRecurringTransactions]);

    // Auto-process on mount and every hour
    useEffect(() => {
        if (!userId) return;

        // Process immediately
        processDueTransactions();

        // Then every hour
        const interval = setInterval(() => {
            processDueTransactions();
        }, 60 * 60 * 1000); // 1 hour

        return () => clearInterval(interval);
    }, [userId, processDueTransactions]);

    return {
        recurringTransactions,
        loading,
        error,
        refresh: loadRecurringTransactions,
        processDueTransactions,
        pause,
        resume,
        remove
    };
};

export default useRecurringTransactions;
