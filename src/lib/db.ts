import Dexie, { type EntityTable } from 'dexie';
import { Transaction, Category, AppSettings, RecurringTransaction, Budget, DeletedRecord } from './types';
import { ALL_DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DB_NAME } from './constants';

// ============================================================
// Database Schema
// ============================================================

const db = new Dexie(DB_NAME) as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  categories: EntityTable<Category, 'id'>;
  settings: EntityTable<AppSettings & { id: string }, 'id'>;
  recurringTransactions: EntityTable<RecurringTransaction, 'id'>;
  budgets: EntityTable<Budget, 'id'>;
  deletedRecords: EntityTable<DeletedRecord, 'id'>;
};

db.version(1).stores({
  transactions: 'id, type, category, currency, date, createdAt',
  categories: 'id, type, isDefault, order',
  settings: 'id',
});

db.version(2).stores({
  recurringTransactions: 'id, type, isActive, startDate',
});

db.version(3).stores({
  budgets: 'id, categoryId, currency',
});

db.version(4).stores({
  deletedRecords: 'id, tableName',
});

// ============================================================
// Deletion Tracking
// ============================================================

export async function logDeletion(id: string, tableName: DeletedRecord['tableName']) {
  await db.deletedRecords.put({
    id,
    tableName,
    deletedAt: new Date().toISOString()
  });
}

export async function getDeletedRecords() {
  return db.deletedRecords.toArray();
}

export async function clearDeletedRecord(id: string) {
  await db.deletedRecords.delete(id);
}

// ============================================================
// Database Initialization
// ============================================================

export async function initializeDatabase(): Promise<void> {
  // Seed default categories if none exist
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(ALL_DEFAULT_CATEGORIES);
  }

  // Seed default settings if none exist
  const settings = await db.settings.get('app-settings');
  if (!settings) {
    await db.settings.add({ id: 'app-settings', ...DEFAULT_SETTINGS });
  }
}

// ============================================================
// Transaction CRUD
// ============================================================

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').reverse().toArray();
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function addTransaction(transaction: Transaction): Promise<string> {
  return db.transactions.add(transaction);
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<number> {
  return db.transactions.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', db.transactions, db.deletedRecords, async () => {
    await db.transactions.delete(id);
    await logDeletion(id, 'transactions');
  });
}

export async function deleteMultipleTransactions(ids: string[]): Promise<void> {
  await db.transaction('rw', db.transactions, db.deletedRecords, async () => {
    await db.transactions.bulkDelete(ids);
    for (const id of ids) {
      await logDeletion(id, 'transactions');
    }
  });
}

export async function getTransactionCount(): Promise<number> {
  return db.transactions.count();
}

// ============================================================
// Recurring Transaction CRUD
// ============================================================

export async function getAllRecurringTransactions(): Promise<RecurringTransaction[]> {
  return db.recurringTransactions.toArray();
}

export async function addRecurringTransaction(transaction: RecurringTransaction): Promise<string> {
  return db.recurringTransactions.add(transaction);
}

export async function updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>): Promise<number> {
  return db.recurringTransactions.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  await db.transaction('rw', db.recurringTransactions, db.deletedRecords, async () => {
    await db.recurringTransactions.delete(id);
    await logDeletion(id, 'recurring_transactions');
  });
}

// ============================================================
// Category CRUD
// ============================================================

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray();
}

export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
  return db.categories
    .where('type')
    .anyOf([type, 'both'])
    .sortBy('order');
}

export async function addCategory(category: Category): Promise<string> {
  return db.categories.add(category);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<number> {
  return db.categories.update(id, updates);
}

export async function deleteCategory(id: string): Promise<void> {
  return db.categories.delete(id);
}

// ============================================================
// Budget CRUD
// ============================================================

export async function getAllBudgets(): Promise<Budget[]> {
  return db.budgets.toArray();
}

export async function getBudgetByCategory(categoryId: string): Promise<Budget | undefined> {
  return db.budgets.where('categoryId').equals(categoryId).first();
}

export async function addBudget(budget: Budget): Promise<string> {
  return db.budgets.add(budget);
}

export async function updateBudget(id: string, updates: Partial<Budget>): Promise<number> {
  return db.budgets.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteBudget(id: string): Promise<void> {
  await db.transaction('rw', db.budgets, db.deletedRecords, async () => {
    await db.budgets.delete(id);
    await logDeletion(id, 'budgets');
  });
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app-settings');
  if (!settings) {
    return DEFAULT_SETTINGS;
  }
  const { ...appSettings } = settings;
  return appSettings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  await db.settings.update('app-settings', updates);
}

// ============================================================
// Bulk Operations (for import)
// ============================================================

export async function replaceAllData(
  transactions: Transaction[],
  categories: Category[],
  settings: AppSettings,
  recurringTransactions: RecurringTransaction[] = [],
  budgets: Budget[] = []
): Promise<void> {
  await db.transaction('rw', [db.transactions, db.categories, db.settings, db.recurringTransactions, db.budgets], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();
    await db.recurringTransactions.clear();
    await db.budgets.clear();

    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
    }
    if (categories.length > 0) {
      await db.categories.bulkAdd(categories);
    }
    if (recurringTransactions.length > 0) {
      await db.recurringTransactions.bulkAdd(recurringTransactions);
    }
    if (budgets.length > 0) {
      await db.budgets.bulkAdd(budgets);
    }
    await db.settings.add({ id: 'app-settings', ...settings });
  });
}

export async function mergeData(
  transactions: Transaction[],
  categories: Category[],
  recurringTransactions: RecurringTransaction[] = [],
  budgets: Budget[] = []
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  await db.transaction('rw', [db.transactions, db.categories, db.recurringTransactions, db.budgets], async () => {
    // Merge transactions (skip duplicates by id)
    for (const t of transactions) {
      const existing = await db.transactions.get(t.id);
      if (!existing) {
        await db.transactions.add(t);
        added++;
      } else {
        skipped++;
      }
    }

    // Merge categories (skip duplicates by id)
    for (const c of categories) {
      const existing = await db.categories.get(c.id);
      if (!existing) {
        await db.categories.add(c);
      }
    }

    // Merge recurring transactions
    for (const r of recurringTransactions) {
      const existing = await db.recurringTransactions.get(r.id);
      if (!existing) {
        await db.recurringTransactions.add(r);
      }
    }

    // Merge budgets
    for (const b of budgets) {
      const existing = await db.budgets.get(b.id);
      if (!existing) {
        await db.budgets.add(b);
      }
    }
  });

  return { added, skipped };
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.transactions, db.categories, db.settings, db.recurringTransactions, db.budgets, db.deletedRecords], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();
    await db.recurringTransactions.clear();
    await db.budgets.clear();
    await db.deletedRecords.clear();
  });
  
  // Re-seed default data
  await initializeDatabase();
}

export async function getStorageEstimate(): Promise<{ used: string; count: number }> {
  const count = await db.transactions.count();
  let used = 'N/A';

  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    if (usageBytes > 1_000_000) {
      used = `${(usageBytes / 1_000_000).toFixed(1)} MB`;
    } else if (usageBytes > 1_000) {
      used = `${(usageBytes / 1_000).toFixed(1)} KB`;
    } else {
      used = `${usageBytes} B`;
    }
  }

  return { used, count };
}

export default db;
