import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom hook for managing transactions with real-time updates
 */
export const useTransactions = (userId) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load transactions with real-time updates
    useEffect(() => {
        if (!userId || !db) return;

        setLoading(true);
        const transactionsQuery = query(
            collection(db, `users/${userId}/transactions`),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(
            transactionsQuery,
            (snapshot) => {
                const transactionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTransactions(transactionsData);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                console.error('Error loading transactions:', err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [userId]);

    // Add transaction
    const addTransaction = useCallback(async (transactionData) => {
        if (!userId || !db) return;

        try {
            await addDoc(collection(db, `users/${userId}/transactions`), transactionData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update transaction
    const updateTransaction = useCallback(async (transactionId, transactionData) => {
        if (!userId || !db) return;

        try {
            await updateDoc(doc(db, `users/${userId}/transactions`, transactionId), transactionData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Delete transaction
    const deleteTransaction = useCallback(async (transactionId) => {
        if (!userId || !db) return;

        try {
            await deleteDoc(doc(db, `users/${userId}/transactions`, transactionId));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction
    };
};

export default useTransactions;
