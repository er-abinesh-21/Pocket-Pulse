import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    getDocs,
    doc,
    setDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom hook for managing budgets
 */
export const useBudgets = (userId) => {
    const [budgets, setBudgets] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load budgets
    const loadBudgets = useCallback(async () => {
        if (!userId || !db) return;

        setLoading(true);
        setError(null);
        try {
            const snapshot = await getDocs(collection(db, `users/${userId}/budgets`));
            const budgetsData = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                budgetsData[data.category] = data.limit;
            });
            setBudgets(budgetsData);
        } catch (err) {
            setError(err.message);
            console.error('Error loading budgets:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Update budgets
    const updateBudgets = useCallback(async (budgetsData) => {
        if (!userId || !db) return;

        setLoading(true);
        try {
            // Update each budget
            for (const [category, limit] of Object.entries(budgetsData)) {
                if (limit && parseFloat(limit) > 0) {
                    await setDoc(doc(db, `users/${userId}/budgets`, category), {
                        category,
                        limit: parseFloat(limit)
                    });
                }
            }
            await loadBudgets();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadBudgets]);

    // Load on mount
    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    return {
        budgets,
        loading,
        error,
        updateBudgets,
        refresh: loadBudgets
    };
};

export default useBudgets;
