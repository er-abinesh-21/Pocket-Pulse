import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';

/**
 * BudgetForm Component
 * Modal form for editing budget limits
 */
export const BudgetForm = ({
    category,
    currentBudget,
    currency,
    onSave,
    onClose
}) => {
    const [budgetAmount, setBudgetAmount] = useState(currentBudget || '');
    const [error, setError] = useState('');

    useEffect(() => {
        setBudgetAmount(currentBudget || '');
    }, [currentBudget]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const amount = parseFloat(budgetAmount);

        if (budgetAmount === '' || budgetAmount === '0') {
            // Allow empty or 0 to remove budget
            onSave(category, '');
            return;
        }

        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid positive number');
            return;
        }

        onSave(category, budgetAmount);
    };

    const getCurrencySymbol = () => {
        const symbols = {
            USD: '$',
            INR: '₹',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$'
        };
        return symbols[currency] || '$';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Set Budget
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {category}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Monthly Budget Limit
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400 text-lg">
                                    {getCurrencySymbol()}
                                </span>
                            </div>
                            <input
                                type="number"
                                value={budgetAmount}
                                onChange={(e) => {
                                    setBudgetAmount(e.target.value);
                                    setError('');
                                }}
                                placeholder="0"
                                step="0.01"
                                min="0"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-lg"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Set to 0 or leave empty to remove this budget
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Budget</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetForm;
