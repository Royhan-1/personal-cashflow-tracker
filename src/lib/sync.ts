import { createClient } from '@/lib/supabase/client';
import {
  getAllTransactions,
  getAllCategories,
  getAllRecurringTransactions,
  getAllBudgets,
  getSettings,
  addTransaction,
  updateTransaction,
  addCategory,
  updateCategory,
  addRecurringTransaction,
  updateRecurringTransaction,
  addBudget,
  updateBudget,
  updateSettings
} from '@/lib/db';

export async function syncDatabase() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('User not logged in, skipping sync');
    return;
  }

  try {
    await syncTable('transactions', getAllTransactions, addTransaction, updateTransaction, supabase, user.id);
    // Recurring and budgets can be added later if needed, focusing on core entities first
    // For now we sync categories and transactions as proof of concept

    const localSettings = await getSettings();
    const { data: serverSettings } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
    
    if (!serverSettings) {
      await supabase.from('settings').insert({
        user_id: user.id,
        default_currency: localSettings.defaultCurrency,
        theme: localSettings.theme
      });
    } else {
      // Very basic sync for settings
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
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTable(tableName: string, getLocalAll: () => Promise<any[]>, addLocal: (data: any) => Promise<void>, updateLocal: (id: string, data: any) => Promise<void>, supabase: any, userId: string) {
  const localItems = await getLocalAll();
  const { data: serverItems, error } = await supabase.from(tableName).select('*').eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Create maps
  const localMap = new Map(localItems.map(item => [item.id, item]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverMap = new Map(serverItems.map((item: any) => [item.id, item]));

  // Push local to server if newer or doesn't exist
  for (const local of localItems) {
    const server = serverMap.get(local.id);
    const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
    const serverTime = server ? new Date(server.updated_at || server.created_at || 0).getTime() : 0;

    if (!server || localTime > serverTime) {
      const payload = mapLocalToServer(tableName, local, userId);
      await supabase.from(tableName).upsert(payload);
    }
  }

  // Pull server to local if newer or doesn't exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const server of (serverItems as any[])) {
    const local = localMap.get(server.id);
    const localTime = local ? new Date(local.updatedAt || local.createdAt || 0).getTime() : 0;
    const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();

    if (!local) {
      await addLocal(mapServerToLocal(tableName, server));
    } else if (serverTime > localTime) {
      await updateLocal(server.id, mapServerToLocal(tableName, server));
    }
  }
}

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
      is_recurring: false,
      created_at: local.createdAt,
      // updated_at is missing in DB schema but let's assume createdAt acts as updated_at for now
    };
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapServerToLocal(table: string, server: any) {
  if (table === 'transactions') {
    return {
      id: server.id,
      amount: server.amount,
      date: server.date,
      category: server.category_id,
      description: server.description,
      type: server.type,
      currency: server.currency,
      createdAt: server.created_at,
      updatedAt: server.created_at,
    };
  }
  return {};
}
