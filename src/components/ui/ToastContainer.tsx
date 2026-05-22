'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp, Toast as ToastType } from '@/context/AppContext';

const iconMap: Record<string, React.ReactNode> = {
  success: <CheckCircle size={18} style={{ color: 'var(--accent-income)' }} />,
  error: <AlertCircle size={18} style={{ color: 'var(--accent-expense)' }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--accent-warning)' }} />,
  info: <Info size={18} style={{ color: 'var(--accent-primary)' }} />,
};

export default function ToastContainer() {
  const { state } = useApp();

  if (state.toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {state.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastType }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      {iconMap[toast.type]}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
