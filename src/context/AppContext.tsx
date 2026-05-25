'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Transaction, Category, AppSettings, TransactionFilters, RecurringTransaction, Budget } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  initializeDatabase,
  getAllTransactions,
  getAllCategories,
  getSettings,
  addTransaction as dbAddTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
  deleteMultipleTransactions as dbDeleteMultiple,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  updateSettings as dbUpdateSettings,
  getAllRecurringTransactions,
  addRecurringTransaction as dbAddRecurringTransaction,
  updateRecurringTransaction as dbUpdateRecurringTransaction,
  deleteRecurringTransaction as dbDeleteRecurringTransaction,
  getAllBudgets,
  addBudget as dbAddBudget,
  updateBudget as dbUpdateBudget,
  deleteBudget as dbDeleteBudget,
} from '@/lib/db';
import { generateDueRecurringTransactions } from '@/lib/recurring';
import { generateId, getToday } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { syncDatabase, debouncedSync } from '@/lib/sync';

// ============================================================
// State Types
// ============================================================

interface UserProfile {
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface AppState {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  budgets: Budget[];
  settings: AppSettings;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  sidebarOpen: boolean;
  toasts: Toast[];
  lastSyncTime: string | null;
  isSyncing: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE'; payload: { transactions: Transaction[]; recurringTransactions: RecurringTransaction[]; categories: Category[]; budgets: Budget[]; settings: AppSettings } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'DELETE_TRANSACTIONS'; payload: string[] }
  | { type: 'SET_RECURRING'; payload: RecurringTransaction[] }
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: { id: string; updates: Partial<RecurringTransaction> } }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; updates: Partial<Category> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: { id: string; updates: Partial<Budget> } }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: { isSyncing?: boolean; lastSyncTime?: string } };

// ============================================================
// Reducer
// ============================================================

const initialState: AppState = {
  transactions: [],
  recurringTransactions: [],
  categories: [],
  budgets: [],
  settings: DEFAULT_SETTINGS,
  userProfile: null,
  isLoading: true,
  isInitialized: false,
  sidebarOpen: false,
  toasts: [],
  lastSyncTime: typeof window !== 'undefined' ? localStorage.getItem('cashflow_last_sync') : null,
  isSyncing: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'INITIALIZE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        isInitialized: true,
      };

    case 'SET_SYNC_STATUS':
      return {
        ...state,
        ...(action.payload.isSyncing !== undefined && { isSyncing: action.payload.isSyncing }),
        ...(action.payload.lastSyncTime !== undefined && { lastSyncTime: action.payload.lastSyncTime }),
      };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };

    case 'DELETE_TRANSACTIONS':
      return {
        ...state,
        transactions: state.transactions.filter(t => !action.payload.includes(t.id)),
      };

    case 'SET_RECURRING':
      return { ...state, recurringTransactions: action.payload };

    case 'ADD_RECURRING':
      return {
        ...state,
        recurringTransactions: [...state.recurringTransactions, action.payload],
      };

    case 'UPDATE_RECURRING':
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.map(rt =>
          rt.id === action.payload.id ? { ...rt, ...action.payload.updates } : rt
        ),
      };

    case 'DELETE_RECURRING':
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.filter(rt => rt.id !== action.payload),
      };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      };

    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };

    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };

    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id === action.payload.id ? { ...b, ...action.payload.updates } : b
        ),
      };

    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };

    case 'SET_PROFILE':
      return { ...state, userProfile: action.payload };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface AppContextType {
  state: AppState;
  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  // Recurring actions
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  // Category actions
  addCategory: (data: Omit<Category, 'id' | 'isDefault' | 'order'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Budget actions
  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  // UI actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  triggerManualSync: () => Promise<void>;
  // Data refresh
  refreshData: () => Promise<void>;
  // Filter helpers
  getFilteredTransactions: (filters: TransactionFilters) => Transaction[];
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const toastTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Ref to hold refreshData to avoid stale closure in init useEffect
  const refreshDataRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Initialize database and load data
  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        await generateDueRecurringTransactions();
        const [transactions, recurringTransactions, categories, budgets, settings] = await Promise.all([
          getAllTransactions(),
          getAllRecurringTransactions(),
          getAllCategories(),
          getAllBudgets(),
          getSettings(),
        ]);
        dispatch({ type: 'INITIALIZE', payload: { transactions, recurringTransactions, categories, budgets, settings } });
        
        // Background sync with Supabase
        syncDatabase().then(() => {
          // Refresh context data if sync brought new items
          refreshDataRef.current();
        }).catch(err => console.error('Background sync error', err));

        // Fetch user profile and cache in context
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
            dispatch({
              type: 'SET_PROFILE',
              payload: {
                email: user.email || '',
                fullName: profile?.full_name || '',
                avatarUrl: profile?.avatar_url || '',
              },
            });
          }
        } catch (profileErr) {
          console.error('Failed to load profile:', profileErr);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  // Apply theme
  useEffect(() => {
    if (!state.isInitialized) return;
    const theme = state.settings.theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [state.settings.theme, state.isInitialized]);

  // Cleanup toast timers
  useEffect(() => {
    return () => {
      toastTimerRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = generateId();
    dispatch({ type: 'ADD_TOAST', payload: { id, type, message } });
    const timer = setTimeout(() => {
      removeToast(id);
    }, 4000);
    toastTimerRef.current.set(id, timer);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
    if (toastTimerRef.current.has(id)) {
      clearTimeout(toastTimerRef.current.get(id));
      toastTimerRef.current.delete(id);
    }
  }, []);

  const triggerManualSync = useCallback(async () => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: true } });
    
    const result = await syncDatabase();
    
    if (result.success && result.timestamp) {
      localStorage.setItem('cashflow_last_sync', result.timestamp);
      dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: false, lastSyncTime: result.timestamp } });
      showToast('success', 'Sinkronisasi data berhasil');
      await refreshData();
    } else {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: false } });
      showToast('error', result.error || 'Sinkronisasi gagal');
    }
  }, [showToast]);

  const refreshData = useCallback(async () => {
    await generateDueRecurringTransactions();
    const [transactions, recurringTransactions, categories, budgets, settings] = await Promise.all([
      getAllTransactions(),
      getAllRecurringTransactions(),
      getAllCategories(),
      getAllBudgets(),
      getSettings(),
    ]);
    dispatch({ type: 'INITIALIZE', payload: { transactions, recurringTransactions, categories, budgets, settings } });
  }, []);

  // Keep refreshDataRef in sync
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await dbAddTransaction(transaction);
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    showToast('success', 'Transaksi berhasil ditambahkan');
    debouncedSync();
  }, [showToast]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await dbUpdateTransaction(id, updates);
    dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates: { ...updates, updatedAt: new Date().toISOString() } } });
    showToast('success', 'Transaksi berhasil diperbarui');
    debouncedSync();
  }, [showToast]);

  const deleteTransaction = useCallback(async (id: string) => {
    await dbDeleteTransaction(id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    showToast('success', 'Transaksi berhasil dihapus');
    debouncedSync();
  }, [showToast]);

  const deleteTransactions = useCallback(async (ids: string[]) => {
    await dbDeleteMultiple(ids);
    dispatch({ type: 'DELETE_TRANSACTIONS', payload: ids });
    showToast('success', `${ids.length} transaksi berhasil dihapus`);
    debouncedSync();
  }, [showToast]);

  const addRecurringTransaction = useCallback(async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const recurringTx: RecurringTransaction = {
      ...data,
      id: `rt-${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    await dbAddRecurringTransaction(recurringTx);
    dispatch({ type: 'ADD_RECURRING', payload: recurringTx });
    showToast('success', 'Transaksi berulang berhasil ditambahkan');
    await refreshData(); // So the newly generated transactions are picked up if any
    debouncedSync();
  }, [showToast, refreshData]);

  const updateRecurringTransaction = useCallback(async (id: string, updates: Partial<RecurringTransaction>) => {
    await dbUpdateRecurringTransaction(id, updates);
    dispatch({ type: 'UPDATE_RECURRING', payload: { id, updates: { ...updates, updatedAt: new Date().toISOString() } } });
    showToast('success', 'Transaksi berulang berhasil diperbarui');
    await refreshData();
    debouncedSync();
  }, [showToast, refreshData]);

  const deleteRecurringTransaction = useCallback(async (id: string) => {
    await dbDeleteRecurringTransaction(id);
    dispatch({ type: 'DELETE_RECURRING', payload: id });
    showToast('success', 'Transaksi berulang berhasil dihapus');
    debouncedSync();
  }, [showToast]);

  const addCategory = useCallback(async (data: Omit<Category, 'id' | 'isDefault' | 'order'>) => {
    const category: Category = {
      ...data,
      id: `custom-${generateId()}`,
      isDefault: false,
      order: state.categories.length,
    };
    await dbAddCategory(category);
    dispatch({ type: 'ADD_CATEGORY', payload: category });
    showToast('success', 'Kategori berhasil ditambahkan');
    debouncedSync();
  }, [state.categories.length, showToast]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    await dbUpdateCategory(id, updates);
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    showToast('success', 'Kategori berhasil diperbarui');
    debouncedSync();
  }, [showToast]);

  const deleteCategory = useCallback(async (id: string) => {
    await dbDeleteCategory(id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    showToast('success', 'Kategori berhasil dihapus');
    debouncedSync();
  }, [showToast]);

  const addBudget = useCallback(async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const budget: Budget = {
      ...data,
      id: `budget-${generateId()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbAddBudget(budget);
    dispatch({ type: 'ADD_BUDGET', payload: budget });
    showToast('success', 'Anggaran berhasil ditambahkan');
    debouncedSync();
  }, [showToast]);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    await dbUpdateBudget(id, updates);
    dispatch({ type: 'UPDATE_BUDGET', payload: { id, updates: { ...updates, updatedAt: new Date().toISOString() } } });
    showToast('success', 'Anggaran berhasil diperbarui');
    debouncedSync();
  }, [showToast]);

  const deleteBudget = useCallback(async (id: string) => {
    await dbDeleteBudget(id);
    dispatch({ type: 'DELETE_BUDGET', payload: id });
    showToast('success', 'Anggaran berhasil dihapus');
    debouncedSync();
  }, [showToast]);

  const updateSettingsAction = useCallback(async (updates: Partial<AppSettings>) => {
    await dbUpdateSettings(updates);
    dispatch({ type: 'SET_SETTINGS', payload: updates });
    showToast('success', 'Pengaturan berhasil disimpan');
    debouncedSync();
  }, [showToast]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebar = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR', payload: open });
  }, []);

  const getFilteredTransactions = useCallback((filters: TransactionFilters): Transaction[] => {
    let filtered = [...state.transactions];

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.currency) {
      filtered = filtered.filter(t => t.currency === filters.currency);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => t.date <= filters.dateTo!);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.notes?.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'date':
        default:
          cmp = a.date.localeCompare(b.date);
          break;
      }
      return filters.sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [state.transactions]);

  const contextValue: AppContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    updateSettings: updateSettingsAction,
    toggleSidebar,
    setSidebar,
    showToast,
    removeToast,
    triggerManualSync,
    refreshData,
    getFilteredTransactions,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
