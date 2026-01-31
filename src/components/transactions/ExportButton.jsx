import React, { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Button } from '../shared/Button';
import { generatePDF, generateCSV, calculateSummary } from '../../utils/exportUtils';

/**
 * Export Button Component
 * Dropdown button to export transactions as PDF or CSV
 */
export const ExportButton = ({ transactions, accounts, currency = 'USD', dateRange = 'All Time' }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            // Add account names to transactions
            const transactionsWithAccounts = transactions.map(t => ({
                ...t,
                accountName: accounts.find(a => a.id === t.account)?.name || 'Unknown'
            }));

            // Calculate summary
            const summary = calculateSummary(transactionsWithAccounts);

            // Generate PDF
            generatePDF(transactionsWithAccounts, summary, dateRange, currency);

            setShowMenu(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            // Add account names to transactions
            const transactionsWithAccounts = transactions.map(t => ({
                ...t,
                accountName: accounts.find(a => a.id === t.account)?.name || 'Unknown'
            }));

            // Generate CSV (transactions already have balanceAfter from App.jsx)
            generateCSV(transactionsWithAccounts, currency);

            setShowMenu(false);
        } catch (error) {
            console.error('Error generating CSV:', error);
            alert('Error generating CSV. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (transactions.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => setShowMenu(!showMenu)}
                disabled={exporting}
            >
                {exporting ? 'Exporting...' : 'Export'}
            </Button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                        <div className="py-1">
                            <button
                                onClick={handleExportPDF}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Export as PDF</span>
                            </button>

                            <button
                                onClick={handleExportCSV}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                                <Table className="w-4 h-4" />
                                <span>Export as CSV</span>
                            </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
