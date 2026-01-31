import {
    getRecurringTransactions,
    createRecurringTransaction as createRecurring,
    updateRecurringTransaction as updateRecurring,
    deleteRecurringTransaction as deleteRecurring
} from './firestore.service';
import { createTransaction } from './firestore.service';
import { calculateNextOccurrence } from '../utils/dateHelpers';

/**
 * Check and process due recurring transactions
 * @param {string} userId - User ID
 * @param {Function} onTransactionCreated - Callback when transaction is created
 * @returns {Promise<number>} Number of transactions created
 */
export const processDueRecurringTransactions = async (userId, onTransactionCreated) => {
    try {
        const recurringTransactions = await getRecurringTransactions(userId);
        const today = new Date().toISOString().split('T')[0];
        let createdCount = 0;

        for (const recurring of recurringTransactions) {
            // Skip if not active or auto-create is disabled
            if (!recurring.isActive || !recurring.autoCreate) continue;

            // Skip if end date has passed
            if (recurring.endDate && recurring.endDate < today) {
                // Optionally deactivate
                await updateRecurring(userId, recurring.id, { isActive: false });
                continue;
            }

            // Check if next occurrence is today or in the past
            if (recurring.nextOccurrence && recurring.nextOccurrence <= today) {
                // Create the transaction
                const transactionData = {
                    type: recurring.type,
                    amount: recurring.amount,
                    description: recurring.description,
                    category: recurring.category,
                    incomeSource: recurring.incomeSource,
                    account: recurring.account,
                    date: recurring.nextOccurrence
                };

                await createTransaction(userId, transactionData);
                createdCount++;

                // Calculate next occurrence
                const nextOccurrence = calculateNextOccurrence(
                    new Date(recurring.nextOccurrence),
                    recurring.frequency
                );

                // Update recurring transaction
                await updateRecurring(userId, recurring.id, {
                    nextOccurrence: nextOccurrence.toISOString().split('T')[0],
                    lastCreated: recurring.nextOccurrence
                });

                // Notify callback
                if (onTransactionCreated) {
                    onTransactionCreated(transactionData);
                }
            }
        }

        return createdCount;
    } catch (error) {
        console.error('Error processing recurring transactions:', error);
        throw error;
    }
};

/**
 * Get upcoming recurring transactions (next 30 days)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Upcoming transactions
 */
export const getUpcomingRecurringTransactions = async (userId) => {
    try {
        const recurringTransactions = await getRecurringTransactions(userId);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const upcoming = recurringTransactions
            .filter(r => r.isActive && r.nextOccurrence)
            .map(r => ({
                ...r,
                nextOccurrenceDate: new Date(r.nextOccurrence)
            }))
            .filter(r => {
                return r.nextOccurrenceDate >= today && r.nextOccurrenceDate <= thirtyDaysFromNow;
            })
            .sort((a, b) => a.nextOccurrenceDate - b.nextOccurrenceDate);

        return upcoming;
    } catch (error) {
        console.error('Error getting upcoming recurring transactions:', error);
        throw error;
    }
};

/**
 * Pause a recurring transaction
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring transaction ID
 * @returns {Promise<void>}
 */
export const pauseRecurringTransaction = async (userId, recurringId) => {
    await updateRecurring(userId, recurringId, { isActive: false });
};

/**
 * Resume a recurring transaction
 * @param {string} userId - User ID
 * @param {string} recurringId - Recurring transaction ID
 * @returns {Promise<void>}
 */
export const resumeRecurringTransaction = async (userId, recurringId) => {
    await updateRecurring(userId, recurringId, { isActive: true });
};

export {
    createRecurring as createRecurringTransaction,
    updateRecurring as updateRecurringTransaction,
    deleteRecurring as deleteRecurringTransaction,
    getRecurringTransactions
};
