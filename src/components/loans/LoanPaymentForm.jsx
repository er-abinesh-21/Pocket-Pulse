import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

/**
 * Loan Payment Form Component
 * Form to record a payment towards a loan
 */
export const LoanPaymentForm = ({ isOpen, onClose, onSubmit, loan }) => {
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

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        Record Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default LoanPaymentForm;
