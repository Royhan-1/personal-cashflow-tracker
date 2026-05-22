'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { Budget } from '@/lib/types';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editBudget?: Budget | null;
}

export default function BudgetForm({ isOpen, onClose, editBudget }: BudgetFormProps) {
  const { state, addBudget, updateBudget } = useApp();
  const enabledCurrencies = state.settings.enabledCurrencies;

  // Only allow budgeting for expense categories
  const expenseCategories = state.categories.filter(c => c.type === 'expense' || c.type === 'both');

  const defaultForm = {
    categoryId: '',
    amount: '',
    currency: state.settings.defaultCurrency,
    period: 'monthly' as const,
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editBudget) {
      setForm({
        categoryId: editBudget.categoryId,
        amount: editBudget.amount.toString(),
        currency: editBudget.currency,
        period: editBudget.period,
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editBudget, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.categoryId) {
      newErrors.categoryId = 'Pilih kategori';
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Masukkan batas anggaran yang valid';
    }

    // Check if category already has a budget and it's not being edited
    if (!editBudget && form.categoryId) {
      const exists = state.budgets.some(b => b.categoryId === form.categoryId);
      if (exists) {
        newErrors.categoryId = 'Kategori ini sudah memiliki anggaran';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      categoryId: form.categoryId,
      amount: parseFloat(form.amount),
      currency: form.currency,
      period: form.period,
    };

    if (editBudget) {
      await updateBudget(editBudget.id, data);
    } else {
      await addBudget(data);
    }

    setForm(defaultForm);
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editBudget ? 'Edit Anggaran' : 'Set Anggaran Baru'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editBudget ? 'Simpan' : 'Tambah'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="info-banner info" style={{ marginBottom: '16px' }}>
          Anggaran dihitung secara bulanan untuk membantu kamu memonitor pengeluaran per kategori.
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Kategori Pengeluaran</label>
          <select
            className="form-select"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            disabled={!!editBudget} // Don't allow changing category when editing
          >
            <option value="">Pilih kategori...</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
        </div>

        {/* Amount + Currency */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Batas Anggaran</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              min="0"
              step="any"
              autoFocus={!editBudget}
            />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Mata Uang</label>
            <select
              className="form-select"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {enabledCurrencies.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

      </form>
    </Modal>
  );
}
