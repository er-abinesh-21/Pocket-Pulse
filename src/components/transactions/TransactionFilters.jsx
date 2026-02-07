import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Select } from '../shared/Select';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { getCurrentDate } from '../../utils/dateHelpers';

/**
 * Transaction Filters Component
 * Provides comprehensive filtering options for transactions
 */
export const TransactionFilters = ({ accounts, categories = [], onFilterChange, activeFilters }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(activeFilters || {
        type: '',
        category: '',
        account: '',
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: ''
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            type: '',
            category: '',
            account: '',
            dateFrom: '',
            dateTo: '',
            amountMin: '',
            amountMax: ''
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {activeFilterCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        icon={X}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {/* Type Filter */}
                    <Select
                        label="Type"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        options={[
                            { value: 'income', label: 'Income' },
                            { value: 'expense', label: 'Expense' }
                        ]}
                        placeholder="All Types"
                    />

                    {/* Category Filter */}
                    <Select
                        label="Category"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        options={categories}
                        placeholder="All Categories"
                    />


                    {/* Account Filter */}
                    <Select
                        label="Account"
                        value={filters.account}
                        onChange={(e) => handleFilterChange('account', e.target.value)}
                        options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                        placeholder="All Accounts"
                    />

                    {/* Date Range */}
                    <Input
                        label="From Date"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        max={getCurrentDate()}
                    />

                    <Input
                        label="To Date"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        max={getCurrentDate()}
                    />

                    {/* Amount Range */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Amount Range
                        </label>
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                value={filters.amountMin}
                                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                                placeholder="Min"
                                min="0"
                                step="0.01"
                            />
                            <span className="text-gray-500">-</span>
                            <Input
                                type="number"
                                value={filters.amountMax}
                                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                                placeholder="Max"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filter Badges */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.type && (
                        <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                            Type: {filters.type}
                            <button
                                onClick={() => handleFilterChange('type', '')}
                                className="ml-2 hover:text-purple-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.category && (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            Category: {filters.category}
                            <button
                                onClick={() => handleFilterChange('category', '')}
                                className="ml-2 hover:text-blue-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.account && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                            Account: {accounts.find(a => a.id === filters.account)?.name}
                            <button
                                onClick={() => handleFilterChange('account', '')}
                                className="ml-2 hover:text-green-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(filters.dateFrom || filters.dateTo) && (
                        <span className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-sm">
                            Date: {filters.dateFrom || '...'} to {filters.dateTo || '...'}
                            <button
                                onClick={() => {
                                    handleFilterChange('dateFrom', '');
                                    handleFilterChange('dateTo', '');
                                }}
                                className="ml-2 hover:text-amber-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(filters.amountMin || filters.amountMax) && (
                        <span className="inline-flex items-center px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm">
                            Amount: ${filters.amountMin || '0'} - ${filters.amountMax || '∞'}
                            <button
                                onClick={() => {
                                    handleFilterChange('amountMin', '');
                                    handleFilterChange('amountMax', '');
                                }}
                                className="ml-2 hover:text-pink-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransactionFilters;
