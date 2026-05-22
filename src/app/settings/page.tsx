'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Download, Upload, Shield, ShieldOff, Sun, Moon, Monitor,
  Trash2, HardDrive, Plus, Palette, Tag, DollarSign,
  FileDown, FileUp, AlertTriangle, CheckCircle, Lock
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { SUPPORTED_CURRENCIES, CATEGORY_ICONS, CATEGORY_COLORS, APP_VERSION } from '@/lib/constants';
import { exportPlain, exportEncrypted, readImportFile, decryptImportData, validateImportData, getImportPreview, importReplace, importMerge, ImportPreview } from '@/lib/exportImport';
import { clearAllData, getStorageEstimate } from '@/lib/db';
import { AppData, EncryptedExport, Category } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { state, updateSettings, addCategory, deleteCategory, showToast, refreshData } = useApp();

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<AppData | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [importNeedsPassword, setImportNeedsPassword] = useState(false);
  const [importRawData, setImportRawData] = useState<unknown>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [newCategoryColor, setNewCategoryColor] = useState('#6c5ce7');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  // Clear data
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  // Storage info
  const [storageInfo, setStorageInfo] = useState<{ used: string; count: number } | null>(null);

  React.useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, [state.transactions.length]);

  // ============================================================
  // Export Handlers
  // ============================================================

  const handleExport = async () => {
    setExporting(true);
    try {
      if (useEncryption) {
        if (!exportPassword) {
          showToast('error', 'Masukkan password');
          setExporting(false);
          return;
        }
        if (exportPassword !== exportPasswordConfirm) {
          showToast('error', 'Password tidak cocok');
          setExporting(false);
          return;
        }
        if (exportPassword.length < 4) {
          showToast('error', 'Password minimal 4 karakter');
          setExporting(false);
          return;
        }
        await exportEncrypted(exportPassword);
        showToast('success', 'Data berhasil diekspor (terenkripsi)');
      } else {
        await exportPlain();
        showToast('success', 'Data berhasil diekspor');
      }
      setShowExportModal(false);
      setExportPassword('');
      setExportPasswordConfirm('');
    } catch (error) {
      showToast('error', 'Gagal mengekspor: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setExporting(false);
  };

  // ============================================================
  // Import Handlers
  // ============================================================

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    try {
      const { data, encrypted } = await readImportFile(file);
      setImportRawData(data);

      if (encrypted) {
        setImportNeedsPassword(true);
        setImportData(null);
        setImportPreview(null);
      } else {
        if (!validateImportData(data)) {
          showToast('error', 'Format file tidak valid');
          return;
        }
        const appData = data as AppData;
        setImportData(appData);
        setImportPreview(getImportPreview(appData));
        setImportNeedsPassword(false);
      }
      setShowImportModal(true);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal membaca file');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDecryptImport = async () => {
    if (!importPassword || !importRawData) return;

    try {
      const decrypted = await decryptImportData(importRawData as EncryptedExport, importPassword);
      if (!validateImportData(decrypted)) {
        showToast('error', 'Data yang didekripsi tidak valid');
        return;
      }
      setImportData(decrypted);
      setImportPreview(getImportPreview(decrypted));
      setImportNeedsPassword(false);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal mendekripsi');
    }
  };

  const handleImport = async (mode: 'replace' | 'merge') => {
    if (!importData) return;
    setImporting(true);

    try {
      const result = mode === 'replace'
        ? await importReplace(importData)
        : await importMerge(importData);

      if (result.success) {
        showToast('success', result.message);
        await refreshData();
      } else {
        showToast('error', result.message);
      }
      setShowImportModal(false);
      resetImportState();
    } catch (error) {
      showToast('error', 'Gagal mengimpor data');
    }
    setImporting(false);
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportData(null);
    setImportPreview(null);
    setImportPassword('');
    setImportNeedsPassword(false);
    setImportRawData(null);
  };

  // ============================================================
  // Category Handlers
  // ============================================================

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('error', 'Nama kategori harus diisi');
      return;
    }
    await addCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
    });
    setShowCategoryModal(false);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = state.categories.find(c => c.id === id);
    if (cat?.isDefault) {
      showToast('error', 'Kategori default tidak bisa dihapus');
      return;
    }
    // Check if category is in use
    const inUse = state.transactions.some(t => t.category === id);
    if (inUse) {
      showToast('warning', 'Kategori ini masih digunakan oleh beberapa transaksi');
      return;
    }
    await deleteCategory(id);
  };

  // ============================================================
  // Clear Data Handler
  // ============================================================

  const handleClearData = async () => {
    if (clearConfirmText !== 'HAPUS SEMUA') return;
    try {
      await clearAllData();
      await refreshData();
      showToast('success', 'Semua data berhasil dihapus');
      setShowClearModal(false);
      setClearConfirmText('');
    } catch (error) {
      showToast('error', 'Gagal menghapus data');
    }
  };

  // ============================================================
  // Currency toggle
  // ============================================================

  const toggleCurrency = (code: string) => {
    const current = state.settings.enabledCurrencies;
    if (current.includes(code)) {
      if (current.length === 1) {
        showToast('warning', 'Minimal harus ada 1 mata uang aktif');
        return;
      }
      if (code === state.settings.defaultCurrency) {
        showToast('warning', 'Tidak bisa menonaktifkan mata uang default');
        return;
      }
      updateSettings({ enabledCurrencies: current.filter(c => c !== code) });
    } else {
      updateSettings({ enabledCurrencies: [...current, code] });
    }
  };

  const setDefaultCurrency = (code: string) => {
    const current = state.settings.enabledCurrencies;
    if (!current.includes(code)) {
      updateSettings({ defaultCurrency: code, enabledCurrencies: [...current, code] });
    } else {
      updateSettings({ defaultCurrency: code });
    }
  };

  return (
    <>
      <Header title="Pengaturan" subtitle="Kelola preferensi dan data kamu" />
      <div className="app-content animate-fade-in">

        {/* ============ Export / Import ============ */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <HardDrive size={18} /> Data & Backup
          </h3>

          <div className="export-import-grid">
            {/* Export */}
            <div
              className="card"
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => setShowExportModal(true)}
            >
              <div style={{ marginBottom: '12px' }}>
                <FileDown size={36} style={{ color: 'var(--accent-income)' }} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Ekspor Data
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Download semua data sebagai file JSON. Bisa diproteksi password.
              </p>
            </div>

            {/* Import */}
            <div
              className="card"
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ marginBottom: '12px' }}>
                <FileUp size={36} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Impor Data
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Upload file backup JSON untuk memulihkan data.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Storage info */}
          {storageInfo && (
            <div className="settings-item" style={{ marginTop: '12px' }}>
              <div className="settings-item-info">
                <h4>Penyimpanan</h4>
                <p>{storageInfo.count} transaksi · {storageInfo.used} digunakan</p>
              </div>
            </div>
          )}
        </div>

        {/* ============ Theme ============ */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Palette size={18} /> Tampilan
          </h3>
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Tema</h4>
              <p>Pilih tampilan terang atau gelap</p>
            </div>
            <div className="toggle-group" style={{ width: '200px' }}>
              <button
                className={`toggle-option ${state.settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateSettings({ theme: 'dark' })}
              >
                <Moon size={14} style={{ marginRight: '4px' }} /> Gelap
              </button>
              <button
                className={`toggle-option ${state.settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => updateSettings({ theme: 'light' })}
              >
                <Sun size={14} style={{ marginRight: '4px' }} /> Terang
              </button>
            </div>
          </div>
        </div>

        {/* ============ Currencies ============ */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <DollarSign size={18} /> Mata Uang
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Aktifkan mata uang yang ingin kamu gunakan. Klik ⭐ untuk set sebagai default.
          </p>
          <div className="category-grid">
            {SUPPORTED_CURRENCIES.map(currency => {
              const isEnabled = state.settings.enabledCurrencies.includes(currency.code);
              const isDefault = state.settings.defaultCurrency === currency.code;
              return (
                <div
                  key={currency.code}
                  className="category-card"
                  style={{
                    opacity: isEnabled ? 1 : 0.4,
                    borderColor: isDefault ? 'var(--accent-primary)' : undefined,
                    background: isDefault ? 'var(--accent-primary-glow)' : undefined,
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', width: '32px' }}>
                    {currency.symbol}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="category-card-name">{currency.code}</div>
                    <div className="category-card-type">{currency.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setDefaultCurrency(currency.code)}
                      title="Set sebagai default"
                      style={{ color: isDefault ? 'var(--accent-warning)' : 'var(--text-muted)', fontSize: '14px' }}
                    >
                      {isDefault ? '⭐' : '☆'}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => toggleCurrency(currency.code)}
                      title={isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                      style={{ fontSize: '12px' }}
                    >
                      {isEnabled ? '✓' : '○'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ Categories ============ */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Tag size={18} /> Kategori
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCategoryModal(true)}>
              <Plus size={14} /> Tambah
            </button>
          </h3>

          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '16px' }}>
            PEMASUKAN
          </h4>
          <div className="category-grid" style={{ marginBottom: '20px' }}>
            {state.categories.filter(c => c.type === 'income').map(cat => (
              <div key={cat.id} className="category-card">
                <span className="category-card-icon">{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="category-card-name">{cat.name}</div>
                  <div className="category-card-type">
                    {cat.isDefault ? 'Default' : 'Custom'}
                  </div>
                </div>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                {!cat.isDefault && (
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ color: 'var(--accent-expense)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            PENGELUARAN
          </h4>
          <div className="category-grid">
            {state.categories.filter(c => c.type === 'expense').map(cat => (
              <div key={cat.id} className="category-card">
                <span className="category-card-icon">{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="category-card-name">{cat.name}</div>
                  <div className="category-card-type">
                    {cat.isDefault ? 'Default' : 'Custom'}
                  </div>
                </div>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                {!cat.isDefault && (
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ color: 'var(--accent-expense)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ============ Danger Zone ============ */}
        <div className="settings-section">
          <h3 className="settings-section-title" style={{ color: 'var(--accent-expense)' }}>
            <AlertTriangle size={18} /> Zona Bahaya
          </h3>
          <div className="settings-item" style={{ borderColor: 'rgba(255, 107, 122, 0.2)' }}>
            <div className="settings-item-info">
              <h4>Hapus Semua Data</h4>
              <p>Menghapus semua transaksi, kategori kustom, dan pengaturan. Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <button className="btn btn-danger" onClick={() => setShowClearModal(true)}>
              <Trash2 size={14} /> Hapus Semua
            </button>
          </div>
        </div>

        {/* App info */}
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
          CashFlow Tracker v{APP_VERSION} · Data disimpan secara lokal di browser
        </div>
      </div>

      {/* ============ Export Modal ============ */}
      <Modal
        isOpen={showExportModal}
        onClose={() => { setShowExportModal(false); setExportPassword(''); setExportPasswordConfirm(''); }}
        title="Ekspor Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Mengekspor...' : 'Ekspor'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Data kamu ({state.transactions.length} transaksi) akan diunduh sebagai file JSON.
        </p>

        <div className="form-group" style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className={`btn ${useEncryption ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setUseEncryption(!useEncryption)}
            >
              {useEncryption ? <Shield size={14} /> : <ShieldOff size={14} />}
              {useEncryption ? 'Password Protection: ON' : 'Password Protection: OFF'}
            </button>
          </div>
        </div>

        {useEncryption && (
          <>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 4 karakter"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password lagi"
                value={exportPasswordConfirm}
                onChange={(e) => setExportPasswordConfirm(e.target.value)}
              />
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'var(--accent-warning-bg)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12px',
              color: 'var(--accent-warning)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              Password tidak disimpan di mana pun. Jika kamu lupa password, data tidak bisa dipulihkan.
            </div>
          </>
        )}
      </Modal>

      {/* ============ Import Modal ============ */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); resetImportState(); }}
        title="Impor Data"
        footer={
          importData ? (
            <>
              <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); resetImportState(); }}>
                Batal
              </button>
              <button className="btn btn-secondary" onClick={() => handleImport('merge')} disabled={importing}>
                Gabungkan
              </button>
              <button className="btn btn-primary" onClick={() => handleImport('replace')} disabled={importing}>
                {importing ? 'Mengimpor...' : 'Ganti Semua'}
              </button>
            </>
          ) : undefined
        }
      >
        {importNeedsPassword ? (
          <>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              marginBottom: '12px',
            }}>
              <Lock size={32} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                File ini terenkripsi
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Masukkan password yang digunakan saat ekspor
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDecryptImport()}
              />
            </div>
            <button className="btn btn-primary w-full" onClick={handleDecryptImport}>
              Buka Kunci
            </button>
          </>
        ) : importPreview ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'var(--accent-income-bg)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '8px',
            }}>
              <CheckCircle size={18} style={{ color: 'var(--accent-income)' }} />
              <span style={{ fontSize: '14px', color: 'var(--accent-income)', fontWeight: 600 }}>
                File valid
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transaksi</span>
                <span style={{ fontWeight: 600 }}>{importPreview.transactionCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kategori Kustom</span>
                <span style={{ fontWeight: 600 }}>{importPreview.categoryCount}</span>
              </div>
              {importPreview.dateRange && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rentang Tanggal</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatDate(importPreview.dateRange.from)} - {formatDate(importPreview.dateRange.to)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Versi</span>
                <span style={{ fontWeight: 600 }}>{importPreview.version}</span>
              </div>
            </div>

            <div style={{
              padding: '10px 14px',
              background: 'var(--accent-warning-bg)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12px',
              color: 'var(--accent-warning)',
              marginTop: '8px',
            }}>
              <strong>Ganti Semua</strong> akan menghapus semua data yang ada dan menggantinya dengan data dari file.
              <br />
              <strong>Gabungkan</strong> akan menambahkan data baru tanpa menghapus data yang sudah ada (duplikat akan dilewati).
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Memproses file...
          </p>
        )}
      </Modal>

      {/* ============ Add Category Modal ============ */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Tambah Kategori"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleAddCategory}>Tambah</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Tipe</label>
          <div className="toggle-group">
            <button
              className={`toggle-option ${newCategoryType === 'expense' ? 'active' : ''}`}
              onClick={() => setNewCategoryType('expense')}
            >
              Pengeluaran
            </button>
            <button
              className={`toggle-option ${newCategoryType === 'income' ? 'active' : ''}`}
              onClick={() => setNewCategoryType('income')}
            >
              Pemasukan
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nama kategori"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ikon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORY_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setNewCategoryIcon(icon)}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: newCategoryIcon === icon ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: newCategoryIcon === icon ? 'var(--accent-primary-glow)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Warna</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORY_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewCategoryColor(color)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: color,
                  border: newCategoryColor === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: newCategoryColor === color ? '2px solid var(--accent-primary)' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* ============ Clear Data Modal ============ */}
      <Modal
        isOpen={showClearModal}
        onClose={() => { setShowClearModal(false); setClearConfirmText(''); }}
        title="Hapus Semua Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowClearModal(false); setClearConfirmText(''); }}>
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClearData}
              disabled={clearConfirmText !== 'HAPUS SEMUA'}
            >
              Hapus Semua Data
            </button>
          </>
        }
      >
        <div style={{
          textAlign: 'center',
          padding: '12px',
        }}>
          <AlertTriangle size={40} style={{ color: 'var(--accent-expense)', marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
            Tindakan ini tidak bisa dibatalkan!
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Semua {state.transactions.length} transaksi dan kategori kustom akan dihapus permanen.
            Pastikan kamu sudah melakukan backup terlebih dahulu.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Ketik &quot;HAPUS SEMUA&quot; untuk konfirmasi</label>
          <input
            type="text"
            className="form-input"
            placeholder="HAPUS SEMUA"
            value={clearConfirmText}
            onChange={(e) => setClearConfirmText(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
