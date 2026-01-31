import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Button } from '../shared/Button';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../../constants/categories';
import { FREQUENCIES } from '../../constants/frequencies';
import { validateRecurringTransactionForm } from '../../utils/validators';
import { calculateNextOccurrence, getCurrentDate } from '../../utils/dateHelpers';
import { Calendar, Repeat } from 'lucide-react';

/**
 * Recurring Transaction Form Component
 * Form for creating/editing recurring transactions
 */
export const RecurringTransactionForm = ({
    isOpen,
    onClose,
    onSubmit,
    accounts,
    initialData = null
}) => {
    const [formData, setFormData] = useState(initialData || {
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        incomeSource: '',
        account: '',
        frequency: 'monthly',
        startDate: getCurrentDate(),
        endDate: '',
        autoCreate: true,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [showPreview, setShowPreview] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form
        const validation = validateRecurringTransactionForm(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
            new Date(formData.startDate),
            formData.frequency
        );

        // Submit with next occurrence
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount),
            nextOccurrence: nextOccurrence.toISOString().split('T')[0]
        });

        onClose();
    };

    // Preview next 5 occurrences
    const getPreviewDates = () => {
        const dates = [];
        let currentDate = new Date(formData.startDate);

        for (let i = 0; i < 5; i++) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate = calculateNextOccurrence(currentDate, formData.frequency, currentDate);
        }

        return dates;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Recurring Transaction" : "Create Recurring Transaction"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => handleChange('type', 'expense')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.type === 'expense'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChange('type', 'income')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.type === 'income'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Income
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount */}
                    <Input
                        label="Amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                        error={errors.amount}
                    />

                    {/* Description */}
                    <Input
                        label="Description"
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="e.g., Monthly Rent"
                        required
                        error={errors.description}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category or Income Source */}
                    {formData.type === 'expense' ? (
                        <Select
                            label="Category"
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            options={EXPENSE_CATEGORIES}
                            required
                            error={errors.category}
                        />
                    ) : (
                        <Select
                            label="Income Source"
                            value={formData.incomeSource}
                            onChange={(e) => handleChange('incomeSource', e.target.value)}
                            options={INCOME_SOURCES}
                            required
                            error={errors.incomeSource}
                        />
                    )}

                    {/* Account */}
                    <Select
                        label="Account"
                        value={formData.account}
                        onChange={(e) => handleChange('account', e.target.value)}
                        options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                        required
                        error={errors.account}
                    />
                </div>

                {/* Frequency */}
                <Select
                    label="Frequency"
                    value={formData.frequency}
                    onChange={(e) => handleChange('frequency', e.target.value)}
                    options={FREQUENCIES}
                    required
                    error={errors.frequency}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <Input
                        label="Start Date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        required
                        error={errors.startDate}
                    />

                    {/* End Date (Optional) */}
                    <Input
                        label="End Date (Optional)"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        min={formData.startDate}
                        error={errors.endDate}
                    />
                </div>

                {/* Auto-create Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input
                        type="checkbox"
                        id="autoCreate"
                        checked={formData.autoCreate}
                        onChange={(e) => handleChange('autoCreate', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="autoCreate" className="text-sm text-gray-700 dark:text-gray-300">
                        Automatically create transactions on schedule
                    </label>
                </div>

                {/* Preview Button */}
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full flex items-center justify-center space-x-2 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                    <Calendar className="w-4 h-4" />
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                </button>

                {/* Preview Dates */}
                {showPreview && formData.startDate && formData.frequency && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                            <Repeat className="w-4 h-4 mr-2" />
                            Next 5 Occurrences:
                        </h4>
                        <ul className="space-y-1">
                            {getPreviewDates().map((date, index) => (
                                <li key={index} className="text-sm text-blue-700 dark:text-blue-400">
                                    {index + 1}. {new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        {initialData ? 'Update' : 'Create'} Recurring Transaction
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default RecurringTransactionForm;
