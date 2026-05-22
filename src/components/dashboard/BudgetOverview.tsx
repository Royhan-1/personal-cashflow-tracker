'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCompactCurrency } from '@/lib/utils';
import { getBudgetProgress } from '@/lib/utils';
import { Target } from 'lucide-react';
import Link from 'next/link';

interface BudgetOverviewProps {
  selectedMonth: string; // 'YYYY-MM'
}

export default function BudgetOverview({ selectedMonth }: BudgetOverviewProps) {
  const { state } = useApp();

  const budgetProgress = useMemo(() => {
    return getBudgetProgress(state.budgets, state.transactions, selectedMonth);
  }, [state.budgets, state.transactions, selectedMonth]);

  if (state.budgets.length === 0) {
    return null; // Don't show if no budgets are set
  }

  const getCategoryInfo = (categoryId: string) => {
    return state.categories.find(c => c.id === categoryId);
  };

  return (
    <div className="card stagger-item">
      <div className="card-header">
        <span className="card-title">
          <Target size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Status Anggaran
        </span>
        <Link href="/budgets" className="btn btn-ghost btn-sm">
          Kelola →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
        {budgetProgress.map((bp) => {
          const cat = getCategoryInfo(bp.budget.categoryId);
          const color = cat?.color || 'var(--accent-primary)';
          
          let progressColor = color;
          if (bp.percentage > 90) progressColor = 'var(--accent-expense)';
          else if (bp.percentage > 75) progressColor = 'var(--accent-warning)';

          return (
            <div key={bp.budget.id} className="budget-progress-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{cat?.icon}</span>
                  <span style={{ fontWeight: 500 }}>{cat?.name}</span>
                </div>
                <div style={{ fontWeight: 600, color: bp.isOverBudget ? 'var(--accent-expense)' : 'var(--text-primary)' }}>
                  {formatCompactCurrency(bp.spent, bp.budget.currency)} / {formatCompactCurrency(bp.budget.amount, bp.budget.currency)}
                </div>
              </div>
              
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(bp.percentage, 100)}%`,
                    background: progressColor,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out, background 0.3s',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{bp.percentage.toFixed(0)}%</span>
                <span>
                  {bp.isOverBudget 
                    ? `Overbudget ${formatCompactCurrency(Math.abs(bp.remaining), bp.budget.currency)}`
                    : `Sisa ${formatCompactCurrency(bp.remaining, bp.budget.currency)}`
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
