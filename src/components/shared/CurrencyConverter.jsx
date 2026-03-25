import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw, X, TrendingUp, Globe } from 'lucide-react';
import { CURRENCIES, fetchExchangeRates, convertCurrency } from '../../utils/currency';

/**
 * CurrencyConverter Component
 * A full-featured currency converter modal with live exchange rates
 */
export const CurrencyConverter = ({ isOpen, onClose, darkMode, baseCurrency = 'INR' }) => {
    const [fromCurrency, setFromCurrency] = useState(baseCurrency);
    const [toCurrency, setToCurrency] = useState(baseCurrency === 'INR' ? 'USD' : 'INR');
    const [amount, setAmount] = useState('1');
    const [convertedAmount, setConvertedAmount] = useState(0);
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [allRates, setAllRates] = useState({});

    // Fetch rates when the modal opens or fromCurrency changes
    const loadRates = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedRates = await fetchExchangeRates(fromCurrency);
            setRates(fetchedRates);
            setLastUpdated(new Date());

            // Build a table of all rates for this base
            const rateTable = {};
            Object.keys(CURRENCIES).forEach(code => {
                if (code !== fromCurrency && fetchedRates[code]) {
                    rateTable[code] = fetchedRates[code];
                }
            });
            setAllRates(rateTable);
        } catch (error) {
            console.error('Failed to load rates:', error);
        } finally {
            setLoading(false);
        }
    }, [fromCurrency]);

    useEffect(() => {
        if (isOpen) {
            loadRates();
        }
    }, [isOpen, loadRates]);

    // Convert whenever amount, rates, or currencies change
    useEffect(() => {
        if (rates) {
            const numAmount = parseFloat(amount) || 0;
            const result = convertCurrency(numAmount, fromCurrency, toCurrency, rates);
            setConvertedAmount(result);
        }
    }, [amount, fromCurrency, toCurrency, rates]);

    // Swap currencies
    const handleSwap = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    // Format display amount
    const formatDisplay = (value, currencyCode) => {
        const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(value);
    };

    if (!isOpen) return null;

    const currentRate = rates && rates[toCurrency] ? rates[toCurrency] : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Currency Converter</h2>
                                <p className="text-purple-100 text-sm">Live exchange rates</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Amount
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                            min="0"
                            step="any"
                        />
                    </div>

                    {/* Currency Selectors */}
                    <div className="flex items-center gap-3">
                        {/* From */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                From
                            </label>
                            <select
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="w-full px-4 py-3 text-sm font-medium border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none cursor-pointer"
                            >
                                {Object.entries(CURRENCIES).map(([code, config]) => (
                                    <option key={code} value={code}>
                                        {config.symbol} {code} - {config.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Swap Button */}
                        <button
                            onClick={handleSwap}
                            className="mt-6 p-3 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-xl text-purple-600 dark:text-purple-400 transition-all hover:scale-110 active:scale-95"
                            title="Swap currencies"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>

                        {/* To */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                To
                            </label>
                            <select
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value)}
                                className="w-full px-4 py-3 text-sm font-medium border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none cursor-pointer"
                            >
                                {Object.entries(CURRENCIES).map(([code, config]) => (
                                    <option key={code} value={code}>
                                        {config.symbol} {code} - {config.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800">
                        {loading ? (
                            <div className="flex items-center justify-center py-3">
                                <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                                <span className="ml-2 text-gray-600 dark:text-gray-400">Fetching rates...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        {formatDisplay(parseFloat(amount) || 0, fromCurrency)} =
                                    </p>
                                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                                        {formatDisplay(convertedAmount, toCurrency)}
                                    </p>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>
                                        1 {fromCurrency} = {currentRate ? currentRate.toFixed(4) : '—'} {toCurrency}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Exchange Rate Table */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Exchange Rates (1 {fromCurrency})
                            </h3>
                            <button
                                onClick={loadRates}
                                disabled={loading}
                                className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(allRates).map(([code, rate]) => (
                                <div
                                    key={code}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all
                                        ${code === toCurrency 
                                            ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700' 
                                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                                        }`}
                                    onClick={() => setToCurrency(code)}
                                >
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {CURRENCIES[code]?.symbol} {code}
                                    </span>
                                    <span className={`font-mono text-xs ${
                                        code === toCurrency
                                            ? 'text-purple-700 dark:text-purple-300 font-bold'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {rate.toFixed(4)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyConverter;
