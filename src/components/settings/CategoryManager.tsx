'use client';

import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/constants';

export default function CategoryManager() {
  const { state, addCategory, deleteCategory, showToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6c5ce7');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleAdd = async () => {
    if (!name.trim()) {
      showToast('error', 'Nama kategori harus diisi');
      return;
    }
    await addCategory({ name: name.trim(), icon, color, type });
    setShowModal(false);
    setName('');
  };

  const handleDelete = async (id: string) => {
    const cat = state.categories.find(c => c.id === id);
    if (cat?.isDefault) {
      showToast('error', 'Kategori default tidak bisa dihapus');
      return;
    }
    const inUse = state.transactions.some(t => t.category === id);
    if (inUse) {
      showToast('warning', 'Kategori ini masih digunakan oleh beberapa transaksi');
      return;
    }
    await deleteCategory(id);
  };

  const incomeCategories = state.categories.filter(c => c.type === 'income');
  const expenseCategories = state.categories.filter(c => c.type === 'expense');

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">
        <Tag size={18} /> Kategori
        <button
          className="btn btn-primary btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} /> Tambah
        </button>
      </h3>

      <CategoryGroup title="PEMASUKAN" categories={incomeCategories} onDelete={handleDelete} />
      <CategoryGroup title="PENGELUARAN" categories={expenseCategories} onDelete={handleDelete} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Kategori"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleAdd}>Tambah</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Tipe</label>
          <div className="toggle-group">
            <button
              className={`toggle-option ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              Pengeluaran
            </button>
            <button
              className={`toggle-option ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              Pemasukan
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nama kategori"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ikon</label>
          <div className="icon-picker-grid">
            {CATEGORY_ICONS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`icon-picker-item ${icon === i ? 'active' : ''}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Warna</label>
          <div className="color-picker-grid">
            {CATEGORY_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`color-picker-item ${color === c ? 'active' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  onDelete,
}: {
  title: string;
  categories: { id: string; name: string; icon: string; color: string; isDefault: boolean }[];
  onDelete: (id: string) => void;
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
              <div className="category-card-type">{cat.isDefault ? 'Default' : 'Custom'}</div>
            </div>
            <div className="category-color-dot" style={{ background: cat.color }} />
            {!cat.isDefault && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => onDelete(cat.id)}
                style={{ color: 'var(--accent-expense)' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
