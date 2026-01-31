import { useState, useEffect, useCallback } from 'react';
import { getLoans, getActiveLoans, createLoan, updateLoan, deleteLoan, recordLoanPayment } from '../services/loan.service';

/**
 * Custom hook for managing loans
 */
export const useLoans = (userId) => {
    const [loans, setLoans] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load all loans
    const loadLoans = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            const [allLoans, active] = await Promise.all([
                getLoans(userId),
                getActiveLoans(userId)
            ]);
            setLoans(allLoans);
            setActiveLoans(active);
        } catch (err) {
            setError(err.message);
            console.error('Error loading loans:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Add new loan
    const addLoan = useCallback(async (loanData) => {
        if (!userId) return;

        setLoading(true);
        try {
            await createLoan(userId, loanData);
            await loadLoans();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadLoans]);

    // Update existing loan
    const updateExistingLoan = useCallback(async (loanId, updates) => {
        if (!userId) return;

        setLoading(true);
        try {
            await updateLoan(userId, loanId, updates);
            await loadLoans();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadLoans]);

    // Delete loan
    const removeLoan = useCallback(async (loanId) => {
        if (!userId) return;

        setLoading(true);
        try {
            await deleteLoan(userId, loanId);
            await loadLoans();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadLoans]);

    // Record payment
    const makePayment = useCallback(async (loanId, amount, date) => {
        if (!userId) return;

        setLoading(true);
        try {
            await recordLoanPayment(userId, loanId, amount, date);
            await loadLoans();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadLoans]);

    // Calculate total debt
    const totalDebt = activeLoans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);

    // Load on mount
    useEffect(() => {
        loadLoans();
    }, [loadLoans]);

    return {
        loans,
        activeLoans,
        totalDebt,
        loading,
        error,
        addLoan,
        updateLoan: updateExistingLoan,
        removeLoan,
        makePayment,
        refresh: loadLoans
    };
};

export default useLoans;
