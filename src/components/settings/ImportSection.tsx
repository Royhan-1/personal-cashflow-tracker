'use client';

import React, { useState, useRef } from 'react';
import { FileUp, Lock, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { AppData, EncryptedExport } from '@/lib/types';
import {
  readImportFile, decryptImportData, validateImportData,
  getImportPreview, importReplace, importMerge, ImportPreview,
} from '@/lib/exportImport';
import { formatDate } from '@/lib/utils';

export default function ImportSection() {
  const { showToast, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [importData, setImportData] = useState<AppData | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [importNeedsPassword, setImportNeedsPassword] = useState(false);
  const [importRawData, setImportRawData] = useState<unknown>(null);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setImportData(null);
    setImportPreview(null);
    setImportPassword('');
    setImportNeedsPassword(false);
    setImportRawData(null);
  };

  const handleClose = () => {
    setShowModal(false);
    resetState();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setShowModal(true);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal membaca file');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDecrypt = async () => {
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
      handleClose();
    } catch {
      showToast('error', 'Gagal mengimpor data');
    }
    setImporting(false);
  };

  return (
    <>
      <div
        className="card settings-action-card"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="settings-action-icon">
          <FileUp size={36} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h4 className="settings-action-title">Impor Data</h4>
        <p className="settings-action-desc">
          Upload file backup JSON untuk memulihkan data.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Impor Data"
        footer={
          importData ? (
            <>
              <button className="btn btn-secondary" onClick={handleClose}>Batal</button>
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
            <div className="import-password-prompt">
              <Lock size={32} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <p className="font-semibold" style={{ fontSize: '14px' }}>File ini terenkripsi</p>
              <p className="text-secondary" style={{ fontSize: '13px' }}>
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
                onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
              />
            </div>
            <button className="btn btn-primary w-full" onClick={handleDecrypt}>
              Buka Kunci
            </button>
          </>
        ) : importPreview ? (
          <>
            <div className="info-banner success">
              <CheckCircle size={18} />
              <span className="font-semibold">File valid</span>
            </div>

            <div className="import-preview-list">
              <div className="import-preview-row">
                <span className="text-secondary">Transaksi</span>
                <span className="font-semibold">{importPreview.transactionCount}</span>
              </div>
              <div className="import-preview-row">
                <span className="text-secondary">Kategori Kustom</span>
                <span className="font-semibold">{importPreview.categoryCount}</span>
              </div>
              {importPreview.dateRange && (
                <div className="import-preview-row">
                  <span className="text-secondary">Rentang Tanggal</span>
                  <span className="font-semibold">
                    {formatDate(importPreview.dateRange.from)} - {formatDate(importPreview.dateRange.to)}
                  </span>
                </div>
              )}
              <div className="import-preview-row">
                <span className="text-secondary">Versi</span>
                <span className="font-semibold">{importPreview.version}</span>
              </div>
            </div>

            <div className="info-banner warning">
              <strong>Ganti Semua</strong> akan menghapus semua data yang ada dan menggantinya dengan data dari file.
              <br />
              <strong>Gabungkan</strong> akan menambahkan data baru tanpa menghapus data yang sudah ada (duplikat akan dilewati).
            </div>
          </>
        ) : (
          <p className="text-secondary text-center">Memproses file...</p>
        )}
      </Modal>
    </>
  );
}
