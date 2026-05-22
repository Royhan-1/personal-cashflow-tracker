import { Category, CurrencyConfig, AppSettings } from './types';

// ============================================================
// Default Categories
// ============================================================

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc-salary', name: 'Gaji', icon: '💼', color: '#00d2d3', type: 'income', isDefault: true, order: 0 },
  { id: 'inc-freelance', name: 'Freelance', icon: '💻', color: '#48dbfb', type: 'income', isDefault: true, order: 1 },
  { id: 'inc-gift', name: 'Hadiah', icon: '🎁', color: '#ff9ff3', type: 'income', isDefault: true, order: 2 },
  { id: 'inc-investment', name: 'Investasi', icon: '📈', color: '#feca57', type: 'income', isDefault: true, order: 3 },
  { id: 'inc-other', name: 'Lainnya', icon: '💵', color: '#54a0ff', type: 'income', isDefault: true, order: 4 },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-food', name: 'Makanan & Minuman', icon: '🍔', color: '#ff6b6b', type: 'expense', isDefault: true, order: 0 },
  { id: 'exp-transport', name: 'Transportasi', icon: '🚗', color: '#ff9f43', type: 'expense', isDefault: true, order: 1 },
  { id: 'exp-housing', name: 'Rumah/Sewa', icon: '🏠', color: '#ee5a24', type: 'expense', isDefault: true, order: 2 },
  { id: 'exp-shopping', name: 'Belanja', icon: '🛒', color: '#f368e0', type: 'expense', isDefault: true, order: 3 },
  { id: 'exp-utilities', name: 'Utilitas', icon: '💡', color: '#feca57', type: 'expense', isDefault: true, order: 4 },
  { id: 'exp-internet', name: 'Internet & Telko', icon: '📱', color: '#48dbfb', type: 'expense', isDefault: true, order: 5 },
  { id: 'exp-health', name: 'Kesehatan', icon: '🏥', color: '#00d2d3', type: 'expense', isDefault: true, order: 6 },
  { id: 'exp-entertainment', name: 'Hiburan', icon: '🎮', color: '#6c5ce7', type: 'expense', isDefault: true, order: 7 },
  { id: 'exp-education', name: 'Pendidikan', icon: '📚', color: '#54a0ff', type: 'expense', isDefault: true, order: 8 },
  { id: 'exp-travel', name: 'Travel', icon: '✈️', color: '#1dd1a1', type: 'expense', isDefault: true, order: 9 },
  { id: 'exp-debt', name: 'Cicilan/Hutang', icon: '💳', color: '#c44569', type: 'expense', isDefault: true, order: 10 },
  { id: 'exp-other', name: 'Lainnya', icon: '📦', color: '#8395a7', type: 'expense', isDefault: true, order: 11 },
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

// ============================================================
// Supported Currencies
// ============================================================

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', decimalPlaces: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimalPlaces: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimalPlaces: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimalPlaces: 0 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimalPlaces: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimalPlaces: 2 },
];

export const DEFAULT_CURRENCY = 'IDR';

// ============================================================
// Default Settings
// ============================================================

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: DEFAULT_CURRENCY,
  enabledCurrencies: ['IDR', 'USD'],
  theme: 'dark',
};

// ============================================================
// App Constants
// ============================================================

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'CashFlow Tracker';
export const DB_NAME = 'cashflow-tracker-db';

// Chart colors
export const CHART_COLORS = {
  income: '#00d2d3',
  expense: '#ff6b6b',
  net: '#6c5ce7',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  gridLineDark: 'rgba(255, 255, 255, 0.06)',
  gridLineLight: 'rgba(0, 0, 0, 0.08)',
};

// Navigation items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/transactions', label: 'Transaksi', icon: 'ArrowLeftRight' },
  { path: '/recurring', label: 'Berulang', icon: 'Repeat' },
  { path: '/budgets', label: 'Anggaran', icon: 'Target' },
  { path: '/reports', label: 'Laporan', icon: 'BarChart3' },
  { path: '/settings', label: 'Pengaturan', icon: 'Settings' },
] as const;

// Available emoji icons for custom categories
export const CATEGORY_ICONS = [
  '💼', '💻', '🎁', '📈', '💵', '🍔', '🚗', '🏠', '🛒', '💡',
  '📱', '🏥', '🎮', '📚', '✈️', '💳', '📦', '🎵', '🏋️', '🐾',
  '👗', '💄', '🍕', '☕', '🎬', '🏦', '🔧', '🌐', '📮', '🎯',
];

// Available colors for custom categories
export const CATEGORY_COLORS = [
  '#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#00d2d3',
  '#48dbfb', '#54a0ff', '#6c5ce7', '#f368e0', '#ff9ff3',
  '#ee5a24', '#c44569', '#8395a7', '#2ed573', '#ff4757',
];
