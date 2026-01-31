import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';

/**
 * Get a collection reference for a user
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @returns {Object} Collection reference
 */
const getUserCollection = (userId, collectionName) => {
    return collection(db, `users/${userId}/${collectionName}`);
};

/**
 * Get a document reference for a user
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Object} Document reference
 */
const getUserDoc = (userId, collectionName, docId) => {
    return doc(db, `users/${userId}/${collectionName}`, docId);
};

// ==================== ACCOUNTS ====================

/**
 * Get all accounts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of accounts
 */
export const getAccounts = async (userId) => {
    const snapshot = await getDocs(getUserCollection(userId, 'accounts'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Create a new account
 * @param {string} userId - User ID
 * @param {Object} accountData - Account data
 * @returns {Promise<Object>} Created account with ID
 */
export const createAccount = async (userId, accountData) => {
    const docRef = await addDoc(getUserCollection(userId, 'accounts'), {
        ...accountData,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...accountData };
};

/**
 * Update an account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateAccount = async (userId, accountId, updates) => {
    await updateDoc(getUserDoc(userId, 'accounts', accountId), updates);
};

/**
 * Delete an account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @returns {Promise<void>}
 */
export const deleteAccount = async (userId, accountId) => {
    await deleteDoc(getUserDoc(userId, 'accounts', accountId));
};

// ==================== TRANSACTIONS ====================

/**
 * Get all transactions for a user with real-time updates
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTransactions = (userId, callback) => {
    const q = query(
        getUserCollection(userId, 'transactions'),
        orderBy('date', 'desc')
    );

    return onSnapshot(q,
        (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(transactions);
        },
        (error) => {
            console.error('Firestore real-time listener error:', error);
            throw error;
        }
    );
};

/**
 * Create a new transaction
 * @param {string} userId - User ID
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} Created transaction with ID
 */
export const createTransaction = async (userId, transactionData) => {
    const docRef = await addDoc(getUserCollection(userId, 'transactions'), {
        ...transactionData,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...transactionData };
};

/**
 * Update a transaction
 * @param {string} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateTransaction = async (userId, transactionId, updates) => {
    await updateDoc(getUserDoc(userId, 'transactions', transactionId), updates);
};

/**
 * Delete a transaction
 * @param {string} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (userId, transactionId) => {
    await deleteDoc(getUserDoc(userId, 'transactions', transactionId));
};

// ==================== BUDGETS ====================

/**
 * Get all budgets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Budget limits by category
 */
export const getBudgets = async (userId) => {
    const snapshot = await getDocs(getUserCollection(userId, 'budgets'));
    const budgets = {};
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        budgets[data.category] = data.limit;
    });
    return budgets;
};

/**
 * Set budget for a category
 * @param {string} userId - User ID
 * @param {string} category - Category name
 * @param {number} limit - Budget limit
 * @returns {Promise<void>}
 */
export const setBudget = async (userId, category, limit) => {
    const budgetRef = getUserDoc(userId, 'budgets', category);
    await setDoc(budgetRef, {
        category,
        limit,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

/**
 * Delete a budget
 * @param {string} userId - User ID
 * @param {string} category - Category name
 * @returns {Promise<void>}
 */
export const deleteBudget = async (userId, category) => {
    await deleteDoc(getUserDoc(userId, 'budgets', category));
};

// ==================== RECURRING TRANSACTIONS ====================

/**
 * Get all recurring transactions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of recurring transactions
 */
export const getRecurringTransactions = async (userId) => {
    const snapshot = await getDocs(getUserCollection(userId, 'recurring'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Create a new recurring transaction
 * @param {string} userId - User ID
 * @param {Object} recurringData - Recurring transaction data
 * @returns {Promise<Object>} Created recurring transaction with ID
 */
export const createRecurringTransaction = async (userId, recurringData) => {
    const docRef = await addDoc(getUserCollection(userId, 'recurring'), {
        ...recurringData,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...recurringData };
};

/**
 * Update a recurring transaction
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring transaction ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updateRecurringTransaction = async (userId, recurringId, updates) => {
    await updateDoc(getUserDoc(userId, 'recurring', recurringId), updates);
};

/**
 * Delete a recurring transaction
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring transaction ID
 * @returns {Promise<void>}
 */
export const deleteRecurringTransaction = async (userId, recurringId) => {
    await deleteDoc(getUserDoc(userId, 'recurring', recurringId));
};
