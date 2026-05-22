import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SUPPORTED_CURRENCIES } from './constants';
import { Transaction, MonthlyData, CategorySummary, DashboardSummary } from './types';
import { Category } from './types';

// ============================================================
// Currency Formatting
// ============================================================

export function formatCurrency(amount: number, currencyCode: string = 'IDR'): string {
  const config = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!config) {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

export function formatCompactCurrency(amount: number, currencyCode: string = 'IDR'): string {
  const config = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const locale = config?.locale || 'id-ID';

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}

// ============================================================
// Date Formatting
// ============================================================

export function formatDate(dateStr: string, formatStr: string = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), formatStr, { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM');
}

export function formatMonthYear(dateStr: string): string {
  return formatDate(dateStr, 'MMMM yyyy');
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

// ============================================================
// Data Aggregation
// ============================================================

export function calculateDashboardSummary(
  transactions: Transaction[],
  currency: string,
  month?: string // 'YYYY-MM' format
): DashboardSummary {
  let filtered = transactions.filter(t => t.currency === currency);

  if (month) {
    filtered = filtered.filter(t => t.date.startsWith(month));
  }

  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netCashflow: totalIncome - totalExpense,
    transactionCount: filtered.length,
  };
}

export function getMonthlyData(
  transactions: Transaction[],
  currency: string,
  monthsBack: number = 6
): MonthlyData[] {
  const data: MonthlyData[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthLabel = format(monthDate, 'MMM yyyy', { locale: idLocale });

    const monthTransactions = transactions.filter(t => {
      if (t.currency !== currency) return false;
      try {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    data.push({
      month: monthKey,
      label: monthLabel,
      income,
      expense,
      net: income - expense,
    });
  }

  return data;
}

export function getCategorySummary(
  transactions: Transaction[],
  categories: Category[],
  currency: string,
  type: 'income' | 'expense',
  month?: string
): CategorySummary[] {
  let filtered = transactions.filter(t => t.currency === currency && t.type === type);

  if (month) {
    filtered = filtered.filter(t => t.date.startsWith(month));
  }

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, number>();
  const countMap = new Map<string, number>();

  filtered.forEach(t => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    countMap.set(t.category, (countMap.get(t.category) || 0) + 1);
  });

  const summaries: CategorySummary[] = [];

  categoryMap.forEach((amount, catId) => {
    const category = categories.find(c => c.id === catId);
    summaries.push({
      categoryId: catId,
      categoryName: category?.name || 'Unknown',
      categoryIcon: category?.icon || '📦',
      categoryColor: category?.color || '#8395a7',
      total: amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      count: countMap.get(catId) || 0,
    });
  });

  // Sort by total descending
  summaries.sort((a, b) => b.total - a.total);

  return summaries;
}

// ============================================================
// Utility Helpers
// ============================================================

export function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}
