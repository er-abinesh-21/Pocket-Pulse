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
        remainingAmount: loanData.amount,
        type: loanData.type || 'borrowed'
    };

    const docRef = await addDoc(collection(db, `users/${userId}/loans`), loan);

    // Initial loan transaction
    const transactionType = loan.type === 'lent' ? 'expense' : 'income';
    const desc = loan.type === 'lent' 
        ? `Lent to ${loan.lender || loan.name}`
        : `Borrowed from ${loan.lender || loan.name}`;

    await addDoc(collection(db, `users/${userId}/transactions`), {
        type: transactionType,
        amount: loan.amount,
        description: desc,
        loanId: docRef.id,
        loanName: loan.name,
        date: new Date().toISOString().split('T')[0],
        account: loan.account || '',
        category: 'Loan Initial'
    });

    if (loan.account) {
        const accountRef = doc(db, `users/${userId}/accounts`, loan.account);
        const accountsSnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
        const accountDoc = accountsSnapshot.docs.find(d => d.id === loan.account);
        if (accountDoc) {
            const accData = accountDoc.data();
            const balanceChange = transactionType === 'income' ? loan.amount : -loan.amount;
            await updateDoc(accountRef, {
                balance: accData.balance + balanceChange
            });
        }
    }

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

    // First delete all associated transactions and revert account balances
    const transactionsQ = query(
        collection(db, `users/${userId}/transactions`),
        where('loanId', '==', loanId)
    );
    const transactionsSnapshot = await getDocs(transactionsQ);
    
    // Load accounts to update balances
    const accountsRef = collection(db, `users/${userId}/accounts`);
    const accountsSnapshot = await getDocs(accountsRef);
    const accounts = accountsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { ref: doc.ref, data: doc.data() };
        return acc;
    }, {});

    for (const txnDoc of transactionsSnapshot.docs) {
        const txn = txnDoc.data();
        
        // Revert account balance
        if (txn.account && accounts[txn.account]) {
            const isIncome = txn.type === 'income';
            const revertAmount = isIncome ? -txn.amount : txn.amount;
            const newBalance = accounts[txn.account].data.balance + revertAmount;
            
            await updateDoc(accounts[txn.account].ref, {
                balance: newBalance
            });
            accounts[txn.account].data.balance = newBalance; // update local reference for subsequent txns
        }

        // Delete the transaction
        await deleteDoc(txnDoc.ref);
    }

    // Finally, delete the loan itself
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
    const docRef = await addDoc(collection(db, `users/${userId}/transactions`), {
        type: loan.type === 'lent' ? 'income' : 'loan-payment',
        amount: amount,
        description: loan.type === 'lent' ? `Received payment from ${loan.lender || loan.name}` : `Payment for ${loan.name}`,
        loanId: loanId,
        loanName: loan.name,
        date: date,
        account: loan.account || '',
        category: 'Loan Payment'
    });

    // We must also update the account's balance in Firestore
    if (loan.account) {
        const accountRef = doc(db, `users/${userId}/accounts`, loan.account);
        const accountsSnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
        const accountDoc = accountsSnapshot.docs.find(doc => doc.id === loan.account);
        if (accountDoc) {
            const accData = accountDoc.data();
            const balanceChange = loan.type === 'lent' ? amount : -amount;
            await updateDoc(accountRef, {
                balance: accData.balance + balanceChange
            });
        }
    }
};

export default {
    createLoan,
    getLoans,
    getActiveLoans,
    updateLoan,
    deleteLoan,
    recordLoanPayment
};
