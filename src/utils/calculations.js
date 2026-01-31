import { getCurrentMonth, getCurrentDate, getStartOfWeek, getDaysAgo, isCurrentMonth, isToday, isCurrentWeek } from './dateHelpers';

/**
 * Calculate financial metrics from accounts and transactions
 * @param {Array} accounts - Array of account objects
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Financial metrics
 */
export const calculateFinancialMetrics = (accounts, transactions) => {
    // Calculate net worth using stored account balances
    const netWorth = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const currentMonth = getCurrentMonth();
    const currentDate = getCurrentDate();
    const startOfWeek = getStartOfWeek();
    const thirtyDaysAgo = getDaysAgo(30);

    // Monthly income and expenses
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && isCurrentMonth(t.date))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Daily expenses (today)
    const dailyExpenses = transactions
        .filter(t => t.type === 'expense' && isToday(t.date))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Weekly expenses (current week)
    const weeklyExpenses = transactions
        .filter(t => t.type === 'expense' && isCurrentWeek(t.date))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Average daily expense (last 30 days)
    const last30DaysExpenses = transactions
        .filter(t => {
            if (t.type !== 'expense' || !t.date) return false;
            const transactionDate = new Date(t.date);
            return transactionDate >= thirtyDaysAgo;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const avgDailyExpense = last30DaysExpenses / 30;

    // Calculate savings rate
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
        savingsRate: isNaN(savingsRate) ? 0 : savingsRate
    };
};

/**
 * Calculate spending by category
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Category spending data for charts
 */
export const calculateSpendingByCategory = (transactions) => {
    const data = {};

    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (!data[t.category]) data[t.category] = 0;
            data[t.category] += t.amount;
        });

    return Object.entries(data).map(([category, amount]) => ({
        name: category,
        value: parseFloat(amount.toFixed(2))
    }));
};

/**
 * Calculate daily cash flow for current month
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Daily cash flow data for charts
 */
export const calculateDailyCashFlow = (transactions) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentMonthKey = getCurrentMonth();

    // Initialize data for each day of the current month
    const dailyData = {};
    const dayLabels = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentMonthKey}-${day.toString().padStart(2, '0')}`;
        dailyData[dateKey] = { income: 0, expense: 0 };
        dayLabels.push(day.toString());
    }

    // Aggregate transactions by day for current month
    if (transactions && transactions.length > 0) {
        transactions.forEach(t => {
            if (!t.date || !t.amount) return;

            // Only process transactions from the current month
            if (t.date.startsWith(currentMonthKey)) {
                if (dailyData.hasOwnProperty(t.date)) {
                    if (t.type === 'expense') {
                        dailyData[t.date].expense += t.amount;
                    } else if (t.type === 'income') {
                        dailyData[t.date].income += t.amount;
                    }
                }
            }
        });
    }

    // Return formatted data for chart
    return Object.keys(dailyData)
        .sort()
        .map((dateKey, index) => ({
            day: dayLabels[index],
            date: dateKey,
            expense: parseFloat((dailyData[dateKey]?.expense || 0).toFixed(2)),
            income: parseFloat((dailyData[dateKey]?.income || 0).toFixed(2)),
            net: parseFloat(((dailyData[dateKey]?.income || 0) - (dailyData[dateKey]?.expense || 0)).toFixed(2))
        }));
};

/**
 * Calculate budget progress
 * @param {Object} budgets - Budget limits by category
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Budget progress by category
 */
export const calculateBudgetProgress = (budgets, transactions) => {
    const progress = {};
    const currentMonth = getCurrentMonth();

    Object.entries(budgets).forEach(([category, limit]) => {
        const spent = transactions
            .filter(t =>
                t.type === 'expense' &&
                t.category === category &&
                t.date?.startsWith(currentMonth)
            )
            .reduce((sum, t) => sum + t.amount, 0);

        progress[category] = {
            spent,
            limit,
            percentage: Math.min((spent / limit) * 100, 100)
        };
    });

    return progress;
};
