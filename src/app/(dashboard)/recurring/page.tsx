'use client';

import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Edit3, Trash2, Repeat, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import RecurringForm from '@/components/recurring/RecurringForm';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { RecurringTransaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RecurringPage() {
  const { state, updateRecurringTransaction, deleteRecurringTransaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; description: string } | null>(null);

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteRequest = (id: string, description: string) => {
    setDeleteTarget({ id, description });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteRecurringTransaction(deleteTarget.id);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const toggleStatus = async (transaction: RecurringTransaction) => {
    await updateRecurringTransaction(transaction.id, { isActive: !transaction.isActive });
  };

  const getCategoryInfo = (categoryId: string) =>
    state.categories.find(c => c.id === categoryId);

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Setiap Hari';
      case 'weekly': return 'Setiap Minggu';
      case 'monthly': return 'Setiap Bulan';
      case 'yearly': return 'Setiap Tahun';
      default: return freq;
    }
  };

  if (state.isLoading) {
    return (
      <>
        <Header title="Transaksi Berulang" />
        <div className="app-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="card skeleton" style={{ height: '80px', marginBottom: '16px' }} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Transaksi Berulang"
        subtitle={`${state.recurringTransactions.length} transaksi otomatis dijadwalkan`}
      />
      <div className="app-content animate-fade-in">
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => { setEditingTransaction(null); setShowForm(true); }}>
            <Plus size={16} /> Tambah Transaksi Berulang
          </button>
        </div>

        {state.recurringTransactions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Repeat size={48} />
              </div>
              <p className="empty-state-title">Belum ada transaksi berulang</p>
              <p className="empty-state-text">
                Buat template untuk transaksi yang terjadi secara rutin (seperti gaji atau cicilan bulanan).
                Sistem akan otomatis mencatatnya saat jatuh tempo.
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="transaction-list">
              {state.recurringTransactions.map((transaction) => {
                const category = getCategoryInfo(transaction.category);
                return (
                  <div key={transaction.id} className="transaction-item" style={{ opacity: transaction.isActive ? 1 : 0.6 }}>
                    <div
                      className="transaction-icon"
                      style={{ background: category ? `${category.color}18` : 'var(--bg-glass)' }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-description" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {transaction.description}
                        {!transaction.isActive && (
                          <span style={{ fontSize: '11px', background: 'var(--accent-expense-bg)', color: 'var(--accent-expense)', padding: '2px 6px', borderRadius: '4px' }}>
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <div className="transaction-meta">
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{getFrequencyLabel(transaction.frequency)}</span>
                        <span>·</span>
                        <span>{category?.name || 'Uncategorized'}</span>
                        <span>·</span>
                        <span>Mulai: {formatDate(transaction.startDate)}</span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    <div className="transaction-actions" style={{ marginLeft: '12px' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); toggleStatus(transaction); }}
                        title={transaction.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        style={{ color: transaction.isActive ? 'var(--accent-warning)' : 'var(--accent-income)' }}
                      >
                        {transaction.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }}
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest(transaction.id, transaction.description); }}
                        title="Hapus"
                        style={{ color: 'var(--accent-expense)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <RecurringForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTransaction(null); }}
        editTransaction={editingTransaction}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Transaksi Berulang"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Batal
            </button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>
              <Trash2 size={14} /> Hapus
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Yakin ingin menghapus jadwal transaksi <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget?.description}&quot;</strong>?
          Transaksi yang sudah dibuat sebelumnya tidak akan dihapus, tetapi sistem tidak akan membuat transaksi baru ke depannya.
        </p>
      </Modal>
    </>
  );
}
