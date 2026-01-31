import React from 'react';
import { Home, Receipt, Wallet, Target, CalendarDays, Brain, HelpCircle } from 'lucide-react';

/**
 * Navigation Component
 * Tab navigation for switching between different sections
 */
export const Navigation = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'overview', icon: Home, label: 'Overview' },
        { id: 'transactions', icon: Receipt, label: 'Transactions' },
        { id: 'accounts', icon: Wallet, label: 'Accounts' },
        { id: 'budgets', icon: Target, label: 'Budgets' },
        { id: 'recurring', icon: CalendarDays, label: 'Recurring' },
        { id: 'insights', icon: Brain, label: 'Insights' },
        { id: 'help', icon: HelpCircle, label: 'Help' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex overflow-x-auto scrollbar-hide space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 min-w-fit px-3 sm:px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline text-sm sm:text-base">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Navigation;
