import React from 'react';
import { Moon, Sun, LogOut, Wallet } from 'lucide-react';

/**
 * Header Component
 * Main application header with branding, currency selector, theme toggle, and logout
 */
export const Header = ({
    user,
    currency,
    currencies,
    darkMode,
    onCurrencyChange,
    onToggleDarkMode,
    onLogout
}) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="bg-purple-100 dark:bg-purple-900 p-1.5 sm:p-2 rounded-lg">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Pocket Pulse</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Personal Finance</p>
                        </div>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Currency Selector */}
                        <select
                            value={currency}
                            onChange={(e) => onCurrencyChange(e.target.value)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                            {Object.entries(currencies).map(([code, { symbol, name }]) => (
                                <option key={code} value={code}>
                                    {symbol} {code}
                                </option>
                            ))}
                        </select>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={onToggleDarkMode}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? (
                                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            )}
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
