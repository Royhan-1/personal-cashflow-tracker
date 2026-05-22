import { AppData, EncryptedExport } from './types';
import { APP_VERSION } from './constants';
import { getAllTransactions, getAllCategories, getSettings, replaceAllData, mergeData } from './db';
import { encryptData, decryptData } from './crypto';
import { format } from 'date-fns';

// ============================================================
// Export Functions
// ============================================================

/**
 * Gather all app data for export
 */
export async function gatherExportData(): Promise<AppData> {
  const [transactions, categories, settings] = await Promise.all([
    getAllTransactions(),
    getAllCategories(),
    getSettings(),
  ]);

  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: false,
    transactions,
    categories,
    settings,
  };
}

/**
 * Export data as plain JSON (no encryption)
 */
export async function exportPlain(): Promise<void> {
  const data = await gatherExportData();
  const json = JSON.stringify(data, null, 2);
  const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadFile(json, `cashflow-backup-${dateStr}.json`, 'application/json');
}

/**
 * Export data as encrypted JSON
 */
export async function exportEncrypted(password: string): Promise<void> {
  const data = await gatherExportData();
  const json = JSON.stringify(data);

  const { salt, iv, data: encryptedData } = await encryptData(json, password);

  const exportData: EncryptedExport = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: true,
    salt,
    iv,
    data: encryptedData,
  };

  const outputJson = JSON.stringify(exportData, null, 2);
  const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadFile(outputJson, `cashflow-backup-${dateStr}.encrypted.json`, 'application/json');
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// Import Functions
// ============================================================

export interface ImportPreview {
  transactionCount: number;
  categoryCount: number;
  dateRange: { from: string; to: string } | null;
  encrypted: boolean;
  version: string;
  exportedAt: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  transactionsImported?: number;
  categoriesImported?: number;
}

/**
 * Read and parse an import file
 * Returns the raw parsed data (may need decryption)
 */
export async function readImportFile(file: File): Promise<{ data: unknown; encrypted: boolean }> {
  const text = await file.text();

  try {
    const parsed = JSON.parse(text);
    return {
      data: parsed,
      encrypted: parsed.encrypted === true,
    };
  } catch {
    throw new Error('File bukan format JSON yang valid');
  }
}

/**
 * Decrypt and parse encrypted import data
 */
export async function decryptImportData(
  encryptedExport: EncryptedExport,
  password: string
): Promise<AppData> {
  const decryptedJson = await decryptData(
    encryptedExport.salt,
    encryptedExport.iv,
    encryptedExport.data,
    password
  );

  try {
    return JSON.parse(decryptedJson) as AppData;
  } catch {
    throw new Error('Data yang didekripsi tidak valid');
  }
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  if (!d.version || typeof d.version !== 'string') return false;
  if (!Array.isArray(d.transactions)) return false;
  if (!Array.isArray(d.categories)) return false;

  // Validate at least some transaction fields
  for (const t of d.transactions) {
    if (!t || typeof t !== 'object') return false;
    const tx = t as Record<string, unknown>;
    if (!tx.id || !tx.type || !tx.amount || !tx.date) return false;
  }

  return true;
}

/**
 * Get import preview info
 */
export function getImportPreview(data: AppData): ImportPreview {
  const dates = data.transactions.map(t => t.date).sort();

  return {
    transactionCount: data.transactions.length,
    categoryCount: data.categories.filter(c => !c.isDefault).length,
    dateRange: dates.length > 0
      ? { from: dates[0], to: dates[dates.length - 1] }
      : null,
    encrypted: data.encrypted,
    version: data.version,
    exportedAt: data.exportedAt,
  };
}

/**
 * Execute import — replace all existing data
 */
export async function importReplace(data: AppData): Promise<ImportResult> {
  try {
    await replaceAllData(data.transactions, data.categories, data.settings);
    return {
      success: true,
      message: `Berhasil mengimpor ${data.transactions.length} transaksi`,
      transactionsImported: data.transactions.length,
      categoriesImported: data.categories.length,
    };
  } catch (error) {
    return {
      success: false,
      message: `Gagal mengimpor: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Execute import — merge with existing data
 */
export async function importMerge(data: AppData): Promise<ImportResult> {
  try {
    const result = await mergeData(data.transactions, data.categories);
    return {
      success: true,
      message: `Berhasil menambahkan ${result.added} transaksi (${result.skipped} duplikat dilewati)`,
      transactionsImported: result.added,
    };
  } catch (error) {
    return {
      success: false,
      message: `Gagal mengimpor: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
