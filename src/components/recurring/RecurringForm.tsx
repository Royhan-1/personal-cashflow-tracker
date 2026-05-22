'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { RecurringTransaction } from '@/lib/types';
import { getToday } from '@/lib/utils';

interface RecurringFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: RecurringTransaction | null;
}

export default function RecurringForm({ isOpen, onClose, editTransaction }: RecurringFormProps) {
  const { state, addRecurringTransaction, updateRecurringTransaction } = useApp();

  const defaultForm = {
    type: 'expense' as 'income' | 'expense',
    amount: '',
    currency: state.settings.defaultCurrency,
    category: '',
    description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: getToday(),
    endDate: '',
    isActive: true,
    notes: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTransaction) {
      setForm({
        type: editTransaction.type,
        amount: editTransaction.amount.toString(),
        currency: editTransaction.currency,
        category: editTransaction.category,
        description: editTransaction.description,
        frequency: editTransaction.frequency,
        startDate: editTransaction.startDate,
        endDate: editTransaction.endDate || '',
        isActive: editTransaction.isActive,
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
    if (!form.startDate) {
      newErrors.startDate = 'Pilih tanggal mulai';
    }
    if (form.endDate && form.endDate < form.startDate) {
      newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      type: form.type,
      amount: parseFloat(form.amount),
      currency: form.currency,
      category: form.category,
      description: form.description.trim(),
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
      notes: form.notes?.trim() || undefined,
    };

    if (editTransaction) {
      await updateRecurringTransaction(editTransaction.id, data);
    } else {
      await addRecurringTransaction(data);
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
      title={editTransaction ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}
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
            placeholder="Contoh: Gaji Bulanan, Cicilan Motor"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>

        <div className="form-row">
          {/* Frequency */}
          <div className="form-group">
            <label className="form-label">Frekuensi</label>
            <select
              className="form-select"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="toggle-group" style={{ height: '38px' }}>
              <button
                type="button"
                className={`toggle-option ${form.isActive ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isActive: true })}
                style={form.isActive ? { background: 'var(--accent-primary)', color: 'white' } : {}}
              >
                Aktif
              </button>
              <button
                type="button"
                className={`toggle-option ${!form.isActive ? 'active' : ''}`}
                onClick={() => setForm({ ...form, isActive: false })}
                style={!form.isActive ? { background: 'var(--accent-expense)', color: 'white' } : {}}
              >
                Nonaktif
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          {/* Start Date */}
          <div className="form-group">
            <label className="form-label">Mulai Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            {errors.startDate && <span className="form-error">{errors.startDate}</span>}
          </div>
          {/* End Date */}
          <div className="form-group">
            <label className="form-label">Berakhir Tanggal (Opsional)</label>
            <input
              type="date"
              className="form-input"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            {errors.endDate && <span className="form-error">{errors.endDate}</span>}
          </div>
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
