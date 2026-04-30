import React from 'react';

/**
 * TransactionRow
 * --------------
 * One row in the Transactions list. Tapping the row opens the printer/receipt
 * modal via `onOpen(transaction)`. The row is intentionally NOT draggable —
 * the drag-to-bin interaction lives on the printed receipt inside the modal.
 */
export const TransactionRow = ({
    transaction,
    accountName,
    formatCurrency,
    getCategoryIcon,
    onOpen
}) => {
    const t = transaction;
    const isIncome = t.type === 'income' || t.type === 'loan';
    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
    const sign = isIncome ? '+' : '-';

    const handleClick = () => {
        if (onOpen) onOpen(t);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onOpen) {
                    e.preventDefault();
                    onOpen(t);
                }
            }}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2 sm:gap-0 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
            <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {new Date(t.date).toLocaleDateString()} •{' '}
                    {t.type === 'expense' ? `${getCategoryIcon(t.category)} ` : ''}
                    {t.category || t.incomeSource}
                    <span className="hidden sm:inline">{accountName ? ` • ${accountName}` : ''}</span>
                </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                <span className={`font-bold ${amountClass}`}>
                    {sign}
                    {formatCurrency(t.amount)}
                </span>
                <div className="text-right min-w-[100px] sm:min-w-[120px] border-l border-gray-300 dark:border-gray-600 pl-2 sm:pl-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bal. After</p>
                    <p
                        className={`font-bold text-sm ${t.balanceAfter >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                    >
                        {formatCurrency(t.balanceAfter)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TransactionRow;
