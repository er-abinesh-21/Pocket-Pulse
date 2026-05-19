import React from 'react';

/**
 * TransactionRow
 * --------------
 * One row in the Transactions list. Tapping the row opens the printer/receipt
 * modal via `onOpen(transaction)`. The row is intentionally NOT draggable —
 * the drag-to-bin interaction lives on the printed receipt inside the modal.
 */
import * as LucideIcons from 'lucide-react';
import { getIncomeSourceDetails } from '../../constants/categories';

const DynamicIcon = ({ name, color }) => {
    if (!name) return null;
    const pascalName = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    const IconComponent = LucideIcons[pascalName] || LucideIcons.DollarSign;
    return <IconComponent size={14} color={color} className="inline-block mr-1 -mt-0.5" />;
};

export const TransactionRow = ({
    transaction,
    accountName,
    formatCurrency,
    getCategoryIcon,
    onOpen,
    selectable = false,
    selected = false,
    onSelect
}) => {
    const t = transaction;
    const isIncome = t.type === 'income' || t.type === 'loan';
    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
    const sign = isIncome ? '+' : '-';

    const handleClick = () => {
        if (selectable) {
            if (onSelect) onSelect(t.id);
            return;
        }
        if (onOpen) onOpen(t);
    };

    const incomeDetails = isIncome ? getIncomeSourceDetails(t.incomeSource) : null;

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
            className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 rounded-lg gap-2 sm:gap-0 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors ${
                selected
                    ? 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-400'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
        >
            <div className="flex items-start sm:items-center gap-3 flex-1">
                {selectable && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect && onSelect(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 mt-1 sm:mt-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shrink-0"
                    />
                )}
                <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {new Date(t.date).toLocaleDateString()} •{' '}
                    {t.type === 'expense' ? (
                        <>{getCategoryIcon(t.category)} {t.category}</>
                    ) : (
                        <span style={{ color: incomeDetails?.color }}>
                            <DynamicIcon name={incomeDetails?.icon} color={incomeDetails?.color} />
                            {t.incomeSource}
                        </span>
                    )}
                    <span className="hidden sm:inline text-gray-500 dark:text-gray-400">
                        {accountName ? ` • ${accountName}` : ''}
                    </span>
                </p>
            </div>
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
