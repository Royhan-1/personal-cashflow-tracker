'use client';

import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { getToday } from '@/lib/utils';
import { Transaction } from '@/lib/types';

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferForm({ isOpen, onClose }: TransferFormProps) {
  const { state, addTransaction, showToast } = useApp();
  const enabledCurrencies = state.settings.enabledCurrencies;

  const [amountFrom, setAmountFrom] = useState('');
  const [currencyFrom, setCurrencyFrom] = useState(enabledCurrencies[0] || '');
  const [amountTo, setAmountTo] = useState('');
  const [currencyTo, setCurrencyTo] = useState(enabledCurrencies.length > 1 ? enabledCurrencies[1] : enabledCurrencies[0] || '');
  const [date, setDate] = useState(getToday());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amountFrom || parseFloat(amountFrom) <= 0) {
      newErrors.amountFrom = 'Masukkan jumlah yang valid';
    }
    if (!amountTo || parseFloat(amountTo) <= 0) {
      newErrors.amountTo = 'Masukkan jumlah yang valid';
    }
    if (currencyFrom === currencyTo) {
      newErrors.currency = 'Mata uang asal dan tujuan harus berbeda';
    }
    if (!date) {
      newErrors.date = 'Pilih tanggal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // We'll use the first available category for both, or find a transfer category if available.
    // For safety, we use the first available expense/income category or just the first category
    const expenseCategory = state.categories.find(c => c.type === 'expense' || c.type === 'both')?.id || state.categories[0]?.id || '';
    const incomeCategory = state.categories.find(c => c.type === 'income' || c.type === 'both')?.id || state.categories[0]?.id || '';

    const transferId = `tf-${Date.now()}`;
    const description = `Transfer dari ${currencyFrom} ke ${currencyTo}`;

    const expenseTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'expense',
      amount: parseFloat(amountFrom),
      currency: currencyFrom,
      category: expenseCategory,
      description: description,
      date,
      notes: notes.trim() || undefined,
      linkedTransferId: transferId,
    };

    const incomeTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'income',
      amount: parseFloat(amountTo),
      currency: currencyTo,
      category: incomeCategory,
      description: description,
      date,
      notes: notes.trim() || undefined,
      linkedTransferId: transferId,
    };

    try {
      await addTransaction(expenseTx);
      await addTransaction(incomeTx);
      showToast('success', 'Transfer antar mata uang berhasil dicatat');
      handleClose();
    } catch (err) {
      showToast('error', 'Gagal mencatat transfer');
    }
  };

  const handleClose = () => {
    setAmountFrom('');
    setAmountTo('');
    setNotes('');
    setErrors({});
    onClose();
  };

  if (enabledCurrencies.length < 2) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Antar Mata Uang">
        <div className="empty-state">
          <p className="empty-state-text">
            Fitur transfer membutuhkan minimal 2 mata uang yang aktif. Silakan aktifkan mata uang lain di Pengaturan.
          </p>
          <button className="btn btn-primary" onClick={handleClose}>Tutup</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Transfer Antar Mata Uang"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Transfer
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="info-banner warning" style={{ marginBottom: '16px' }}>
          Transfer akan dicatat sebagai 2 transaksi terpisah: pengeluaran pada mata uang asal, dan pemasukan pada mata uang tujuan.
        </div>

        {/* Amount From */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Jumlah Keluar</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
              min="0"
              step="any"
            />
            {errors.amountFrom && <span className="form-error">{errors.amountFrom}</span>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Dari Mata Uang</label>
            <select
              className="form-select"
              value={currencyFrom}
              onChange={(e) => setCurrencyFrom(e.target.value)}
            >
              {enabledCurrencies.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', color: 'var(--text-muted)' }}>
          <ArrowRightLeft size={20} />
        </div>

        {/* Amount To */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Jumlah Diterima</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={amountTo}
              onChange={(e) => setAmountTo(e.target.value)}
              min="0"
              step="any"
            />
            {errors.amountTo && <span className="form-error">{errors.amountTo}</span>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Ke Mata Uang</label>
            <select
              className="form-select"
              value={currencyTo}
              onChange={(e) => setCurrencyTo(e.target.value)}
            >
              {enabledCurrencies.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
        {errors.currency && <span className="form-error" style={{ display: 'block', marginTop: '4px' }}>{errors.currency}</span>}

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Tanggal</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Catatan (opsional)</label>
          <textarea
            className="form-textarea"
            placeholder="Misal: Biaya konversi 1 USD = 15.000 IDR"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
