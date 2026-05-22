'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BalanceCards from '@/components/dashboard/BalanceCards';
import CashflowChart from '@/components/dashboard/CashflowChart';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import TransactionForm from '@/components/transactions/TransactionForm';
import { useApp } from '@/context/AppContext';
import { getGreeting } from '@/lib/utils';

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const { state } = useApp();
  const router = useRouter();

  if (state.isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="app-content">
          <div className="dashboard-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: '20px', width: '40%', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '36px', width: '70%' }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={`${getGreeting()} 👋`}
        subtitle="Ini ringkasan keuangan kamu"
      />
      <div className="app-content animate-fade-in">
        <BalanceCards />

        <div className="dashboard-charts">
          <CashflowChart />
          <CategoryBreakdown />
        </div>

        <RecentTransactions
          onViewAll={() => router.push('/transactions')}
        />
      </div>

      {/* FAB - Add Transaction */}
      <button
        className="fab"
        onClick={() => setShowForm(true)}
        aria-label="Tambah transaksi"
        title="Tambah transaksi baru"
      >
        <Plus size={24} />
      </button>

      <TransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </>
  );
}
