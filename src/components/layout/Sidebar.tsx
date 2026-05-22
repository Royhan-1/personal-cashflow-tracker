'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Settings, Wallet, Repeat, Target, BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { NAV_ITEMS } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  ArrowLeftRight: <ArrowLeftRight size={20} />,
  Repeat: <Repeat size={20} />,
  Target: <Target size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Settings: <Settings size={20} />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { state, setSidebar } = useApp();

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setSidebar(false);
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${state.sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebar(false)}
      />
      <aside className={`sidebar ${state.sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Wallet size={20} />
          </div>
          <div>
            <div className="sidebar-title">CashFlow</div>
            <div className="sidebar-subtitle">Personal Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-icon">
                  {iconMap[item.icon]}
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            v1.0.0 · Data disimpan lokal
          </div>
        </div>
      </aside>
    </>
  );
}
