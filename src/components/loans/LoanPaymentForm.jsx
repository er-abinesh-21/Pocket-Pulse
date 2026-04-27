import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Trash2 } from 'lucide-react';

/**
 * Loan Payment Form Component
 * Form to record a payment towards a loan
 */
export const LoanPaymentForm = ({ isOpen, onClose, onSubmit, onDelete, loan }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const paymentAmount = parseFloat(formData.amount);

        if (paymentAmount > loan.remainingAmount) {
            alert(`Payment amount cannot exceed remaining balance of ${loan.remainingAmount}`);
            return;
        }

        onSubmit(loan.id, paymentAmount, formData.date);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0]
        });
        onClose();
    };

    if (!loan) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Payment for ${loan.name}`}>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        ${loan.remainingAmount?.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Original Amount:</span>
                    <span className="text-gray-900 dark:text-white">
                        ${loan.amount?.toFixed(2)}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Payment Amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    max={loan.remainingAmount}
                    required
                />

                <Input
                    label="Payment Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />

                <div className="flex justify-between items-center pt-4">
                    <div>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this loan? This will delete the loan record along with all associated payments and transactions, and restore the account balances.')) {
                                        onDelete(loan.id);
                                        handleClose();
                                    }
                                }}
                                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Loan</span>
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Record Payment
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default LoanPaymentForm;
