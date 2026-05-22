'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, Edit3, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import Header from '@/components/layout/Header';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransferForm from '@/components/transactions/TransferForm';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { Transaction, TransactionFilters } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportCSV, exportPDF } from '@/lib/exportImport';

const ITEMS_PER_PAGE = 25;

export default function TransactionsPage() {
  const { state, deleteTransaction, deleteTransactions, getFilteredTransactions } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string; description?: string }>({ type: 'single' });

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

  // Multi-currency aware summary: group by currency
  const currenciesInView = useMemo(() => {
    const currencies = new Set(filteredTransactions.map(t => t.currency));
    return Array.from(currencies);
  }, [filteredTransactions]);

  const [summaryCurrency, setSummaryCurrency] = useState<string>(state.settings.defaultCurrency);

  // Ensure selected currency is valid
  const activeSummaryCurrency = currenciesInView.includes(summaryCurrency)
    ? summaryCurrency
    : (currenciesInView[0] || state.settings.defaultCurrency);

  const summary = useMemo(() => {
    const filtered = filteredTransactions.filter(t => t.currency === activeSummaryCurrency);
    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions, activeSummaryCurrency]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  // ============ Handlers ============

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteRequest = (id: string, description: string) => {
    setDeleteTarget({ type: 'single', id, description });
    setShowDeleteModal(true);
  };

  const handleBulkDeleteRequest = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget({ type: 'bulk' });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await deleteTransaction(deleteTarget.id);
    } else if (deleteTarget.type === 'bulk') {
      await deleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
    setShowDeleteModal(false);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    }
  };

  const getCategoryInfo = (categoryId: string) =>
    state.categories.find(c => c.id === categoryId);

  // ============ Pagination helpers ============

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  // ============ Loading State ============

  if (state.isLoading) {
    return (
      <>
        <Header title="Transaksi" />
        <div className="app-content">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="transaction-item">
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
        {/* Currency Tabs for Summary (only if multiple currencies) */}
        {currenciesInView.length > 1 && (
          <div className="summary-currency-tabs">
            {currenciesInView.map(code => (
              <button
                key={code}
                className={`summary-currency-tab ${activeSummaryCurrency === code ? 'active' : ''}`}
                onClick={() => setSummaryCurrency(code)}
              >
                {code}
              </button>
            ))}
          </div>
        )}

        {/* Summary Bar */}
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">Pemasukan ({activeSummaryCurrency})</span>
            <span className="summary-value income">
              +{formatCurrency(summary.income, activeSummaryCurrency)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Pengeluaran ({activeSummaryCurrency})</span>
            <span className="summary-value expense">
              -{formatCurrency(summary.expense, activeSummaryCurrency)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Nett ({activeSummaryCurrency})</span>
            <span className={`summary-value ${summary.net >= 0 ? 'income' : 'expense'}`}>
              {formatCurrency(summary.net, activeSummaryCurrency)}
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
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => updateFilters({ type: e.target.value as 'income' | 'expense' | 'all' })}
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            className="filter-select"
            value={filters.category || ''}
            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
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
            onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
            style={{ minWidth: '140px' }}
            title="Dari tanggal"
          />
          <input
            type="date"
            className="filter-select"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
            style={{ minWidth: '140px' }}
            title="Sampai tanggal"
          />
          <button className="btn btn-ghost btn-icon" onClick={() => exportCSV(filteredTransactions, state.categories)} title="Export CSV">
            <FileText size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => exportPDF(filteredTransactions, state.categories, 'Laporan Transaksi')} title="Export PDF">
            <Download size={16} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTransferForm(true)}>
            Transfer
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingTransaction(null); setShowForm(true); }}>
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="bulk-action-bar">
            <span className="bulk-action-count">{selectedIds.size} dipilih</span>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteRequest}>
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
            <div className="select-all-row">
              <input
                type="checkbox"
                checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                onChange={toggleSelectAll}
              />
              <span className="select-all-label">
                {filteredTransactions.length} transaksi
                {totalPages > 1 && ` · Hal. ${currentPage}/${totalPages}`}
              </span>
            </div>

            <div className="transaction-list">
              {paginatedTransactions.map((transaction) => {
                const category = getCategoryInfo(transaction.category);
                return (
                  <div key={transaction.id} className="transaction-item">
                    <input
                      type="checkbox"
                      className="transaction-checkbox"
                      checked={selectedIds.has(transaction.id)}
                      onChange={() => toggleSelect(transaction.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="transaction-icon"
                      style={{ background: category ? `${category.color}18` : 'var(--bg-glass)' }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-description">{transaction.description}</div>
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
                    <div className="transaction-actions">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <>
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                      <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
                    ) : (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="pagination-info">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                </div>
              </>
            )}
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

      <TransferForm
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Transaksi"
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
        {deleteTarget.type === 'single' ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Yakin ingin menghapus transaksi <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget.description}&quot;</strong>?
            Tindakan ini tidak bisa dibatalkan.
          </p>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Yakin ingin menghapus <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size} transaksi</strong> yang dipilih?
            Tindakan ini tidak bisa dibatalkan.
          </p>
        )}
      </Modal>
    </>
  );
}
