import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { 
  LineChart, Line, PieChart, Pie, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Calendar, DollarSign, TrendingUp, TrendingDown, CreditCard, PiggyBank,
  User, LogOut, Plus, Edit2, Trash2, Moon, Sun, Brain, Loader2,
  AlertCircle, CheckCircle, XCircle, ChevronDown, Wallet, Target,
  Sparkles, Home, BarChart3, Receipt, X, Save, Chrome
} from 'lucide-react';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Gemini API configuration from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Color palette for charts
const CHART_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

// Categories
const EXPENSE_CATEGORIES = ['Groceries', 'Rent', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Dining', 'Other'];
const INCOME_SOURCES = ['Full-time Salary', 'Freelance', 'Consulting', 'Investment', 'Business', 'Rental Income', 'Other'];
const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' }
];

function App() {
  // Authentication states
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });

  // UI states
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Financial data states
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Form states
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: '', type: 'checking', balance: '' });
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    incomeSource: '',
    account: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [budgetForm, setBudgetForm] = useState({});

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) loadUserData(user.uid);
    });
    return unsubscribe;
  }, []);

  // Apply dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user data from Firestore
  const loadUserData = async (userId) => {
    setLoading(true);
    try {
      // Load accounts
      const accountsSnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
      const accountsData = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accountsData);

      // Load transactions with real-time updates
      const transactionsQuery = query(
        collection(db, `users/${userId}/transactions`),
        orderBy('date', 'desc')
      );
      onSnapshot(transactionsQuery, (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(transactionsData);
      });

      // Load budgets
      const budgetsSnapshot = await getDocs(collection(db, `users/${userId}/budgets`));
      const budgetsData = {};
      budgetsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        budgetsData[data.category] = data.limit;
      });
      setBudgets(budgetsData);
      setBudgetForm(budgetsData);
    } catch (error) {
      showNotification('Error loading data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Authentication handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        showNotification('Account created successfully!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        showNotification('Logged in successfully!', 'success');
      }
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if this is a new user and create initial data if needed
      const accountsSnapshot = await getDocs(collection(db, `users/${user.uid}/accounts`));
      if (accountsSnapshot.empty) {
        // Create a default account for new Google users
        await addDoc(collection(db, `users/${user.uid}/accounts`), {
          name: 'Main Account',
          type: 'checking',
          balance: 0,
          createdAt: serverTimestamp()
        });
      }
      
      showNotification(`Welcome ${user.displayName || user.email}!`, 'success');
    } catch (error) {
      showNotification('Error signing in with Google: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Logged out successfully', 'success');
      setAccounts([]);
      setTransactions([]);
      setBudgets({});
    } catch (error) {
      showNotification('Error logging out: ' + error.message, 'error');
    }
  };

  // Account management
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/accounts`), {
        name: accountForm.name,
        type: accountForm.type,
        balance: parseFloat(accountForm.balance),
        createdAt: serverTimestamp()
      });
      await loadUserData(user.uid);
      setShowAccountForm(false);
      setAccountForm({ name: '', type: 'checking', balance: '' });
      showNotification('Account added successfully!', 'success');
    } catch (error) {
      showNotification('Error adding account: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Transaction management
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const transactionData = {
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        category: transactionForm.type === 'expense' ? transactionForm.category : 'Income',
        incomeSource: transactionForm.type === 'income' ? transactionForm.incomeSource : null,
        account: transactionForm.account,
        date: transactionForm.date,
        createdAt: serverTimestamp()
      };

      if (editingTransaction) {
        await updateDoc(doc(db, `users/${user.uid}/transactions`, editingTransaction.id), transactionData);
        showNotification('Transaction updated successfully!', 'success');
      } else {
        await addDoc(collection(db, `users/${user.uid}/transactions`), transactionData);
        showNotification('Transaction added successfully!', 'success');
      }

      // Update account balance
      const account = accounts.find(acc => acc.id === transactionForm.account);
      if (account) {
        const balanceChange = transactionForm.type === 'income' 
          ? parseFloat(transactionForm.amount) 
          : -parseFloat(transactionForm.amount);
        await updateDoc(doc(db, `users/${user.uid}/accounts`, account.id), {
          balance: account.balance + balanceChange
        });
      }

      await loadUserData(user.uid);
      setShowTransactionForm(false);
      setEditingTransaction(null);
      setTransactionForm({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        incomeSource: '',
        account: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      showNotification('Error processing transaction: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions`, transaction.id));
      
      // Update account balance
      const account = accounts.find(acc => acc.id === transaction.account);
      if (account) {
        const balanceChange = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount;
        await updateDoc(doc(db, `users/${user.uid}/accounts`, account.id), {
          balance: account.balance + balanceChange
        });
      }

      await loadUserData(user.uid);
      showNotification('Transaction deleted successfully!', 'success');
    } catch (error) {
      showNotification('Error deleting transaction: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Budget management
  const handleUpdateBudgets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      for (const [category, limit] of Object.entries(budgetForm)) {
        if (limit && parseFloat(limit) > 0) {
          const budgetRef = doc(db, `users/${user.uid}/budgets`, category);
          await setDoc(budgetRef, { 
            category,
            limit: parseFloat(limit),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
      setBudgets(budgetForm);
      showNotification('Budgets updated successfully!', 'success');
    } catch (error) {
      showNotification('Error updating budgets: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // AI Suggestions
  const generateAISuggestions = async () => {
    if (!user || transactions.length === 0) {
      showNotification('No transaction data available for analysis', 'warning');
      return;
    }

    setAiLoading(true);
    try {
      // Prepare transaction data for analysis
      const categorySpending = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpenses += t.amount;
          if (!categorySpending[t.category]) categorySpending[t.category] = 0;
          categorySpending[t.category] += t.amount;
        }
      });

      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0;

      const prompt = `
        Analyze this financial data and provide personalized advice:
        Total Income: $${totalIncome.toFixed(2)}
        Total Expenses: $${totalExpenses.toFixed(2)}
        Savings Rate: ${savingsRate}%
        Top Spending Categories: ${Object.entries(categorySpending).slice(0, 5).map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`).join(', ')}
        
        Provide 3 specific ways to reduce spending and improve savings rate.
      `;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI suggestions');

      const data = await response.json();
      const suggestions = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate suggestions';
      setAiSuggestions(suggestions);
      showNotification('AI suggestions generated successfully!', 'success');
    } catch (error) {
      showNotification('Error generating AI suggestions: ' + error.message, 'error');
      setAiSuggestions('Please configure your API key to get AI suggestions.');
    } finally {
      setAiLoading(false);
    }
  };

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const netWorth = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && t.date?.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.date?.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

    return { netWorth, monthlyIncome, monthlyExpenses, savingsRate };
  }, [accounts, transactions]);

  // Prepare chart data
  const spendingByCategoryData = useMemo(() => {
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
  }, [transactions]);

  const monthlySpendingData = useMemo(() => {
    const data = {};
    const last12Months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      last12Months.push(monthKey);
      data[monthKey] = 0;
    }

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const monthKey = t.date?.substring(0, 7);
        if (data.hasOwnProperty(monthKey)) {
          data[monthKey] += t.amount;
        }
      });

    return last12Months.map(month => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      amount: parseFloat(data[month].toFixed(2))
    }));
  }, [transactions]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortConfig.key === 'amount') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    if (selectedAccount !== 'all') {
      return sorted.filter(t => t.account === selectedAccount);
    }
    return sorted;
  }, [transactions, sortConfig, selectedAccount]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Budget progress calculation
  const budgetProgress = useMemo(() => {
    const progress = {};
    const currentMonth = new Date().toISOString().substring(0, 7);
    
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
  }, [budgets, transactions]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                  minLength="6"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.displayName || user.email}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                    {user.uid}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            } text-white`}>
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {['overview', 'transactions', 'accounts', 'budgets', 'insights'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto" />
                <p className="mt-2 text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Worth</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financialMetrics.netWorth)}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(financialMetrics.monthlyIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(financialMetrics.monthlyExpenses)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {financialMetrics.savingsRate.toFixed(1)}%
                      </p>
                    </div>
                    <PiggyBank className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={spendingByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: $${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {spendingByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Spending Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlySpendingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#ec4899" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - simplified for space */}
          {activeTab === 'transactions' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h2>
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {sortedTransactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(t.date).toLocaleDateString()} • {t.category || t.incomeSource}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(t)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accounts</h2>
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Budgets</h2>
                <button
                  onClick={handleUpdateBudgets}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPENSE_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</label>
                    <input
                      type="number"
                      value={budgetForm[category] || ''}
                      onChange={(e) => setBudgetForm({ ...budgetForm, [category]: e.target.value })}
                      placeholder="0"
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
                <button
                  onClick={generateAISuggestions}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{aiLoading ? 'Analyzing...' : 'Generate'}</span>
                </button>
              </div>
              {aiSuggestions ? (
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{aiSuggestions}</div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Click "Generate" to get AI-powered financial advice</p>
                </div>
              )}
            </div>
          )}

          {/* Transaction Form Modal */}
          {showTransactionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Transaction</h3>
                  <button onClick={() => setShowTransactionForm(false)} className="p-1">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                      className={`px-3 py-2 rounded-lg border ${
                        transactionForm.type === 'expense' ? 'bg-red-50 border-red-300' : 'border-gray-300'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                      className={`px-3 py-2 rounded-lg border ${
                        transactionForm.type === 'income' ? 'bg-green-50 border-green-300' : 'border-gray-300'
                      }`}
                    >
                      Income
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  {transactionForm.type === 'expense' ? (
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select category</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={transactionForm.incomeSource}
                      onChange={(e) => setTransactionForm({ ...transactionForm, incomeSource: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select source</option>
                      {INCOME_SOURCES.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  )}

                  <select
                    value={transactionForm.account}
                    onChange={(e) => setTransactionForm({ ...transactionForm, account: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Add Transaction'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Account Form Modal */}
          {showAccountForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Account</h3>
                  <button onClick={() => setShowAccountForm(false)} className="p-1">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleAddAccount} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Account Name"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Initial Balance"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Add Account'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
