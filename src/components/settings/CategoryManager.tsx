'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function CategoryManager() {
  const { state } = useApp();
  const incomeCategories = state.categories.filter(c => c.type === 'income');
  const expenseCategories = state.categories.filter(c => c.type === 'expense');

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">
        <Tag size={18} /> Kategori (Bawaan)
      </h3>

      <CategoryGroup title="PEMASUKAN" categories={incomeCategories} />
      <CategoryGroup title="PENGELUARAN" categories={expenseCategories} />
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
}: {
  title: string;
  categories: { id: string; name: string; icon: string; color: string; isDefault: boolean }[];
}) {
  return (
    <>
      <h4 className="category-group-title">{title}</h4>
      <div className="category-grid">
        {categories.map(cat => (
          <div key={cat.id} className="category-card">
            <span className="category-card-icon">{cat.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="category-card-name">{cat.name}</div>
            </div>
            <div className="category-color-dot" style={{ background: cat.color }} />
          </div>
        ))}
      </div>
    </>
  );
}
