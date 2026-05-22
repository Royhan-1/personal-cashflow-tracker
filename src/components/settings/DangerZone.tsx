'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { clearAllData } from '@/lib/db';

export default function DangerZone() {
  const { state, showToast, refreshData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClear = async () => {
    if (confirmText !== 'HAPUS SEMUA') return;
    try {
      await clearAllData();
      await refreshData();
      showToast('success', 'Semua data berhasil dihapus');
      setShowModal(false);
      setConfirmText('');
    } catch {
      showToast('error', 'Gagal menghapus data');
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title" style={{ color: 'var(--accent-expense)' }}>
        <AlertTriangle size={18} /> Zona Bahaya
      </h3>
      <div className="settings-item danger-item">
        <div className="settings-item-info">
          <h4>Hapus Semua Data</h4>
          <p>Menghapus semua transaksi, kategori kustom, dan pengaturan. Tindakan ini tidak bisa dibatalkan.</p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowModal(true)}>
          <Trash2 size={14} /> Hapus Semua
        </button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setConfirmText(''); }}
        title="Hapus Semua Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setConfirmText(''); }}>
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClear}
              disabled={confirmText !== 'HAPUS SEMUA'}
            >
              Hapus Semua Data
            </button>
          </>
        }
      >
        <div className="danger-confirm-prompt">
          <AlertTriangle size={40} style={{ color: 'var(--accent-expense)' }} />
          <p className="font-semibold" style={{ fontSize: '14px', marginTop: '12px' }}>
            Tindakan ini tidak bisa dibatalkan!
          </p>
          <p className="text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
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
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
