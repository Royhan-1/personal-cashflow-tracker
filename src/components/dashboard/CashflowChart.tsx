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
        backgroundColor: CHART_COLORS.income,
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 2,
        borderRadius: 0,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
      {
        label: 'Pengeluaran',
        data: monthlyData.map(d => d.expense),
        backgroundColor: CHART_COLORS.expense,
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 2,
        borderRadius: 0,
        barPercentage: 0.5,
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
        backgroundColor: isDark ? '#242424' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#000000',
        bodyColor: isDark ? '#e0e0e0' : '#111111',
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 3,
        cornerRadius: 0,
        padding: 12,
        titleFont: { family: 'Space Grotesk', weight: 'bold' as const },
        bodyFont: { family: 'Space Grotesk', weight: 'bold' as const },
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
