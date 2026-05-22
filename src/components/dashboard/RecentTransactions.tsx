'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecentTransactionsProps {
  limit?: number;
  onViewAll?: () => void;
  onClickTransaction?: (id: string) => void;
  selectedMonth?: string; // 'YYYY-MM'
}

export default function RecentTransactions({ limit = 7, onViewAll, onClickTransaction, selectedMonth }: RecentTransactionsProps) {
  const { state } = useApp();

  const recentTransactions = useMemo(() => {
    let txs = [...state.transactions];
    if (selectedMonth) {
      txs = txs.filter(t => t.date.startsWith(selectedMonth));
    }
    return txs
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }, [state.transactions, limit, selectedMonth]);

  const getCategoryInfo = (categoryId: string) => {
    return state.categories.find(c => c.id === categoryId);
  };

  if (recentTransactions.length === 0) {
    return (
      <div className="card stagger-item">
        <div className="card-header">
          <span className="card-title">Transaksi Terakhir</span>
        </div>
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">
            <ArrowRight size={40} />
          </div>
          <p className="empty-state-title">Belum ada transaksi</p>
          <p className="empty-state-text">
            Mulai catat pemasukan dan pengeluaran kamu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card stagger-item">
      <div className="card-header">
        <span className="card-title">Transaksi Terakhir</span>
        {onViewAll && (
          <button className="btn btn-ghost btn-sm" onClick={onViewAll}>
            Lihat Semua →
          </button>
        )}
      </div>
      <div className="transaction-list">
        {recentTransactions.map((transaction) => {
          const category = getCategoryInfo(transaction.category);
          return (
            <div
              key={transaction.id}
              className="transaction-item"
              onClick={() => onClickTransaction?.(transaction.id)}
            >
              <div
                className="transaction-icon"
                style={{
                  background: category
                    ? `${category.color}18`
                    : 'var(--bg-glass)',
                }}
              >
                {category?.icon || '📦'}
              </div>
              <div className="transaction-info">
                <div className="transaction-description">
                  {transaction.description}
                </div>
                <div className="transaction-meta">
                  <span>{category?.name || 'Uncategorized'}</span>
                  <span>·</span>
                  <span>{formatDate(transaction.date)}</span>
                </div>
              </div>
              <div className={`transaction-amount ${transaction.type}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
