import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Loan Service
 * Handles CRUD operations for loans and loan payments
 */

/**
 * Create a new loan
 * @param {string} userId - User ID
 * @param {Object} loanData - Loan data
 * @returns {Promise<string>} Loan ID
 */
export const createLoan = async (userId, loanData) => {
    if (!db) throw new Error('Firestore not initialized');

    const loan = {
        ...loanData,
        createdAt: new Date().toISOString(),
        status: 'active',
        remainingAmount: loanData.amount
    };

    const docRef = await addDoc(collection(db, `users/${userId}/loans`), loan);
    return docRef.id;
};

/**
 * Get all loans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of loans
 */
export const getLoans = async (userId) => {
    if (!db) throw new Error('Firestore not initialized');

    const snapshot = await getDocs(collection(db, `users/${userId}/loans`));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Get active loans (not fully paid)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active loans
 */
export const getActiveLoans = async (userId) => {
    if (!db) throw new Error('Firestore not initialized');

    const q = query(
        collection(db, `users/${userId}/loans`),
        where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Update a loan
 * @param {string} userId - User ID
 * @param {string} loanId - Loan ID
 * @param {Object} updates - Updates to apply
 */
export const updateLoan = async (userId, loanId, updates) => {
    if (!db) throw new Error('Firestore not initialized');

    await updateDoc(doc(db, `users/${userId}/loans`, loanId), updates);
};

/**
 * Delete a loan
 * @param {string} userId - User ID
 * @param {string} loanId - Loan ID
 */
export const deleteLoan = async (userId, loanId) => {
    if (!db) throw new Error('Firestore not initialized');

    await deleteDoc(doc(db, `users/${userId}/loans`, loanId));
};

/**
 * Record a loan payment
 * @param {string} userId - User ID
 * @param {string} loanId - Loan ID
 * @param {number} amount - Payment amount
 * @param {string} date - Payment date
 * @returns {Promise<void>}
 */
export const recordLoanPayment = async (userId, loanId, amount, date) => {
    if (!db) throw new Error('Firestore not initialized');

    // Get the loan
    const loansSnapshot = await getDocs(collection(db, `users/${userId}/loans`));
    const loanDoc = loansSnapshot.docs.find(doc => doc.id === loanId);

    if (!loanDoc) {
        throw new Error('Loan not found');
    }

    const loan = loanDoc.data();
    const newRemainingAmount = loan.remainingAmount - amount;

    // Update loan remaining amount
    await updateDoc(doc(db, `users/${userId}/loans`, loanId), {
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount <= 0 ? 'paid' : 'active',
        lastPaymentDate: date,
        lastPaymentAmount: amount
    });

    // Create a transaction for the payment
    await addDoc(collection(db, `users/${userId}/transactions`), {
        type: 'loan-payment',
        amount: amount,
        description: `Payment for ${loan.name}`,
        loanId: loanId,
        loanName: loan.name,
        date: date,
        account: loan.account || '',
        category: 'Loan Payment'
    });
};

export default {
    createLoan,
    getLoans,
    getActiveLoans,
    updateLoan,
    deleteLoan,
    recordLoanPayment
};
