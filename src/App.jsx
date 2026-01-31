import React, { useState, useEffect, useMemo } from 'react';
import { TransactionSearch, TransactionFilters, ExportButton } from './components/transactions';
import { RecurringTransactionForm, RecurringTransactionList } from './components/recurring';
import { LoanTracker, LoanForm, LoanPaymentForm } from './components/loans';
import { useTransactionFilter } from './hooks/useTransactionFilter';
import { useRecurringTransactions } from './hooks/useRecurringTransactions';
import { useLoans } from './hooks/useLoans';
import {
  createRecurringTransaction,
  updateRecurringTransaction
} from './services/recurring.service';
import { calculateRunningBalance } from './utils/balanceCalculations';
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
  Calendar, CalendarDays, DollarSign, TrendingUp, TrendingDown, CreditCard, PiggyBank,
  User, LogOut, Plus, Edit2, Trash2, Moon, Sun, Brain, Loader2,
  AlertCircle, CheckCircle, XCircle, ChevronDown, Wallet, Target,
  Sparkles, Home, BarChart3, Receipt, X, Save, Chrome, HelpCircle, BookOpen
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

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set correctly.');
    return false;
  }
  return true;
};

// Initialize Firebase with error handling
let app, auth, db;
try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Enable Firestore offline persistence
    // This can help with connection issues
    console.log('Firebase initialized successfully');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
  } else {
    throw new Error('Invalid Firebase configuration');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Firebase Config:', firebaseConfig);
  // You can show a user-friendly error message here
}

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
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD');

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
  const [editingAccount, setEditingAccount] = useState(null);
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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    account: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  // Recurring transaction states
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);

  // Loan states
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showLoanPaymentForm, setShowLoanPaymentForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Currency configuration
  const currencies = {
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' }
  };

  // Initialize auth listener
  useEffect(() => {
    if (!auth) {
      console.error('Firebase Auth not initialized');
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth,
      (user) => {
        setUser(user);
        setAuthLoading(false);
        if (user) loadUserData(user.uid);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthLoading(false);
        showNotification('Authentication error. Please refresh the page.', 'error');
      }
    );
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

  // Save currency preference
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // Load user data from Firestore
  const loadUserData = async (userId) => {
    if (!db) {
      console.error('Firestore not initialized');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading data for user:', userId);

      // Load accounts - always get fresh data
      const accountsSnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
      const accountsData = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accountsData);
      console.log('Loaded accounts:', accountsData.length);
      // Load transactions with real-time updates
      const transactionsQuery = query(
        collection(db, `users/${userId}/transactions`),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(transactionsQuery,
        (snapshot) => {
          const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(transactionsData);
          console.log('Loaded transactions:', transactionsData.length);
        },
        (error) => {
          console.error('Firestore real-time listener error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);

          if (error.code === 'permission-denied') {
            showNotification('Permission denied. Please check Firestore security rules.', 'error');
          } else if (error.code === 'unavailable') {
            showNotification('Firestore is unavailable. Please check your internet connection.', 'error');
          } else if (error.code === 'failed-precondition') {
            showNotification('Firestore indexes may need to be created. Check the console for details.', 'error');
          } else {
            showNotification('Error loading transactions: ' + error.message, 'error');
          }
        }
      );

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

  // Use recurring transactions hook
  const {
    recurringTransactions,
    loading: recurringLoading,
    pause: pauseRecurring,
    resume: resumeRecurring,
    remove: deleteRecurring
  } = useRecurringTransactions(user?.uid, (transaction) => {
    showNotification(`Auto-created: ${transaction.description}`, 'success');
    if (user) loadUserData(user.uid); // Reload to show new transaction
  });

  // Use loans hook
  const loansHook = useLoans(user?.uid);

  // Apply search and filters to transactions
  const filteredTransactions = useTransactionFilter(transactions, searchTerm, filters);

  // Calculate running balance for transactions (per account)
  const transactionsWithBalance = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // Group transactions by account
    const accountGroups = {};
    filteredTransactions.forEach(t => {
      if (!accountGroups[t.account]) {
        accountGroups[t.account] = [];
      }
      accountGroups[t.account].push(t);
    });

    // Calculate balance for each account separately
    const allTransactionsWithBalance = [];

    Object.keys(accountGroups).forEach(accountId => {
      const accountTransactions = accountGroups[accountId];
      const account = accounts.find(a => a.id === accountId);
      const currentAccountBalance = account ? account.balance : 0;

      // Sort by date (newest first for processing)
      const sorted = [...accountTransactions].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );

      // Start from current balance (for the newest transaction)
      let runningBalance = currentAccountBalance;

      // Process from newest to oldest
      sorted.forEach((t, index) => {
        // First transaction (newest) gets current balance
        allTransactionsWithBalance.push({
          ...t,
          balanceAfter: runningBalance
        });

        // Calculate balance before this transaction (for next older transaction)
        if (t.type === 'income' || t.type === 'loan') {
          runningBalance -= t.amount; // Remove income to get previous balance
        } else if (t.type === 'expense' || t.type === 'loan-payment') {
          runningBalance += t.amount; // Add back expense to get previous balance
        }
      });
    });

    // Sort all transactions by date (newest first) for display
    const result = allTransactionsWithBalance.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    return result;
  }, [filteredTransactions, accounts]);

  // Authentication handlers
  const handleAuth = async (e) => {
    e.preventDefault();

    if (!auth) {
      showNotification('Authentication service not initialized', 'error');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        // Create initial account for new users
        if (userCredential.user && db) {
          await addDoc(collection(db, `users/${userCredential.user.uid}/accounts`), {
            name: 'Main Account',
            type: 'checking',
            balance: 0,
            createdAt: serverTimestamp()
          });
        }
        showNotification('Account created successfully!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        showNotification('Logged in successfully!', 'success');
      }
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = 'Authentication failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      }
      showNotification(errorMessage, 'error');
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

    if (!user) {
      showNotification('Please log in to add an account', 'error');
      return;
    }

    if (!db) {
      showNotification('Database not initialized', 'error');
      return;
    }

    // Validate form inputs
    if (!accountForm.name.trim()) {
      showNotification('Please enter an account name', 'error');
      return;
    }

    const balance = parseFloat(accountForm.balance);
    if (isNaN(balance)) {
      showNotification('Please enter a valid balance', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingAccount) {
        // Update existing account
        await updateDoc(doc(db, `users/${user.uid}/accounts`, editingAccount.id), {
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: balance
        });
        console.log('Account updated:', editingAccount.id);
        showNotification('Account updated successfully!', 'success');
      } else {
        // Add new account
        const docRef = await addDoc(collection(db, `users/${user.uid}/accounts`), {
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: balance,
          createdAt: serverTimestamp()
        });
        console.log('Account created with ID:', docRef.id);
        showNotification('Account added successfully!', 'success');
      }

      await loadUserData(user.uid);
      setShowAccountForm(false);
      setEditingAccount(null);
      setAccountForm({ name: '', type: 'checking', balance: '' });
    } catch (error) {
      console.error('Error saving account:', error);
      showNotification('Error saving account: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async (accountId) => {
    if (!user) {
      showNotification('Please log in to delete an account', 'error');
      return;
    }

    if (!db) {
      showNotification('Database not initialized', 'error');
      return;
    }

    // Check if account has transactions
    const accountTransactions = transactions.filter(t => t.account === accountId);
    if (accountTransactions.length > 0) {
      const confirmDelete = window.confirm(
        `This account has ${accountTransactions.length} transaction(s). Deleting it will also delete all associated transactions. Are you sure?`
      );
      if (!confirmDelete) return;
    } else {
      if (!window.confirm('Are you sure you want to delete this account?')) return;
    }

    setLoading(true);
    try {
      // Delete all transactions associated with this account
      if (accountTransactions.length > 0) {
        const batch = [];
        for (const transaction of accountTransactions) {
          batch.push(deleteDoc(doc(db, `users/${user.uid}/transactions`, transaction.id)));
        }
        await Promise.all(batch);
        console.log(`Deleted ${accountTransactions.length} transactions`);
      }

      // Delete the account
      await deleteDoc(doc(db, `users/${user.uid}/accounts`, accountId));
      console.log('Account deleted:', accountId);

      await loadUserData(user.uid);
      showNotification('Account deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting account:', error);
      showNotification('Error deleting account: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Transaction management
  const handleAddTransaction = async (e) => {
    e.preventDefault();

    if (!user) {
      showNotification('Please log in to add a transaction', 'error');
      return;
    }

    if (!db) {
      showNotification('Database not initialized', 'error');
      return;
    }

    // Validate form inputs
    const amount = parseFloat(transactionForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    if (!transactionForm.description.trim()) {
      showNotification('Please enter a description', 'error');
      return;
    }

    if (!transactionForm.account) {
      showNotification('Please select an account', 'error');
      return;
    }

    if (transactionForm.type === 'expense' && !transactionForm.category) {
      showNotification('Please select a category', 'error');
      return;
    }

    if (transactionForm.type === 'income' && !transactionForm.incomeSource) {
      showNotification('Please select an income source', 'error');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        type: transactionForm.type,
        amount: amount,
        description: transactionForm.description.trim(),
        category: transactionForm.type === 'expense' ? transactionForm.category : 'Income',
        incomeSource: transactionForm.type === 'income' ? transactionForm.incomeSource : null,
        account: transactionForm.account,
        date: transactionForm.date,
        createdAt: serverTimestamp()
      };

      if (editingTransaction) {
        // When editing, we need to handle balance updates carefully
        const oldAmount = editingTransaction.amount;
        const newAmount = parseFloat(transactionForm.amount);
        const oldType = editingTransaction.type;
        const newType = transactionForm.type;
        const oldAccountId = editingTransaction.account;
        const newAccountId = transactionForm.account;

        // If the account changed, update both accounts
        if (oldAccountId !== newAccountId) {
          // Reverse the old transaction on the old account
          const oldAccount = accounts.find(acc => acc.id === oldAccountId);
          if (oldAccount) {
            const reverseAmount = oldType === 'income' ? -oldAmount : oldAmount;
            const newOldBalance = oldAccount.balance + reverseAmount;
            await updateDoc(doc(db, `users/${user.uid}/accounts`, oldAccountId), {
              balance: newOldBalance
            });
          }

          // Apply the new transaction to the new account
          const newAccount = accounts.find(acc => acc.id === newAccountId);
          if (newAccount) {
            const applyAmount = newType === 'income' ? newAmount : -newAmount;
            const newNewBalance = newAccount.balance + applyAmount;
            await updateDoc(doc(db, `users/${user.uid}/accounts`, newAccountId), {
              balance: newNewBalance
            });
          }
        } else {
          // Same account, just update the difference
          const account = accounts.find(acc => acc.id === oldAccountId);
          if (account) {
            // Calculate the net change
            const oldEffect = oldType === 'income' ? oldAmount : -oldAmount;
            const newEffect = newType === 'income' ? newAmount : -newAmount;
            const netChange = newEffect - oldEffect;
            const newBalance = account.balance + netChange;

            await updateDoc(doc(db, `users/${user.uid}/accounts`, oldAccountId), {
              balance: newBalance
            });
          }
        }

        // Update the transaction
        await updateDoc(doc(db, `users/${user.uid}/transactions`, editingTransaction.id), transactionData);
        showNotification('Transaction updated successfully!', 'success');
      } else {
        // Add new transaction
        await addDoc(collection(db, `users/${user.uid}/transactions`), transactionData);
        showNotification('Transaction added successfully!', 'success');

        // Update account balance for new transaction
        const account = accounts.find(acc => acc.id === transactionForm.account);
        if (account) {
          const balanceChange = transactionForm.type === 'income'
            ? parseFloat(transactionForm.amount)
            : -parseFloat(transactionForm.amount);
          const newBalance = account.balance + balanceChange;
          await updateDoc(doc(db, `users/${user.uid}/accounts`, account.id), {
            balance: newBalance
          });
        }
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
    if (!user) {
      showNotification('Please log in to delete a transaction', 'error');
      return;
    }

    if (!db) {
      showNotification('Database not initialized', 'error');
      return;
    }

    if (!transaction || !transaction.id) {
      showNotification('Invalid transaction', 'error');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Deleting transaction:', transaction.id);

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
        console.log('Updated account balance for:', account.name);
      }

      await loadUserData(user.uid);
      showNotification('Transaction deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('Error deleting transaction: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Budget management
  const handleUpdateBudgets = async () => {
    if (!user) {
      showNotification('Please log in to update budgets', 'error');
      return;
    }

    if (!db) {
      showNotification('Database not initialized', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating budgets:', budgetForm);

      let updatedCount = 0;
      for (const [category, limit] of Object.entries(budgetForm)) {
        const limitValue = parseFloat(limit);
        if (limit && limitValue > 0) {
          const budgetRef = doc(db, `users/${user.uid}/budgets`, category);
          await setDoc(budgetRef, {
            category,
            limit: limitValue,
            updatedAt: serverTimestamp()
          }, { merge: true });
          updatedCount++;
          console.log(`Updated budget for ${category}: $${limitValue}`);
        } else if (limit === '' || limitValue === 0) {
          // Remove budget if set to 0 or empty
          const budgetRef = doc(db, `users/${user.uid}/budgets`, category);
          try {
            await deleteDoc(budgetRef);
            console.log(`Removed budget for ${category}`);
          } catch (err) {
            // Budget might not exist, ignore
          }
        }
      }

      setBudgets(budgetForm);
      showNotification(`Budgets updated successfully! (${updatedCount} categories)`, 'success');
    } catch (error) {
      console.error('Error updating budgets:', error);
      showNotification('Error updating budgets: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recurring transaction handlers
  const handleAddRecurring = async (recurringData) => {
    if (!user) {
      showNotification('Please log in to create recurring transactions', 'error');
      return;
    }

    setLoading(true);
    try {
      await createRecurringTransaction(user.uid, recurringData);
      showNotification('Recurring transaction created successfully!', 'success');
      setShowRecurringForm(false);
      setEditingRecurring(null);
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      showNotification('Error creating recurring transaction: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecurring = async (recurringData) => {
    if (!user || !editingRecurring) return;

    setLoading(true);
    try {
      await updateRecurringTransaction(user.uid, editingRecurring.id, recurringData);
      showNotification('Recurring transaction updated successfully!', 'success');
      setShowRecurringForm(false);
      setEditingRecurring(null);
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      showNotification('Error updating recurring transaction: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecurring = async (recurringId) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }

    try {
      await deleteRecurring(recurringId);
      showNotification('Recurring transaction deleted successfully!', 'success');
    } catch (error) {
      showNotification('Error deleting recurring transaction: ' + error.message, 'error');
    }
  };

  // Loan handlers
  const handleAddLoan = async (loanData) => {
    if (!user) {
      showNotification('Please log in to add loans', 'error');
      return;
    }

    setLoading(true);
    try {
      await loansHook.addLoan(loanData);
      showNotification('Loan added successfully!', 'success');
      setShowLoanForm(false);
    } catch (error) {
      console.error('Error adding loan:', error);
      showNotification('Error adding loan: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanPayment = async (loanId, amount, date) => {
    if (!user) return;

    setLoading(true);
    try {
      await loansHook.makePayment(loanId, amount, date);
      showNotification('Payment recorded successfully!', 'success');
      setShowLoanPaymentForm(false);
      setSelectedLoan(null);
      // Reload user data to update account balance
      if (user) loadUserData(user.uid);
    } catch (error) {
      console.error('Error recording payment:', error);
      showNotification('Error recording payment: ' + error.message, 'error');
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
    // Calculate net worth using stored account balances (which include initial balances)
    const netWorth = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const currentDate = now.toISOString().substring(0, 10);

    // Get start of current week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

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

    // Weekly expenses (current week)
    const weeklyExpenses = transactions
      .filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfWeek && transactionDate <= now;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate average daily expense (last 30 days)
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

    // Calculate savings rate properly
    let savingsRate = 0;
    if (monthlyIncome > 0) {
      const monthlySavings = monthlyIncome - monthlyExpenses;
      savingsRate = (monthlySavings / monthlyIncome) * 100;
      // Ensure savings rate is between -100 and 100
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentMonthKey = now.toISOString().substring(0, 7);

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
    const chartData = Object.keys(dailyData)
      .sort()
      .map((dateKey, index) => ({
        day: dayLabels[index],
        date: dateKey,
        expense: parseFloat((dailyData[dateKey]?.expense || 0).toFixed(2)),
        income: parseFloat((dailyData[dateKey]?.income || 0).toFixed(2)),
        net: parseFloat(((dailyData[dateKey]?.income || 0) - (dailyData[dateKey]?.expense || 0)).toFixed(2))
      }));

    // Debug log to check data
    console.log('Daily Cash Flow Data for', currentMonthKey, ':', chartData);
    console.log('Transactions count:', transactions?.length || 0);

    return chartData;
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
    const currencyConfig = currencies[currency] || currencies.USD;
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  // Check Firebase configuration
  if (!auth || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Firebase is not properly configured. Please check your .env file.
            </p>
            <div className="text-left bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                Required environment variables:
              </p>
              <ul className="text-xs font-mono mt-2 space-y-1">
                <li className={firebaseConfig.apiKey ? 'text-green-600' : 'text-red-600'}>
                  {firebaseConfig.apiKey ? '✓' : '✗'} VITE_FIREBASE_API_KEY
                </li>
                <li className={firebaseConfig.authDomain ? 'text-green-600' : 'text-red-600'}>
                  {firebaseConfig.authDomain ? '✓' : '✗'} VITE_FIREBASE_AUTH_DOMAIN
                </li>
                <li className={firebaseConfig.projectId ? 'text-green-600' : 'text-red-600'}>
                  {firebaseConfig.projectId ? '✓' : '✗'} VITE_FIREBASE_PROJECT_ID
                </li>
                <li className={firebaseConfig.appId ? 'text-green-600' : 'text-red-600'}>
                  {firebaseConfig.appId ? '✓' : '✗'} VITE_FIREBASE_APP_ID
                </li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  required
                  minLength="6"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              className="w-full py-2.5 sm:py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Finance</h1>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  )}
                </button>

                {/* Currency Selector */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  title="Select Currency"
                >
                  {Object.entries(currencies).map(([code, config]) => (
                    <option key={code} value={code}>
                      {config.symbol} {code}
                    </option>
                  ))}
                </select>

                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{user.displayName || user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' :
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
          <div className="flex overflow-x-auto scrollbar-hide space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'overview', icon: Home, label: 'Overview' },
              { id: 'transactions', icon: Receipt, label: 'Transactions' },
              { id: 'accounts', icon: Wallet, label: 'Accounts' },
              { id: 'budgets', icon: Target, label: 'Budgets' },
              { id: 'recurring', icon: CalendarDays, label: 'Recurring' },
              { id: 'insights', icon: Brain, label: 'Insights' },
              { id: 'help', icon: HelpCircle, label: 'Help' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
              {/* Primary Metrics - Net Worth and Savings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-90">Total Net Worth</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(financialMetrics.netWorth)}
                      </p>
                      <p className="text-xs opacity-75 mt-2">
                        Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Wallet className="w-12 h-12 opacity-20" />
                  </div>
                </div>

                <div className={`bg-gradient-to-br rounded-xl p-6 shadow-lg text-white ${financialMetrics.savingsRate >= 0
                  ? 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700'
                  : 'from-red-500 to-red-600 dark:from-red-600 dark:to-red-700'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-90">Monthly Savings Rate</p>
                      <p className="text-3xl font-bold mt-2">
                        {financialMetrics.savingsRate >= 0 ? '+' : ''}{financialMetrics.savingsRate.toFixed(1)}%
                      </p>
                      <p className="text-xs opacity-75 mt-2">
                        {financialMetrics.monthlyIncome > 0
                          ? `${formatCurrency(Math.max(0, financialMetrics.monthlyIncome - financialMetrics.monthlyExpenses))} saved this month`
                          : 'No income this month'
                        }
                      </p>
                    </div>
                    <PiggyBank className="w-12 h-12 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Income and Expense Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(financialMetrics.monthlyIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {formatCurrency(financialMetrics.monthlyExpenses)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Expense Tracking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(financialMetrics.dailyExpenses)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      vs avg: {formatCurrency(financialMetrics.avgDailyExpense)}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <CalendarDays className="w-5 h-5 text-indigo-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">This Week</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(financialMetrics.weeklyExpenses)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Since Monday
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Burn Rate</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(financialMetrics.monthlyExpenses / 30)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Per day this month
                    </p>
                  </div>

                  {/* Loan Tracker Widget */}
                  <LoanTracker
                    loans={loansHook.activeLoans}
                    currency={currency}
                    onAddLoan={() => setShowLoanForm(true)}
                    onViewDetails={(loan) => {
                      if (loan) {
                        setSelectedLoan(loan);
                        setShowLoanPaymentForm(true);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Analytics Insights */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Financial Insights</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Daily Average</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1">
                      {formatCurrency(financialMetrics.avgDailyExpense)}
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Last 30 days</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Weekly Projection</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {formatCurrency(financialMetrics.avgDailyExpense * 7)}
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Based on avg</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Budget Days Left</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                      {financialMetrics.avgDailyExpense > 0
                        ? Math.max(0, Math.floor((financialMetrics.monthlyIncome - financialMetrics.monthlyExpenses) / financialMetrics.avgDailyExpense))
                        : '∞'
                      }
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">At current rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Monthly Projection</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1">
                      {formatCurrency(financialMetrics.avgDailyExpense * 30)}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Expected total</p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
                  <div className="h-64 sm:h-72 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {spendingByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Daily Cash Flow - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="h-64 sm:h-72 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySpendingData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="day"
                          stroke="#6b7280"
                          tick={{ fontSize: 10 }}
                          interval={Math.floor(monthlySpendingData.length / 15)}
                        />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                          labelFormatter={(label) => `Day ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - simplified for space */}
          {activeTab === 'transactions' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h2>
                <div className="flex items-center space-x-2">
                  <ExportButton
                    transactions={transactionsWithBalance}
                    accounts={accounts}
                    currency={currency}
                    dateRange={filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'All'} - ${filters.dateTo || 'Now'}` : 'All Time'}
                  />
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 touch-manipulation"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                    <span className="sm:hidden">Add Transaction</span>
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 space-y-4">
                <TransactionSearch onSearch={setSearchTerm} />
                <TransactionFilters
                  accounts={accounts}
                  onFilterChange={setFilters}
                  activeFilters={filters}
                />
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  {transactions.length === 0 ? (
                    <>
                      <p>No transactions yet</p>
                      <p className="text-sm mt-1">Add your first transaction to get started</p>
                    </>
                  ) : (
                    <>
                      <p>No transactions match your filters</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {/* Transaction Summary */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing: <span className="font-semibold">{filteredTransactions.length}</span> of <span className="font-semibold">{transactions.length}</span> transactions
                      {filteredTransactions.length > 20 && (
                        <span className="ml-2 text-xs">(Scroll to see all)</span>
                      )}
                    </p>
                  </div>

                  {/* Transaction List with Scroll */}
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {transactionsWithBalance.map((t) => {
                      const account = accounts.find(acc => acc.id === t.account);
                      return (
                        <div key={t.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors gap-2 sm:gap-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {new Date(t.date).toLocaleDateString()} • {t.category || t.incomeSource}
                              <span className="hidden sm:inline">{account && ` • ${account.name}`}</span>
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                            <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                            {/* Balance Column */}
                            <div className="text-right min-w-[100px] sm:min-w-[120px] border-l border-gray-300 dark:border-gray-600 pl-2 sm:pl-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Bal. After</p>
                              <p className={`font-bold text-sm ${t.balanceAfter >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(t.balanceAfter)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingTransaction(t);
                                  setTransactionForm({
                                    type: t.type,
                                    amount: t.amount.toString(),
                                    description: t.description,
                                    category: t.category || '',
                                    incomeSource: t.incomeSource || '',
                                    account: t.account,
                                    date: t.date
                                  });
                                  setShowTransactionForm(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 p-2 sm:p-1 touch-manipulation"
                                title="Edit transaction"
                              >
                                <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="text-red-500 hover:text-red-700 p-2 sm:p-1 touch-manipulation"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
              {accounts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No accounts yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first account to start tracking finances</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => {
                    const accountTransactions = transactions.filter(t => t.account === account.id);
                    const income = accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
                    const expenses = accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Use the stored balance which includes initial balance + all transaction effects
                    const displayBalance = account.balance || 0;

                    // The "Net" shown below is just income - expenses from transactions
                    const transactionNet = income - expenses;

                    return (
                      <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <button
                              onClick={() => {
                                setEditingAccount(account);
                                setAccountForm({
                                  name: account.name,
                                  type: account.type,
                                  balance: account.balance.toString() // Use stored balance for edit form
                                });
                                setShowAccountForm(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                              title="Edit account"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(displayBalance)}
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Income:</span>
                            <span className="text-green-600 dark:text-green-400">+{formatCurrency(income)}</span>
                          </div>
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Expenses:</span>
                            <span className="text-red-600 dark:text-red-400">-{formatCurrency(expenses)}</span>
                          </div>
                          <div className="flex justify-between mt-1 text-xs font-medium pt-1 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-300">Net:</span>
                            <span className={transactionNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {formatCurrency(transactionNet)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

          {activeTab === 'recurring' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recurring Transactions</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Automate your regular bills and income
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRecurring(null);
                    setShowRecurringForm(true);
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 w-full sm:w-auto touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Recurring</span>
                </button>
              </div>

              {recurringLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <RecurringTransactionList
                  recurringTransactions={recurringTransactions}
                  onEdit={(recurring) => {
                    setEditingRecurring(recurring);
                    setShowRecurringForm(true);
                  }}
                  onDelete={handleDeleteRecurring}
                  onPause={pauseRecurring}
                  onResume={resumeRecurring}
                  currency={currency}
                />
              )}
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

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">PocketPulse Guide</h2>
                    <p className="text-purple-100 mt-1">Learn how to use all features and understand your financial metrics</p>
                  </div>
                </div>
              </div>

              {/* Quick Start Guide */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Start Guide
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-start">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Create Your Accounts</p>
                      <p>Go to Accounts tab → Click "Add" → Enter account name, type, and current balance</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Add Transactions</p>
                      <p>Go to Transactions tab → Click "Add" → Choose income/expense and fill details</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Set Budgets</p>
                      <p>Go to Budgets tab → Enter monthly limits for each category → Click "Save"</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 text-xs font-bold">4</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Monitor Overview</p>
                      <p>Check your financial health, spending patterns, and insights on the Overview tab</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Understanding Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                  Understanding Your Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Net Worth</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total balance across all your accounts. Shows your overall financial position.</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Savings Rate</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Percentage of income saved. Formula: (Income - Expenses) ÷ Income × 100</p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Today's Expenses</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total amount spent today. Compare with daily average to track spending habits.</p>
                    </div>
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">This Week</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total expenses from Monday to today. Helps track weekly spending patterns.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Burn Rate</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Daily spending rate this month. Shows how fast you're spending money.</p>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Budget Days Left</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Days until budget exhaustion at current spending rate. Helps pace spending.</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Daily Average</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average daily spending over last 30 days. Baseline for comparison.</p>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">Monthly Projection</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expected monthly total based on current spending patterns.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Types */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-purple-500" />
                    Account Types
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <CreditCard className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Checking</p>
                        <p className="text-gray-600 dark:text-gray-400">Daily transaction account</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <PiggyBank className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Savings</p>
                        <p className="text-gray-600 dark:text-gray-400">Long-term savings account</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CreditCard className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Credit</p>
                        <p className="text-gray-600 dark:text-gray-400">Credit card account (negative balance)</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Investment</p>
                        <p className="text-gray-600 dark:text-gray-400">Investment portfolio account</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-green-500" />
                    Categories & Sources
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Expense Categories:</p>
                      <p className="text-gray-600 dark:text-gray-400">Groceries, Rent, Utilities, Transportation, Entertainment, Healthcare, Education, Shopping, Dining, Other</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Income Sources:</p>
                      <p className="text-gray-600 dark:text-gray-400">Salary, Freelance, Investment, Business, Other</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips & Tricks */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                  Pro Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Use the currency switcher in the header to view amounts in different currencies</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Click on any transaction to edit it quickly</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Set realistic budgets based on your spending history</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Use AI Insights for personalized financial advice</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Dark mode is available - click the moon/sun icon</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">Hover over accounts to see the delete option</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-gray-500">⌨️</span>
                  <span className="ml-2">Keyboard Shortcuts</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Toggle Dark Mode</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Click Sun/Moon</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Change Currency</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Currency Dropdown</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Add Transaction</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Transactions → Add</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-700 dark:text-gray-300">Sign Out</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Click Logout Icon</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Form Modal */}
          {showTransactionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </h3>
                  <button
                    onClick={() => {
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
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                      className={`px-3 py-2 rounded-lg border ${transactionForm.type === 'expense' ? 'bg-red-50 border-red-300' : 'border-gray-300'
                        }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                      className={`px-3 py-2 rounded-lg border ${transactionForm.type === 'income' ? 'bg-green-50 border-green-300' : 'border-gray-300'
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
                    {loading ? 'Processing...' : (editingTransaction ? 'Update Transaction' : 'Add Transaction')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Account Form Modal */}
          {showAccountForm && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingAccount ? 'Edit Account' : 'Add Account'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAccountForm(false);
                      setEditingAccount(null);
                      setAccountForm({ name: '', type: 'checking', balance: '' });
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
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
                    placeholder={editingAccount ? "Current Balance" : "Initial Balance"}
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Saving...' : (editingAccount ? 'Update Account' : 'Save Account')}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Loan Form Modal */}
      <LoanForm
        isOpen={showLoanForm}
        onClose={() => setShowLoanForm(false)}
        onSubmit={handleAddLoan}
        accounts={accounts}
      />

      {/* Loan Payment Form Modal */}
      <LoanPaymentForm
        isOpen={showLoanPaymentForm}
        onClose={() => {
          setShowLoanPaymentForm(false);
          setSelectedLoan(null);
        }}
        onSubmit={handleLoanPayment}
        loan={selectedLoan}
      />

      {/* Recurring Transaction Form Modal */}
      <RecurringTransactionForm
        isOpen={showRecurringForm}
        onClose={() => {
          setShowRecurringForm(false);
          setEditingRecurring(null);
        }}
        onSubmit={editingRecurring ? handleEditRecurring : handleAddRecurring}
        accounts={accounts}
        initialData={editingRecurring}
      />
    </div>
  );
}

export default App;
