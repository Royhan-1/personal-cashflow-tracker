import { createClient } from '@/lib/supabase/client';
import {
  getAllTransactions,
  getAllRecurringTransactions,
  getAllBudgets,
  getSettings,
  addTransaction,
  updateTransaction,
  addRecurringTransaction,
  updateRecurringTransaction,
  addBudget,
  updateBudget,
  updateSettings,
  getDeletedRecords,
  clearDeletedRecord
} from '@/lib/db';

// ============================================================
// Debounced Sync
// ============================================================

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncingBackground = false;

/**
 * Debounced wrapper: waits 2 seconds after the last call before executing.
 * Prevents rapid-fire sync calls from concurrent mutations.
 */
export function debouncedSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncDatabase().catch(console.error);
  }, 2000);
}

// ============================================================
// Core Sync Engine
// ============================================================

export async function syncDatabase(
  onStart?: () => void,
  onSuccess?: (timestamp: string) => void,
  onError?: (error: string) => void
): Promise<{ success: boolean; error?: string; timestamp?: string }> {
  if (isSyncingBackground) return { success: false, error: 'Sync in progress' };
  isSyncingBackground = true;
  
  if (onStart) onStart();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('User not logged in, skipping sync');
    isSyncingBackground = false;
    return { success: false, error: 'User not logged in' };
  }

  try {
    // --------------------------------------------------------
    // PHASE 1: Process Deleted Records (Push Deletions to Server)
    // --------------------------------------------------------
    const deletedRecords = await getDeletedRecords();
    for (const record of deletedRecords) {
      const { error: delError } = await supabase.from(record.tableName).delete().eq('id', record.id).eq('user_id', user.id);
      if (delError) {
        console.error(`[Sync] Failed to propagate deletion for ${record.tableName} (ID: ${record.id}):`, delError.message);
      } else {
        await clearDeletedRecord(record.id);
      }
    }

    // --------------------------------------------------------
    // PHASE 2 & 3: Push & Pull (Upserts)
    // --------------------------------------------------------
    await syncTable('transactions', getAllTransactions, addTransaction, updateTransaction, supabase, user.id);
    await syncTable('recurring_transactions', getAllRecurringTransactions, addRecurringTransaction, updateRecurringTransaction, supabase, user.id);
    await syncTable('budgets', getAllBudgets, addBudget, updateBudget, supabase, user.id);

    // Sync settings (simple key-value, no delete needed)
    const localSettings = await getSettings();
    const { data: serverSettings } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
    
    if (!serverSettings) {
      await supabase.from('settings').insert({
        user_id: user.id,
        default_currency: localSettings.defaultCurrency,
        theme: localSettings.theme
      });
    } else {
      if (new Date(localSettings.updatedAt || 0) > new Date(serverSettings.updated_at)) {
        await supabase.from('settings').update({
          default_currency: localSettings.defaultCurrency,
          theme: localSettings.theme,
          updated_at: localSettings.updatedAt
        }).eq('user_id', user.id);
      } else if (new Date(localSettings.updatedAt || 0) < new Date(serverSettings.updated_at)) {
        await updateSettings({
          defaultCurrency: serverSettings.default_currency,
          theme: serverSettings.theme,
          updatedAt: serverSettings.updated_at
        });
      }
    }

    console.log('Sync completed successfully');
    const timestamp = new Date().toISOString();
    if (onSuccess) onSuccess(timestamp);
    return { success: true, timestamp };
  } catch (error: any) {
    console.error('Sync failed:', error);
    const errorMsg = error?.message || 'Terjadi kesalahan saat menyinkronkan data.';
    if (onError) onError(errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    isSyncingBackground = false;
  }
}

// ============================================================
// Safe Two-Way Sync
// ============================================================

/**
 * Enhanced sync:
 * - Pushes local items to server if newer
 * - Pulls server items to local if newer or missing locally
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTable(tableName: string, getLocalAll: () => Promise<any[]>, addLocal: (data: any) => Promise<any>, updateLocal: (id: string, data: any) => Promise<any>, supabase: any, userId: string) {
  const localItems = await getLocalAll();
  const { data: serverItems, error } = await supabase.from(tableName).select('*').eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Create maps
  const localMap = new Map(localItems.map(item => [item.id, item]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverMap = new Map<any, any>(serverItems.map((item: any) => [item.id, item]));

  // 1. Push local to server if newer or doesn't exist on server
  for (const local of localItems) {
    const server = serverMap.get(local.id);
    const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
    const serverTime = server ? new Date(server.updated_at || server.created_at || 0).getTime() : 0;

    if (!server || localTime > serverTime) {
      const payload = mapLocalToServer(tableName, local, userId);
      const { error: upsertError } = await supabase.from(tableName).upsert(payload);
      if (upsertError) {
        console.error(`[Sync] Failed to upsert ${tableName} (ID: ${local.id}):`, upsertError.message, upsertError.details);
      }
    }
  }

  // 2. Pull server to local if newer or doesn't exist locally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const server of (serverItems as any[])) {
    const local = localMap.get(server.id);
    const localTime = local ? new Date(local.updatedAt || local.createdAt || 0).getTime() : 0;
    const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();

    if (!local) {
      // Item exists on server but not locally, and it wasn't in deletedRecords.
      // This means it was created on another device, or it's a fresh local install.
      // Add it locally!
      await addLocal(mapServerToLocal(tableName, server));
    } else if (serverTime > localTime) {
      // Server is newer
      await updateLocal(server.id, mapServerToLocal(tableName, server));
    }
  }
}

// ============================================================
// Field Mappers
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLocalToServer(table: string, local: any, userId: string) {
  if (table === 'transactions') {
    return {
      id: local.id,
      user_id: userId,
      amount: local.amount,
      date: local.date,
      category_id: local.category,
      description: local.description,
      type: local.type,
      currency: local.currency || 'IDR',
      is_recurring: !!local.recurringId,
      created_at: local.createdAt,
      updated_at: local.updatedAt || local.createdAt,
    };
  }
  if (table === 'recurring_transactions') {
    return {
      id: local.id,
      user_id: userId,
      type: local.type,
      amount: local.amount,
      currency: local.currency,
      category_id: local.category,
      description: local.description,
      frequency: local.frequency,
      start_date: local.startDate,
      end_date: local.endDate || null,
      last_generated_date: local.lastGeneratedDate || null,
      is_active: local.isActive,
      notes: local.notes || null,
      created_at: local.createdAt,
      updated_at: local.updatedAt,
    };
  }
  if (table === 'budgets') {
    return {
      id: local.id,
      user_id: userId,
      category_id: local.categoryId,
      amount: local.amount,
      currency: local.currency,
      period: local.period,
      created_at: local.createdAt,
      updated_at: local.updatedAt,
    };
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapServerToLocal(table: string, server: any) {
  if (table === 'transactions') {
    return {
      id: server.id,
      amount: Number(server.amount),
      date: server.date,
      category: server.category_id,
      description: server.description,
      type: server.type,
      currency: server.currency,
      createdAt: server.created_at,
      updatedAt: server.updated_at || server.created_at,
    };
  }
  if (table === 'recurring_transactions') {
    return {
      id: server.id,
      type: server.type,
      amount: Number(server.amount),
      currency: server.currency,
      category: server.category_id,
      description: server.description,
      frequency: server.frequency,
      startDate: server.start_date,
      endDate: server.end_date || undefined,
      lastGeneratedDate: server.last_generated_date || undefined,
      isActive: server.is_active,
      notes: server.notes || undefined,
      createdAt: server.created_at,
      updatedAt: server.updated_at || server.created_at,
    };
  }
  if (table === 'budgets') {
    return {
      id: server.id,
      categoryId: server.category_id,
      amount: Number(server.amount),
      currency: server.currency,
      period: server.period,
      createdAt: server.created_at,
      updatedAt: server.updated_at || server.created_at,
    };
  }
  return {};
}
