import Dexie, { type EntityTable } from 'dexie';
import { Transaction, Category, AppSettings } from './types';
import { ALL_DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DB_NAME } from './constants';

// ============================================================
// Database Schema
// ============================================================

const db = new Dexie(DB_NAME) as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  categories: EntityTable<Category, 'id'>;
  settings: EntityTable<AppSettings & { id: string }, 'id'>;
};

db.version(1).stores({
  transactions: 'id, type, category, currency, date, createdAt',
  categories: 'id, type, isDefault, order',
  settings: 'id',
});

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
  return db.transactions.delete(id);
}

export async function deleteMultipleTransactions(ids: string[]): Promise<void> {
  return db.transactions.bulkDelete(ids);
}

export async function getTransactionCount(): Promise<number> {
  return db.transactions.count();
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
  settings: AppSettings
): Promise<void> {
  await db.transaction('rw', [db.transactions, db.categories, db.settings], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();

    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
    }
    if (categories.length > 0) {
      await db.categories.bulkAdd(categories);
    }
    await db.settings.add({ id: 'app-settings', ...settings });
  });
}

export async function mergeData(
  transactions: Transaction[],
  categories: Category[]
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  await db.transaction('rw', [db.transactions, db.categories], async () => {
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
  });

  return { added, skipped };
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.transactions, db.categories, db.settings], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();
  });
  // Re-initialize defaults
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
