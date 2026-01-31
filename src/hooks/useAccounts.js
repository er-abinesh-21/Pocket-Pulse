import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Custom hook for managing accounts
 */
export const useAccounts = (userId) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load accounts
    const loadAccounts = useCallback(async () => {
        if (!userId || !db) return;

        setLoading(true);
        setError(null);
        try {
            const snapshot = await getDocs(collection(db, `users/${userId}/accounts`));
            const accountsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAccounts(accountsData);
        } catch (err) {
            setError(err.message);
            console.error('Error loading accounts:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Add account
    const addAccount = useCallback(async (accountData) => {
        if (!userId || !db) return;

        setLoading(true);
        try {
            await addDoc(collection(db, `users/${userId}/accounts`), accountData);
            await loadAccounts();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadAccounts]);

    // Update account
    const updateAccount = useCallback(async (accountId, accountData) => {
        if (!userId || !db) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, `users/${userId}/accounts`, accountId), accountData);
            await loadAccounts();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadAccounts]);

    // Delete account
    const deleteAccount = useCallback(async (accountId) => {
        if (!userId || !db) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, `users/${userId}/accounts`, accountId));
            await loadAccounts();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId, loadAccounts]);

    // Load on mount
    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    return {
        accounts,
        loading,
        error,
        addAccount,
        updateAccount,
        deleteAccount,
        refresh: loadAccounts
    };
};

export default useAccounts;
