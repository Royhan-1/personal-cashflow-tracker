'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, calculateDashboardSummary, getCurrentMonth, getGreeting } from '@/lib/utils';

export default function BalanceCards() {
  const { state } = useApp();
  const currency = state.settings.defaultCurrency;
  const currentMonth = getCurrentMonth();

  const monthlySummary = useMemo(
    () => calculateDashboardSummary(state.transactions, currency, currentMonth),
    [state.transactions, currency, currentMonth]
  );

  const allTimeSummary = useMemo(
    () => calculateDashboardSummary(state.transactions, currency),
    [state.transactions, currency]
  );

  return (
    <div className="dashboard-grid">
      {/* Total Balance */}
      <div className="card stagger-item" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: 'var(--accent-primary-glow)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }} />
        <div className="card-header">
          <span className="card-title">Total Saldo</span>
          <Wallet size={20} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div className="card-value" style={{ position: 'relative', zIndex: 1 }}>
          {formatCurrency(allTimeSummary.netCashflow, currency)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {allTimeSummary.transactionCount} transaksi
        </div>
      </div>

      {/* Monthly Income */}
      <div className="card stagger-item" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: 'var(--accent-income-bg)',
          borderRadius: '50%',
          filter: 'blur(25px)',
        }} />
        <div className="card-header">
          <span className="card-title">Pemasukan Bulan Ini</span>
          <TrendingUp size={20} style={{ color: 'var(--accent-income)' }} />
        </div>
        <div className="card-value income" style={{ position: 'relative', zIndex: 1 }}>
          {formatCurrency(monthlySummary.totalIncome, currency)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          <span style={{ color: 'var(--accent-income)' }}>
            +{formatCurrency(monthlySummary.totalIncome, currency)}
          </span> bulan ini
        </div>
      </div>

      {/* Monthly Expense */}
      <div className="card stagger-item" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: 'var(--accent-expense-bg)',
          borderRadius: '50%',
          filter: 'blur(25px)',
        }} />
        <div className="card-header">
          <span className="card-title">Pengeluaran Bulan Ini</span>
          <TrendingDown size={20} style={{ color: 'var(--accent-expense)' }} />
        </div>
        <div className="card-value expense" style={{ position: 'relative', zIndex: 1 }}>
          {formatCurrency(monthlySummary.totalExpense, currency)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          <span style={{ color: 'var(--accent-expense)' }}>
            -{formatCurrency(monthlySummary.totalExpense, currency)}
          </span> bulan ini
        </div>
      </div>
    </div>
  );
}
