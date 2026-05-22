'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { Transaction, TransactionFormData } from '@/lib/types';
import { getToday } from '@/lib/utils';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export default function TransactionForm({ isOpen, onClose, editTransaction }: TransactionFormProps) {
  const { state, addTransaction, updateTransaction } = useApp();

  const defaultForm: TransactionFormData = {
    type: 'expense',
    amount: '',
    currency: state.settings.defaultCurrency,
    category: '',
    description: '',
    date: getToday(),
    notes: '',
  };

  const [form, setForm] = useState<TransactionFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTransaction) {
      setForm({
        type: editTransaction.type,
        amount: editTransaction.amount.toString(),
        currency: editTransaction.currency,
        category: editTransaction.category,
        description: editTransaction.description,
        date: editTransaction.date,
        notes: editTransaction.notes || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTransaction, isOpen]);

  const filteredCategories = state.categories.filter(
    c => c.type === form.type || c.type === 'both'
  );

  const enabledCurrencies = state.settings.enabledCurrencies;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Masukkan jumlah yang valid';
    }
    if (!form.category) {
      newErrors.category = 'Pilih kategori';
    }
    if (!form.description.trim()) {
      newErrors.description = 'Masukkan deskripsi';
    }
    if (!form.date) {
      newErrors.date = 'Pilih tanggal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      type: form.type as 'income' | 'expense',
      amount: parseFloat(form.amount),
      currency: form.currency,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      notes: form.notes?.trim() || undefined,
    };

    if (editTransaction) {
      await updateTransaction(editTransaction.id, data);
    } else {
      await addTransaction(data);
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
      title={editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editTransaction ? 'Simpan' : 'Tambah'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Type Toggle */}
        <div className="form-group">
          <label className="form-label">Tipe</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-option ${form.type === 'expense' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, type: 'expense', category: '' })}
              style={form.type === 'expense' ? { background: 'var(--accent-expense)', color: 'white' } : {}}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={`toggle-option ${form.type === 'income' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, type: 'income', category: '' })}
              style={form.type === 'income' ? { background: 'var(--accent-income)', color: 'white' } : {}}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* Amount + Currency */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Jumlah</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              min="0"
              step="any"
              autoFocus
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

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Pilih kategori...</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <span className="form-error">{errors.category}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Deskripsi</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Makan siang di warteg"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Tanggal</label>
          <input
            type="date"
            className="form-input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>

        {/* Notes (optional) */}
        <div className="form-group">
          <label className="form-label">Catatan (opsional)</label>
          <textarea
            className="form-textarea"
            placeholder="Catatan tambahan..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
