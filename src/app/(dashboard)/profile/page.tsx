'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { clearAllData } from '@/lib/db';
import { syncDatabase } from '@/lib/sync';
import { User, LogOut, RefreshCw, Trash2, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUserId(user.id);
        
        // Fetch from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setMessage({ text: 'Profil berhasil diperbarui!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menyimpan profil', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncDatabase();
    setIsSyncing(false);
    setMessage({ text: 'Sinkronisasi dengan cloud berhasil', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar? Semua data lokal Anda akan dibersihkan.')) {
      await clearAllData();
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const handleClearCache = async () => {
    if (confirm('PERINGATAN: Ini akan menghapus semua data di perangkat ini. Data yang belum disinkronisasi ke cloud akan hilang secara permanen. Lanjutkan?')) {
      await clearAllData();
      setMessage({ text: 'Cache lokal berhasil dibersihkan', type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Profil & Akun" />
        <div className="app-content">
          <div className="card skeleton" style={{ height: '300px' }}></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profil & Akun" subtitle="Kelola identitas dan sinkronisasi" />
      
      <div className="app-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {message.text && (
          <div className={`info-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="card stagger-item">
          <div className="card-header">
            <span className="card-title">Informasi Dasar</span>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '0', // Neobrutalism sharp edges
                border: '3px solid var(--border-color)',
                boxShadow: '4px 4px 0 var(--border-color)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={40} color="var(--text-muted)" />
                )}
              </div>
            </div>
            
            <form onSubmit={handleSaveProfile} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '250px' }}>
              <div className="form-group">
                <label className="form-label">Email Akun (Read-only)</label>
                <input type="text" className="form-input" value={email} disabled style={{ background: 'var(--bg-secondary)', opacity: 0.7 }} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Foto Profil</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ alignSelf: 'flex-start' }}>
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Simpan Profil
              </button>
            </form>
          </div>
        </div>

        <div className="card stagger-item" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <span className="card-title">Manajemen Data & Sesi</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn" onClick={handleSync} disabled={isSyncing} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                <span>Sinkronisasi Paksa ke Cloud</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mencocokkan data lokal dan server</span>
            </button>

            <button className="btn btn-danger" onClick={handleClearCache} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-expense)' }}>
                <Trash2 size={18} />
                <span>Bersihkan Cache Lokal</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mereset IndexedDB</span>
            </button>

            <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={18} />
                <span>Keluar Akun (Logout)</span>
              </div>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
