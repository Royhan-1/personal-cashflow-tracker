'use client';

import React, { useState } from 'react';
import { FileDown, Shield, ShieldOff, Lock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { exportPlain, exportEncrypted, exportCSV, exportPDF } from '@/lib/exportImport';

export default function ExportSection() {
  const { state, showToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (exportFormat === 'json') {
        if (useEncryption) {
          if (!password) {
            showToast('error', 'Masukkan password');
            setExporting(false);
            return;
          }
          if (password !== passwordConfirm) {
            showToast('error', 'Password tidak cocok');
            setExporting(false);
            return;
          }
          if (password.length < 4) {
            showToast('error', 'Password minimal 4 karakter');
            setExporting(false);
            return;
          }
          await exportEncrypted(password);
          showToast('success', 'Data berhasil diekspor (terenkripsi)');
        } else {
          await exportPlain();
          showToast('success', 'Data berhasil diekspor JSON');
        }
      } else if (exportFormat === 'csv') {
        exportCSV(state.transactions, state.categories);
        showToast('success', 'Data berhasil diekspor CSV');
      } else if (exportFormat === 'pdf') {
        exportPDF(state.transactions, state.categories);
        showToast('success', 'Data berhasil diekspor PDF');
      }
      handleClose();
    } catch (error) {
      showToast('error', 'Gagal mengekspor: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setExporting(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setPassword('');
    setPasswordConfirm('');
  };

  return (
    <>
      <div
        className="card settings-action-card"
        onClick={() => setShowModal(true)}
      >
        <div className="settings-action-icon">
          <FileDown size={36} style={{ color: 'var(--accent-income)' }} />
        </div>
        <h4 className="settings-action-title">Ekspor Data</h4>
        <p className="settings-action-desc">
          Download semua data sebagai file JSON, CSV, atau PDF.
        </p>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Ekspor Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>Batal</button>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Mengekspor...' : 'Ekspor'}
            </button>
          </>
        }
      >
        <p className="text-secondary" style={{ fontSize: '14px' }}>
          Data kamu ({state.transactions.length} transaksi) akan diunduh.
        </p>

        <div className="form-group" style={{ marginTop: '12px' }}>
          <label className="form-label">Format Export</label>
          <div className="toggle-group">
            <button
              className={`toggle-option ${exportFormat === 'json' ? 'active' : ''}`}
              onClick={() => setExportFormat('json')}
            >
              JSON
            </button>
            <button
              className={`toggle-option ${exportFormat === 'csv' ? 'active' : ''}`}
              onClick={() => setExportFormat('csv')}
            >
              CSV
            </button>
            <button
              className={`toggle-option ${exportFormat === 'pdf' ? 'active' : ''}`}
              onClick={() => setExportFormat('pdf')}
            >
              PDF
            </button>
          </div>
        </div>

        {exportFormat === 'json' && (
          <div className="form-group" style={{ marginTop: '8px' }}>
            <button
              className={`btn ${useEncryption ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setUseEncryption(!useEncryption)}
            >
              {useEncryption ? <Shield size={14} /> : <ShieldOff size={14} />}
              {useEncryption ? 'Password Protection: ON' : 'Password Protection: OFF'}
            </button>
          </div>
        )}

        {exportFormat === 'json' && useEncryption && (
          <>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 4 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password lagi"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
            <div className="info-banner warning">
              <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              Password tidak disimpan di mana pun. Jika kamu lupa password, data tidak bisa dipulihkan.
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
