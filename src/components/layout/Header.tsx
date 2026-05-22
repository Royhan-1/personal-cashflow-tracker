'use client';

import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { state, toggleSidebar, updateSettings } = useApp();

  const toggleTheme = () => {
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={state.settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {state.settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
