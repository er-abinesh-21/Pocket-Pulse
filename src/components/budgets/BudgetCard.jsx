import React from 'react';
import { Edit2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * BudgetCard Component
 * Displays budget information for a category with visual progress indicator
 */
export const BudgetCard = ({
    category,
    budget,
    spent,
    currency,
    onEdit
}) => {
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const remaining = budget - spent;
    const isOverBudget = spent > budget;
    const isWarning = percentage >= 75 && percentage < 100;
    const isSafe = percentage < 75;

    // Determine color scheme based on budget status
    const getColorClasses = () => {
        if (isOverBudget) {
            return {
                bg: 'bg-red-50 dark:bg-red-900/10',
                border: 'border-red-200 dark:border-red-800',
                progress: 'bg-red-500',
                text: 'text-red-600 dark:text-red-400',
                icon: 'text-red-500'
            };
        } else if (isWarning) {
            return {
                bg: 'bg-yellow-50 dark:bg-yellow-900/10',
                border: 'border-yellow-200 dark:border-yellow-800',
                progress: 'bg-yellow-500',
                text: 'text-yellow-600 dark:text-yellow-400',
                icon: 'text-yellow-500'
            };
        } else {
            return {
                bg: 'bg-green-50 dark:bg-green-900/10',
                border: 'border-green-200 dark:border-green-800',
                progress: 'bg-green-500',
                text: 'text-green-600 dark:text-green-400',
                icon: 'text-green-500'
            };
        }
    };

    const colors = getColorClasses();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 transition-all hover:shadow-md group`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Budget: {formatCurrency(budget)}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {isOverBudget && <AlertCircle className={`w-5 h-5 ${colors.icon}`} />}
                    {isSafe && <CheckCircle className={`w-5 h-5 ${colors.icon}`} />}
                    {isWarning && <TrendingUp className={`w-5 h-5 ${colors.icon}`} />}
                    <button
                        onClick={() => onEdit(category, budget)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded"
                        title="Edit budget"
                    >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Spent: {formatCurrency(spent)}
                    </span>
                    <span className={`text-sm font-bold ${colors.text}`}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`${colors.progress} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Remaining Amount */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                    {isOverBudget ? 'Over budget:' : 'Remaining:'}
                </span>
                <span className={`font-semibold ${isOverBudget ? colors.text : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(Math.abs(remaining))}
                </span>
            </div>
        </div>
    );
};

export default BudgetCard;
