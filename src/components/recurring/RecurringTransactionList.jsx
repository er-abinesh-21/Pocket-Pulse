import React from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Edit2, Trash2, Pause, Play, Calendar, Repeat } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';

/**
 * Recurring Transaction List Component
 * Displays all recurring transactions with management actions
 */
export const RecurringTransactionList = ({
    recurringTransactions,
    onEdit,
    onDelete,
    onPause,
    onResume,
    currency = 'USD'
}) => {
    if (!recurringTransactions || recurringTransactions.length === 0) {
        return (
            <Card>
                <div className="text-center py-8">
                    <Repeat className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No recurring transactions yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Create one to automate your regular bills and income
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {recurringTransactions.map((recurring) => (
                <Card key={recurring.id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Left: Transaction Info */}
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${recurring.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {recurring.description}
                                </h3>
                                {!recurring.isActive && (
                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                        Paused
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className={`font-semibold ${recurring.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount, currency)}
                                </span>
                                <span>•</span>
                                <span className="capitalize">{recurring.frequency}</span>
                                <span>•</span>
                                <span>{recurring.category || recurring.incomeSource}</span>
                            </div>

                            {recurring.nextOccurrence && (
                                <div className="mt-2 flex items-center space-x-2 text-sm">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Next: <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(recurring.nextOccurrence)}
                                        </span>
                                    </span>
                                </div>
                            )}

                            {recurring.endDate && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                    Ends: {formatDate(recurring.endDate)}
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-2">
                            {recurring.isActive ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPause(recurring.id)}
                                    icon={Pause}
                                    className="text-orange-600 hover:text-orange-700"
                                >
                                    Pause
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onResume(recurring.id)}
                                    icon={Play}
                                    className="text-green-600 hover:text-green-700"
                                >
                                    Resume
                                </Button>
                            )}

                            <button
                                onClick={() => onEdit(recurring)}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onDelete(recurring.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default RecurringTransactionList;
