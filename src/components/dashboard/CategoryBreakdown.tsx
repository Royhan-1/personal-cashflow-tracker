'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useApp } from '@/context/AppContext';
import { getCategorySummary, formatCurrency } from '@/lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryBreakdownProps {
  selectedMonth: string;
}

export default function CategoryBreakdown({ selectedMonth }: CategoryBreakdownProps) {
  const { state } = useApp();
  const currency = state.settings.defaultCurrency;
  const isDark = state.settings.theme === 'dark';

  const categorySummary = useMemo(
    () => getCategorySummary(state.transactions, state.categories, currency, 'expense', selectedMonth),
    [state.transactions, state.categories, currency, selectedMonth]
  );

  if (categorySummary.length === 0) {
    return (
      <div className="card stagger-item">
        <div className="card-header">
          <span className="card-title">Pengeluaran per Kategori</span>
        </div>
        <div className="empty-state" style={{ padding: '30px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Belum ada data pengeluaran bulan ini
          </p>
        </div>
      </div>
    );
  }

  const data = {
    labels: categorySummary.map(s => `${s.categoryIcon} ${s.categoryName}`),
    datasets: [
      {
        data: categorySummary.map(s => s.total),
        backgroundColor: categorySummary.map(s => s.categoryColor),
        borderColor: isDark ? '#ffffff' : '#000000',
        borderWidth: 2,
        hoverOffset: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
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
            const percentage = categorySummary[context.dataIndex]?.percentage?.toFixed(1) ?? '0';
            return ` ${formatCurrency(context.parsed, currency)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="card stagger-item">
      <div className="card-header">
        <span className="card-title">Pengeluaran per Kategori</span>
      </div>
      <div style={{ height: '200px', marginBottom: '16px' }}>
        <Doughnut data={data} options={options} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categorySummary.slice(0, 5).map((s) => (
          <div
            key={s.categoryId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: s.categoryColor,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {s.categoryIcon} {s.categoryName}
              </span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {s.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
