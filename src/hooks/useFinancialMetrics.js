import { useMemo } from 'react';

/**
 * Custom hook for calculating financial metrics
 */
export const useFinancialMetrics = (accounts, transactions) => {
    return useMemo(() => {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        const currentDate = now.toISOString().substring(0, 10);

        // Net worth
        const netWorth = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        // Monthly income and expenses
        const monthlyIncome = transactions
            .filter(t => t.type === 'income' && t.date && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const monthlyExpenses = transactions
            .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Daily expenses (today)
        const dailyExpenses = transactions
            .filter(t => t.type === 'expense' && t.date === currentDate)
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Weekly expenses
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyExpenses = transactions
            .filter(t => {
                if (t.type !== 'expense' || !t.date) return false;
                const transactionDate = new Date(t.date);
                return transactionDate >= startOfWeek && transactionDate <= now;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Average daily expense (last 30 days)
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30DaysExpenses = transactions
            .filter(t => {
                if (t.type !== 'expense' || !t.date) return false;
                const transactionDate = new Date(t.date);
                return transactionDate >= thirtyDaysAgo && transactionDate <= now;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const avgDailyExpense = last30DaysExpenses / 30;

        // Savings rate
        let savingsRate = 0;
        if (monthlyIncome > 0) {
            const monthlySavings = monthlyIncome - monthlyExpenses;
            savingsRate = (monthlySavings / monthlyIncome) * 100;
            savingsRate = Math.max(-100, Math.min(100, savingsRate));
        }

        return {
            netWorth,
            monthlyIncome,
            monthlyExpenses,
            dailyExpenses,
            weeklyExpenses,
            avgDailyExpense,
            savingsRate
        };
    }, [accounts, transactions]);
};

export default useFinancialMetrics;
