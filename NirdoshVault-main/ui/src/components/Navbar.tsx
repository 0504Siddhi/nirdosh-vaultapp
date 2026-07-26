import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, Settings, Moon, Sun, Menu, X } from 'lucide-react';
import { useDarkMode } from '../store/darkMode';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { dark, toggle } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  if (['/', '/auth'].includes(location.pathname)) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upload', label: 'Upload Docs' },
    { to: '/report', label: 'Report' },
    { to: '/centres', label: 'Centres' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-4 sm:px-6 flex items-center justify-between bg-[#f6f5f0]/90 dark:bg-navy-950/90 border-b border-slate-200 dark:border-white/10 backdrop-blur-xl">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 font-extrabold text-lg text-navy-950 dark:text-white">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-500 to-green-600 flex items-center justify-center text-[11px] font-black text-white tracking-tight shadow-sm">
          NV
        </div>
        <span className="hidden sm:inline">Nirdosh Vault</span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        {links.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          id="dark-mode-toggle"
          onClick={toggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user && (
          <>
            <Link
              to="/settings"
              id="settings-link"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-saffron-500 text-white flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-slate-500 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white transition-colors"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        )}

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#f6f5f0]/98 dark:bg-navy-950/98 border-b border-slate-200 dark:border-white/10 backdrop-blur-xl md:hidden p-4 flex flex-col gap-1 shadow-xl">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname.startsWith(l.to)
                  ? 'text-navy-950 dark:text-white bg-slate-200/60 dark:bg-white/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/settings" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2">
            <Settings size={14} /> Settings
          </Link>
          {user && (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-left">
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/' || location.pathname === '/');
  return (
    <Link
      to={to}
      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'text-navy-950 dark:text-white bg-slate-200/50 dark:bg-white/10'
          : 'text-slate-500 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  );
}
