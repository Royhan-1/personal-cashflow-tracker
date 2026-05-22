'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      // We automatically redirect to login or home depending on if email confirmation is required.
      // Usually, it's better to show a success message or redirect to login.
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'var(--accent-primary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '3px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '16px',
            color: 'white'
          }}>
            <Wallet size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Buat Akun Baru</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Mulai mencatat keuangan dengan CashFlow</p>
        </div>

        {error && (
          <div className="info-banner warning" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="info-banner success" style={{ marginBottom: '20px', display: 'block' }}>
              Pendaftaran berhasil! Jika Anda diminta melakukan verifikasi, silakan cek email Anda. Jika tidak, Anda bisa langsung masuk.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
              Pergi ke Halaman Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ marginTop: '8px', width: '100%' }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Daftar Sekarang'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
