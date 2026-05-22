'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Transaction, Category, AppSettings, TransactionFilters } from '@/lib/types';
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
} from '@/lib/db';
import { generateId, getToday } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';

// ============================================================
// State Types
// ============================================================

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  isLoading: boolean;
  isInitialized: boolean;
  sidebarOpen: boolean;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE'; payload: { transactions: Transaction[]; categories: Category[]; settings: AppSettings } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'DELETE_TRANSACTIONS'; payload: string[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; updates: Partial<Category> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string };

// ============================================================
// Reducer
// ============================================================

const initialState: AppState = {
  transactions: [],
  categories: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isInitialized: false,
  sidebarOpen: false,
  toasts: [],
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

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };

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
  // Category actions
  addCategory: (data: Omit<Category, 'id' | 'isDefault' | 'order'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  // UI actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  showToast: (type: Toast['type'], message: string) => void;
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

  // Initialize database and load data
  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        const [transactions, categories, settings] = await Promise.all([
          getAllTransactions(),
          getAllCategories(),
          getSettings(),
        ]);
        dispatch({ type: 'INITIALIZE', payload: { transactions, categories, settings } });
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
      dispatch({ type: 'REMOVE_TOAST', payload: id });
      toastTimerRef.current.delete(id);
    }, 4000);
    toastTimerRef.current.set(id, timer);
  }, []);

  const refreshData = useCallback(async () => {
    const [transactions, categories, settings] = await Promise.all([
      getAllTransactions(),
      getAllCategories(),
      getSettings(),
    ]);
    dispatch({ type: 'INITIALIZE', payload: { transactions, categories, settings } });
  }, []);

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
  }, [showToast]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await dbUpdateTransaction(id, updates);
    dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates: { ...updates, updatedAt: new Date().toISOString() } } });
    showToast('success', 'Transaksi berhasil diperbarui');
  }, [showToast]);

  const deleteTransaction = useCallback(async (id: string) => {
    await dbDeleteTransaction(id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    showToast('success', 'Transaksi berhasil dihapus');
  }, [showToast]);

  const deleteTransactions = useCallback(async (ids: string[]) => {
    await dbDeleteMultiple(ids);
    dispatch({ type: 'DELETE_TRANSACTIONS', payload: ids });
    showToast('success', `${ids.length} transaksi berhasil dihapus`);
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
  }, [state.categories.length, showToast]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    await dbUpdateCategory(id, updates);
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    showToast('success', 'Kategori berhasil diperbarui');
  }, [showToast]);

  const deleteCategory = useCallback(async (id: string) => {
    await dbDeleteCategory(id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    showToast('success', 'Kategori berhasil dihapus');
  }, [showToast]);

  const updateSettingsAction = useCallback(async (updates: Partial<AppSettings>) => {
    await dbUpdateSettings(updates);
    dispatch({ type: 'SET_SETTINGS', payload: updates });
    showToast('success', 'Pengaturan berhasil disimpan');
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
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings: updateSettingsAction,
    toggleSidebar,
    setSidebar,
    showToast,
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
