'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, calculateDashboardSummary } from '@/lib/utils';

interface BalanceCardsProps {
  selectedMonth: string; // 'YYYY-MM'
}

export default function BalanceCards({ selectedMonth }: BalanceCardsProps) {
  const { state } = useApp();
  const currency = state.settings.defaultCurrency;

  const monthlySummary = useMemo(
    () => calculateDashboardSummary(state.transactions, currency, selectedMonth),
    [state.transactions, currency, selectedMonth]
  );

  const allTimeSummary = useMemo(
    () => calculateDashboardSummary(state.transactions, currency),
    [state.transactions, currency]
  );

  return (
    <div className="dashboard-grid">
      {/* Total Balance */}
      <div className="card stagger-item" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="balance-card-glow primary" />
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
        <div className="balance-card-glow income" />
        <div className="card-header">
          <span className="card-title">Pemasukan</span>
          <TrendingUp size={20} style={{ color: 'var(--accent-income)' }} />
        </div>
        <div className="card-value income" style={{ position: 'relative', zIndex: 1 }}>
          {formatCurrency(monthlySummary.totalIncome, currency)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          <span style={{ color: 'var(--accent-income)' }}>
            +{formatCurrency(monthlySummary.totalIncome, currency)}
          </span>{' '}bulan ini
        </div>
      </div>

      {/* Monthly Expense */}
      <div className="card stagger-item" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="balance-card-glow expense" />
        <div className="card-header">
          <span className="card-title">Pengeluaran</span>
          <TrendingDown size={20} style={{ color: 'var(--accent-expense)' }} />
        </div>
        <div className="card-value expense" style={{ position: 'relative', zIndex: 1 }}>
          {formatCurrency(monthlySummary.totalExpense, currency)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          <span style={{ color: 'var(--accent-expense)' }}>
            -{formatCurrency(monthlySummary.totalExpense, currency)}
          </span>{' '}bulan ini
        </div>
      </div>
    </div>
  );
}
