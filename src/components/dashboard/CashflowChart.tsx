'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useApp } from '@/context/AppContext';
import { getMonthlyData } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

export default function CashflowChart() {
  const { state } = useApp();
  const currency = state.settings.defaultCurrency;
  const isDark = state.settings.theme === 'dark';

  const monthlyData = useMemo(
    () => getMonthlyData(state.transactions, currency, 6),
    [state.transactions, currency]
  );

  const data = {
    labels: monthlyData.map(d => d.label),
    datasets: [
      {
        label: 'Pemasukan',
        data: monthlyData.map(d => d.income),
        backgroundColor: 'rgba(0, 212, 161, 0.7)',
        borderColor: CHART_COLORS.income,
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.4,
        categoryPercentage: 0.7,
      },
      {
        label: 'Pengeluaran',
        data: monthlyData.map(d => d.expense),
        backgroundColor: 'rgba(255, 107, 122, 0.7)',
        borderColor: CHART_COLORS.expense,
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.4,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#8b8ba3' : '#6b6b80',
          font: { family: 'Inter', size: 12 },
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 3,
          useBorderRadius: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1c1c2a' : '#ffffff',
        titleColor: isDark ? '#eaeaf2' : '#1a1a2e',
        bodyColor: isDark ? '#8b8ba3' : '#6b6b80',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter', weight: 'bold' as const },
        bodyFont: { family: 'Inter' },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency,
              minimumFractionDigits: 0,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#4a4a5e' : '#a0a0b5',
          font: { family: 'Inter', size: 11 },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: isDark ? CHART_COLORS.gridLineDark : CHART_COLORS.gridLineLight,
        },
        ticks: {
          color: isDark ? '#4a4a5e' : '#a0a0b5',
          font: { family: 'Inter', size: 11 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function (value: any) {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`;
            if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
            return num.toString();
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="card stagger-item">
      <div className="card-header">
        <span className="card-title">Cashflow 6 Bulan Terakhir</span>
      </div>
      <div style={{ height: '280px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
