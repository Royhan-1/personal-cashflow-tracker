'use client';

import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BalanceCards from '@/components/dashboard/BalanceCards';
import CashflowChart from '@/components/dashboard/CashflowChart';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import BudgetOverview from '@/components/dashboard/BudgetOverview';
import TransactionForm from '@/components/transactions/TransactionForm';
import { useApp } from '@/context/AppContext';
import { getGreeting, getCurrentMonth } from '@/lib/utils';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const { state } = useApp();
  const router = useRouter();

  // Month picker state
  const currentMonth = getCurrentMonth(); // 'YYYY-MM'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const isCurrentMonth = selectedMonth === currentMonth;

  const selectedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
  }, [selectedMonth]);

  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

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
        {/* Month Picker */}
        <div className="month-picker" style={{ marginBottom: '20px' }}>
          <button className="month-picker-btn" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="month-picker-label">{selectedMonthLabel}</span>
          <button className="month-picker-btn" onClick={() => navigateMonth(1)}>
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              className="month-picker-reset"
              onClick={() => setSelectedMonth(currentMonth)}
            >
              Hari ini
            </button>
          )}
        </div>

        <BalanceCards selectedMonth={selectedMonth} />

        <div className="dashboard-charts">
          <CashflowChart />
          <CategoryBreakdown selectedMonth={selectedMonth} />
        </div>

        <RecentTransactions
          limit={5}
          onViewAll={() => router.push('/transactions')}
          selectedMonth={selectedMonth}
        />
        <BudgetOverview selectedMonth={selectedMonth} />
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
