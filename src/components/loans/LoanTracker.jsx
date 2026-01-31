import React from 'react';
import { TrendingDown, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { formatCurrency } from '../../utils/currency';

/**
 * Loan Tracker Component
 * Dashboard widget showing active loans and total debt
 */
export const LoanTracker = ({ loans, currency = 'USD', onViewDetails, onAddLoan }) => {
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const totalDebt = activeLoans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);

    if (activeLoans.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Loans</h3>
                    <TrendingDown className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No active loans</p>
                {onAddLoan && (
                    <button
                        onClick={onAddLoan}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Add Loan
                    </button>
                )}
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Loans</h3>
                <div className="flex items-center space-x-2">
                    {onAddLoan && (
                        <button
                            onClick={onAddLoan}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            + Add
                        </button>
                    )}
                    <TrendingDown className="w-5 h-5 text-orange-500" />
                </div>
            </div>

            {/* Total Debt Summary */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(totalDebt, currency)}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Loan List */}
            <div className="space-y-3">
                {activeLoans.slice(0, 3).map(loan => {
                    const progress = ((loan.amount - loan.remainingAmount) / loan.amount) * 100;
                    const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date();

                    return (
                        <div
                            key={loan.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => onViewDetails && onViewDetails(loan)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {loan.name}
                                    </p>
                                    {loan.lender && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Lender: {loan.lender}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {formatCurrency(loan.remainingAmount, currency)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        of {formatCurrency(loan.amount, currency)}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {progress.toFixed(0)}% paid
                                </p>
                            </div>

                            {/* Due Date */}
                            {loan.dueDate && (
                                <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {isOverdue ? (
                                        <AlertCircle className="w-3 h-3" />
                                    ) : (
                                        <Calendar className="w-3 h-3" />
                                    )}
                                    <span>
                                        Due: {new Date(loan.dueDate).toLocaleDateString()}
                                        {isOverdue && ' (Overdue)'}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* View All Link */}
            {activeLoans.length > 3 && (
                <button
                    onClick={() => onViewDetails && onViewDetails(null)}
                    className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                    View all {activeLoans.length} loans →
                </button>
            )}
        </Card>
    );
};

export default LoanTracker;
