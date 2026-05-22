'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useApp } from '@/context/AppContext';
import { getMonthlyData, getCategorySummary, formatCurrency, getCurrentMonth } from '@/lib/utils';
import { exportPDF } from '@/lib/exportImport';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { CHART_COLORS } from '@/lib/constants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function ReportsPage() {
  const { state } = useApp();
  const currency = state.settings.defaultCurrency;
  const isDark = state.settings.theme === 'dark';

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const yearlyData = useMemo(() => getMonthlyData(state.transactions, currency, 12), [state.transactions, currency]);
  
  const expenseCategories = useMemo(() => {
    return getCategorySummary(state.transactions, state.categories, currency, 'expense', selectedMonth);
  }, [state.transactions, state.categories, currency, selectedMonth]);

  const incomeCategories = useMemo(() => {
    return getCategorySummary(state.transactions, state.categories, currency, 'income', selectedMonth);
  }, [state.transactions, state.categories, currency, selectedMonth]);

  if (state.isLoading) {
    return (
      <>
        <Header title="Laporan" />
        <div className="app-content">
          <div className="card skeleton" style={{ height: '300px', marginBottom: '16px' }} />
        </div>
      </>
    );
  }

  // Trend Chart Data
  const trendData = {
    labels: yearlyData.map(d => d.label),
    datasets: [
      {
        label: 'Pemasukan',
        data: yearlyData.map(d => d.income),
        borderColor: CHART_COLORS.income,
        borderWidth: 3,
        tension: 0,
        fill: false,
      },
      {
        label: 'Pengeluaran',
        data: yearlyData.map(d => d.expense),
        borderColor: CHART_COLORS.expense,
        borderWidth: 3,
        tension: 0,
        fill: false,
      },
      {
        label: 'Net',
        data: yearlyData.map(d => d.net),
        borderColor: CHART_COLORS.net,
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0,
        fill: false,
      }
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDark ? '#8b8ba3' : '#6b6b80', font: { family: 'Inter' } }
      },
      tooltip: {
        backgroundColor: isDark ? '#242424' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#000000',
        bodyColor: isDark ? '#e0e0e0' : '#111111',
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 3,
        cornerRadius: 0,
        padding: 12,
        titleFont: { family: 'Space Grotesk', weight: 'bold' as const },
        bodyFont: { family: 'Space Grotesk', weight: 'bold' as const },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? '#4a4a5e' : '#a0a0b5' } },
      y: { 
        grid: { color: isDark ? CHART_COLORS.gridLineDark : CHART_COLORS.gridLineLight },
        ticks: { 
          color: isDark ? '#4a4a5e' : '#a0a0b5',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (value: any) => {
            const num = parseFloat(value);
            if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`;
            if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
            return num;
          }
        }
      }
    }
  };

  // Donut Chart Data
  const donutData = {
    labels: expenseCategories.map(c => c.categoryName),
    datasets: [{
      data: expenseCategories.map(c => c.total),
      backgroundColor: expenseCategories.map(c => c.categoryColor),
      borderWidth: 2,
      borderColor: isDark ? '#ffffff' : '#000000',
      hoverOffset: 0,
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#242424' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#000000',
        bodyColor: isDark ? '#e0e0e0' : '#111111',
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 3,
        cornerRadius: 0,
        padding: 12,
        titleFont: { family: 'Space Grotesk', weight: 'bold' as const },
        bodyFont: { family: 'Space Grotesk', weight: 'bold' as const },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            const val = context.raw;
            const total = context.chart._metasets[context.datasetIndex].total;
            const percentage = ((val / total) * 100).toFixed(1);
            return ` ${context.label}: ${formatCurrency(val, currency)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <>
      <Header title="Laporan & Analitik" subtitle="Analisis cashflow jangka panjang" />
      
      <div className="app-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Trend 12 Bulan */}
        <div className="card stagger-item">
          <div className="card-header">
            <span className="card-title">Tren 12 Bulan Terakhir</span>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>

        {/* Analisis Bulan Spesifik */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Detail Kategori</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const monthTxs = state.transactions.filter(t => t.date.startsWith(selectedMonth));
                exportPDF(monthTxs, state.categories, `Laporan Transaksi ${selectedMonth}`);
              }}
            >
              Export PDF
            </button>
            <input 
              type="month" 
              className="form-input" 
              style={{ width: 'auto', padding: '6px 12px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Pengeluaran */}
          <div className="card stagger-item">
            <div className="card-header">
              <span className="card-title">Distribusi Pengeluaran</span>
            </div>
            {expenseCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ height: '220px', position: 'relative' }}>
                  <Doughnut data={donutData} options={donutOptions} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total</div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-expense)' }}>
                      {formatCurrency(expenseCategories.reduce((s, c) => s + c.total, 0), currency)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {expenseCategories.slice(0, 5).map(cat => (
                    <div key={cat.categoryId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: cat.categoryColor }} />
                        <span>{cat.categoryName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 500 }}>{formatCurrency(cat.total, currency)}</span>
                        <span style={{ color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>{cat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>Belum ada pengeluaran di bulan ini.</div>
            )}
          </div>

          {/* Pemasukan */}
          <div className="card stagger-item" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <span className="card-title">Sumber Pemasukan</span>
            </div>
            {incomeCategories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomeCategories.map(cat => (
                  <div key={cat.categoryId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="transaction-icon" style={{ background: `${cat.categoryColor}18`, width: '36px', height: '36px' }}>
                        {cat.categoryIcon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{cat.categoryName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.count} transaksi</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-income)' }}>
                        +{formatCurrency(cat.total, currency)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {cat.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>Belum ada pemasukan di bulan ini.</div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
