'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Target, Edit3, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import BudgetForm from '@/components/budgets/BudgetForm';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { Budget } from '@/lib/types';
import { getBudgetProgress, formatCurrency, getCurrentMonth, formatMonthYear } from '@/lib/utils';
import { subMonths, addMonths, parseISO, format } from 'date-fns';

export default function BudgetsPage() {
  const { state, deleteBudget } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // View mode
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const budgetProgress = useMemo(() => {
    return getBudgetProgress(state.budgets, state.transactions, selectedMonth);
  }, [state.budgets, state.transactions, selectedMonth]);

  const handlePrevMonth = () => {
    const d = parseISO(`${selectedMonth}-01`);
    setSelectedMonth(format(subMonths(d, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const d = parseISO(`${selectedMonth}-01`);
    setSelectedMonth(format(addMonths(d, 1), 'yyyy-MM'));
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteBudget(deleteTarget.id);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const getCategoryInfo = (categoryId: string) =>
    state.categories.find(c => c.id === categoryId);

  if (state.isLoading) {
    return (
      <>
        <Header title="Anggaran" />
        <div className="app-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="card skeleton" style={{ height: '120px', marginBottom: '16px' }} />
          ))}
        </div>
      </>
    );
  }

  const overBudgetCount = budgetProgress.filter(b => b.isOverBudget).length;

  return (
    <>
      <Header
        title="Anggaran"
        subtitle="Monitor batas pengeluaran bulananmu"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', padding: '4px', borderRadius: '8px' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={handlePrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 500, minWidth: '100px', textAlign: 'center' }}>
            {formatMonthYear(`${selectedMonth}-01`)}
          </span>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </Header>

      <div className="app-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            {overBudgetCount > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-expense)', background: 'var(--accent-expense-bg)', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 500 }}>
                <AlertTriangle size={16} />
                {overBudgetCount} kategori melebihi anggaran
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingBudget(null); setShowForm(true); }}>
            <Plus size={16} /> Tambah Anggaran
          </button>
        </div>

        {budgetProgress.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Target size={48} />
              </div>
              <p className="empty-state-title">Belum ada anggaran</p>
              <p className="empty-state-text">
                Tetapkan batas pengeluaran bulanan untuk setiap kategori (misal: Makanan, Belanja) agar pengeluaran lebih terkontrol.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {budgetProgress.map((bp) => {
              const cat = getCategoryInfo(bp.budget.categoryId);
              const color = cat?.color || 'var(--accent-primary)';
              
              let progressColor = color;
              if (bp.percentage > 90) progressColor = 'var(--accent-expense)';
              else if (bp.percentage > 75) progressColor = 'var(--accent-warning)';

              return (
                <div key={bp.budget.id} className="card stagger-item" style={{ border: bp.isOverBudget ? '1px solid var(--accent-expense)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="transaction-icon" style={{ background: `${color}18`, width: '40px', height: '40px' }}>
                        {cat?.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{cat?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Batas: {formatCurrency(bp.budget.amount, bp.budget.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="transaction-actions">
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleEdit(bp.budget)}
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDeleteRequest(bp.budget.id, cat?.name || 'Unknown')}
                        title="Hapus"
                        style={{ color: 'var(--accent-expense)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Terpakai</span>
                      <span style={{ fontWeight: 600, color: bp.isOverBudget ? 'var(--accent-expense)' : 'var(--text-primary)' }}>
                        {formatCurrency(bp.spent, bp.budget.currency)}
                      </span>
                    </div>
                    
                    <div style={{ height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(bp.percentage, 100)}%`,
                          background: progressColor,
                          borderRadius: '5px',
                          transition: 'width 0.5s ease-out, background 0.3s',
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                      <span style={{ color: bp.isOverBudget ? 'var(--accent-expense)' : 'var(--text-muted)' }}>
                        {bp.percentage.toFixed(1)}%
                      </span>
                      <span style={{ fontWeight: 500, color: bp.isOverBudget ? 'var(--accent-expense)' : 'var(--accent-primary)' }}>
                        {bp.isOverBudget 
                          ? `Overbudget ${formatCurrency(Math.abs(bp.remaining), bp.budget.currency)}`
                          : `Sisa ${formatCurrency(bp.remaining, bp.budget.currency)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BudgetForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingBudget(null); }}
        editBudget={editingBudget}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Anggaran"
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
          Yakin ingin menghapus batas anggaran untuk kategori <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteTarget?.name}&quot;</strong>?
          Transaksi yang sudah tercatat tidak akan terpengaruh.
        </p>
      </Modal>
    </>
  );
}
