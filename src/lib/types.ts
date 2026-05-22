// ============================================================
// Core Data Types for Cashflow Tracker
// ============================================================

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string; // Category ID
  description: string;
  date: string; // ISO date string (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji or Lucide icon name
  color: string; // Hex color
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  order: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
}

export interface AppSettings {
  defaultCurrency: string;
  enabledCurrencies: string[];
  theme: 'light' | 'dark' | 'system';
}

// Export/Import types
export interface AppData {
  version: string;
  exportedAt: string;
  encrypted: boolean;
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
}

export interface EncryptedExport {
  version: string;
  exportedAt: string;
  encrypted: true;
  salt: string;
  iv: string;
  data: string;
}

// Dashboard aggregation types
export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
}

export interface MonthlyData {
  month: string; // 'YYYY-MM'
  label: string; // 'Jan 2026'
  income: number;
  expense: number;
  net: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

// Form types
export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
  notes?: string;
  tags?: string[];
}

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

// Filter types
export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'income' | 'expense' | 'all';
  category?: string;
  currency?: string;
  search?: string;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}
