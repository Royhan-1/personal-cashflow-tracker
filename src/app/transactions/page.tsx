'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, Edit3 } from 'lucide-react';
import Header from '@/components/layout/Header';
import TransactionForm from '@/components/transactions/TransactionForm';
import { useApp } from '@/context/AppContext';
import { Transaction, TransactionFilters } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TransactionsPage() {
  const { state, deleteTransaction, deleteTransactions, getFilteredTransactions } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    search: '',
  });

  const filteredTransactions = useMemo(
    () => getFilteredTransactions(filters),
    [getFilteredTransactions, filters]
  );

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      await deleteTransaction(id);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await deleteTransactions(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return state.categories.find(c => c.id === categoryId);
  };

  if (state.isLoading) {
    return (
      <>
        <Header title="Transaksi" />
        <div className="app-content">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '40%' }} />
              </div>
              <div className="skeleton" style={{ height: '16px', width: '80px' }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Transaksi"
        subtitle={`${state.transactions.length} total transaksi`}
      />
      <div className="app-content animate-fade-in">
        {/* Summary Bar */}
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">Pemasukan</span>
            <span className="summary-value income">
              +{formatCurrency(summary.income, state.settings.defaultCurrency)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Pengeluaran</span>
            <span className="summary-value expense">
              -{formatCurrency(summary.expense, state.settings.defaultCurrency)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Nett</span>
            <span className={`summary-value ${summary.net >= 0 ? 'income' : 'expense'}`}>
              {formatCurrency(summary.net, state.settings.defaultCurrency)}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari transaksi..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as 'income' | 'expense' | 'all' })}
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            className="filter-select"
            value={filters.category || ''}
            onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
          >
            <option value="">Semua Kategori</option>
            {state.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="filter-select"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
            style={{ minWidth: '140px' }}
            title="Dari tanggal"
          />
          <input
            type="date"
            className="filter-select"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
            style={{ minWidth: '140px' }}
            title="Sampai tanggal"
          />
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingTransaction(null); setShowForm(true); }}>
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--accent-primary-glow)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '12px',
            animation: 'slideUp 0.2s ease',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
              {selectedIds.size} dipilih
            </span>
            <button className="btn btn-danger btn-sm" onClick={() => handleBulkDelete()}>
              <Trash2 size={14} /> Hapus
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds(new Set())}>
              Batal
            </button>
          </div>
        )}

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <ArrowUpRight size={48} />
              </div>
              <p className="empty-state-title">Tidak ada transaksi</p>
              <p className="empty-state-text">
                {state.transactions.length === 0
                  ? 'Mulai catat pemasukan dan pengeluaran kamu dengan klik tombol Tambah'
                  : 'Coba ubah filter pencarian'}
              </p>
              {state.transactions.length === 0 && (
                <button className="btn btn-primary" onClick={() => { setEditingTransaction(null); setShowForm(true); }}>
                  <Plus size={16} /> Tambah Transaksi Pertama
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            {/* Select All */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '4px',
            }}>
              <input
                type="checkbox"
                checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {filteredTransactions.length} transaksi
              </span>
            </div>

            <div className="transaction-list">
              {filteredTransactions.map((transaction) => {
                const category = getCategoryInfo(transaction.category);
                return (
                  <div
                    key={transaction.id}
                    className="transaction-item"
                    style={{ paddingLeft: '0' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(transaction.id)}
                      onChange={() => toggleSelect(transaction.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)', flexShrink: 0 }}
                    />
                    <div
                      className="transaction-icon"
                      style={{
                        background: category ? `${category.color}18` : 'var(--bg-glass)',
                      }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-description">
                        {transaction.description}
                      </div>
                      <div className="transaction-meta">
                        <span>{category?.name || 'Uncategorized'}</span>
                        <span>·</span>
                        <span>{formatDate(transaction.date)}</span>
                        <span>·</span>
                        <span>{transaction.currency}</span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }}
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(transaction.id); }}
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

      {/* FAB */}
      <button
        className="fab"
        onClick={() => { setEditingTransaction(null); setShowForm(true); }}
        aria-label="Tambah transaksi"
      >
        <Plus size={24} />
      </button>

      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTransaction(null); }}
        editTransaction={editingTransaction}
      />
    </>
  );
}
