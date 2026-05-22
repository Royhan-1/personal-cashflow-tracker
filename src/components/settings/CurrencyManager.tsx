'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';

export default function CurrencyManager() {
  const { state, updateSettings, showToast } = useApp();

  const toggleCurrency = (code: string) => {
    const current = state.settings.enabledCurrencies;
    if (current.includes(code)) {
      if (current.length === 1) {
        showToast('warning', 'Minimal harus ada 1 mata uang aktif');
        return;
      }
      if (code === state.settings.defaultCurrency) {
        showToast('warning', 'Tidak bisa menonaktifkan mata uang default');
        return;
      }
      updateSettings({ enabledCurrencies: current.filter(c => c !== code) });
    } else {
      updateSettings({ enabledCurrencies: [...current, code] });
    }
  };

  const setDefaultCurrency = (code: string) => {
    const current = state.settings.enabledCurrencies;
    if (!current.includes(code)) {
      updateSettings({ defaultCurrency: code, enabledCurrencies: [...current, code] });
    } else {
      updateSettings({ defaultCurrency: code });
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">
        <DollarSign size={18} /> Mata Uang
      </h3>
      <p className="settings-section-desc">
        Aktifkan mata uang yang ingin kamu gunakan. Klik ⭐ untuk set sebagai default.
      </p>
      <div className="category-grid">
        {SUPPORTED_CURRENCIES.map(currency => {
          const isEnabled = state.settings.enabledCurrencies.includes(currency.code);
          const isDefault = state.settings.defaultCurrency === currency.code;
          return (
            <div
              key={currency.code}
              className={`category-card ${isDefault ? 'currency-default' : ''} ${!isEnabled ? 'currency-disabled' : ''}`}
            >
              <span className="currency-symbol">{currency.symbol}</span>
              <div style={{ flex: 1 }}>
                <div className="category-card-name">{currency.code}</div>
                <div className="category-card-type">{currency.name}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setDefaultCurrency(currency.code)}
                  title="Set sebagai default"
                  style={{ color: isDefault ? 'var(--accent-warning)' : 'var(--text-muted)', fontSize: '14px' }}
                >
                  {isDefault ? '⭐' : '☆'}
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => toggleCurrency(currency.code)}
                  title={isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                  style={{ fontSize: '12px' }}
                >
                  {isEnabled ? '✓' : '○'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
