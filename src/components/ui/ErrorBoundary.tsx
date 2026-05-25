'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💥</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Terjadi Kesalahan
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              Aplikasi mengalami masalah yang tidak terduga. Silakan muat ulang halaman.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'var(--bg-tertiary)',
                padding: '12px',
                borderRadius: 'var(--border-radius-md)',
                border: '2px solid var(--border-color)',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                color: 'var(--accent-expense)',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ width: '100%' }}
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
