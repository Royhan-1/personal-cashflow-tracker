'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Palette, HardDrive } from 'lucide-react';
import Header from '@/components/layout/Header';
import ExportSection from '@/components/settings/ExportSection';
import ImportSection from '@/components/settings/ImportSection';
import CategoryManager from '@/components/settings/CategoryManager';
import CurrencyManager from '@/components/settings/CurrencyManager';
import DangerZone from '@/components/settings/DangerZone';
import { useApp } from '@/context/AppContext';
import { APP_VERSION } from '@/lib/constants';
import { getStorageEstimate } from '@/lib/db';

export default function SettingsPage() {
  const { state, updateSettings } = useApp();
  const [storageInfo, setStorageInfo] = useState<{ used: string; count: number } | null>(null);

  useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, [state.transactions.length]);

  return (
    <>
      <Header title="Pengaturan" subtitle="Kelola preferensi dan data kamu" />
      <div className="app-content animate-fade-in">

        {/* Data & Backup */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <HardDrive size={18} /> Data & Backup
          </h3>
          <div className="export-import-grid">
            <ExportSection />
            <ImportSection />
          </div>
          {storageInfo && (
            <div className="settings-item" style={{ marginTop: '12px' }}>
              <div className="settings-item-info">
                <h4>Penyimpanan</h4>
                <p>{storageInfo.count} transaksi · {storageInfo.used} digunakan</p>
              </div>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Palette size={18} /> Tampilan
          </h3>
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Tema</h4>
              <p>Pilih tampilan terang atau gelap</p>
            </div>
            <div className="toggle-group" style={{ width: '200px' }}>
              <button
                className={`toggle-option ${state.settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateSettings({ theme: 'dark' })}
              >
                <Moon size={14} style={{ marginRight: '4px' }} /> Gelap
              </button>
              <button
                className={`toggle-option ${state.settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => updateSettings({ theme: 'light' })}
              >
                <Sun size={14} style={{ marginRight: '4px' }} /> Terang
              </button>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <CurrencyManager />

        {/* Categories */}
        <CategoryManager />

        {/* Danger Zone */}
        <DangerZone />

        {/* App info */}
        <div className="app-footer">
          CashFlow Tracker v{APP_VERSION} · Data disimpan secara lokal di browser
        </div>
      </div>
    </>
  );
}
