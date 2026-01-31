import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Button } from '../shared/Button';

/**
 * Loan Form Component
 * Form to add or edit a loan
 */
export const LoanForm = ({ isOpen, onClose, onSubmit, accounts, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        lender: '',
        amount: '',
        interestRate: '',
        dueDate: '',
        account: '',
        notes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const loanData = {
            name: formData.name,
            lender: formData.lender,
            amount: parseFloat(formData.amount),
            interestRate: formData.interestRate ? parseFloat(formData.interestRate) : 0,
            dueDate: formData.dueDate || null,
            account: formData.account,
            notes: formData.notes,
            date: new Date().toISOString().split('T')[0]
        };

        onSubmit(loanData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            name: '',
            lender: '',
            amount: '',
            interestRate: '',
            dueDate: '',
            account: '',
            notes: ''
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={initialData ? 'Edit Loan' : 'Add New Loan'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Loan Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Car Loan, Personal Loan"
                    required
                />

                <Input
                    label="Lender"
                    type="text"
                    value={formData.lender}
                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                    placeholder="e.g., Bank Name, Friend's Name"
                />

                <Input
                    label="Loan Amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                />

                <Input
                    label="Interest Rate (%)"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="0.00"
                />

                <Input
                    label="Due Date (Optional)"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />

                <Select
                    label="Account"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    options={accounts.map(account => ({
                        value: account.id,
                        label: account.name
                    }))}
                    placeholder="Select account"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                        rows="3"
                        placeholder="Additional notes about this loan..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        {initialData ? 'Update Loan' : 'Add Loan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default LoanForm;
