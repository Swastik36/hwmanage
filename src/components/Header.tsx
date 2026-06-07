'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar, LayoutDashboard, Clock, BookOpen, Menu } from 'lucide-react';
import { useUIContext } from '@/context/UIContext';

export function Header() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIContext();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const getDisplayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const navItems = [
    { href: '/', label: 'Creator', icon: LayoutDashboard },
    { href: '/agenda', label: 'Agenda', icon: Clock },
    { href: '/subjects', label: 'Subjects', icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="h-7 w-7">
              <defs>
                <linearGradient id="nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="24" fill="url(#nav-grad)" />
              <path d="M35 40h30M35 52h30M35 64h20" stroke="white" strokeWidth="8" strokeLinecap="round" />
              <rect x="21" y="36" width="5" height="5" rx="1.5" fill="white" />
              <rect x="21" y="48" width="5" height="5" rx="1.5" fill="white" />
              <rect x="21" y="60" width="5" height="5" rx="1.5" fill="white" />
            </svg>
            <span className="hidden sm:inline text-lg font-bold text-white tracking-tight">Homework Manager</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={cn(
                'p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition md:hidden',
                sidebarOpen && 'text-emerald-400 bg-slate-900'
              )}
              aria-label="Toggle sidebar menu"
            >
              <Menu size={20} />
            </button>
            <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all active:scale-[0.98]',
                    isActive
                      ? 'bg-slate-800 text-white shadow-inner border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

          {/* Current Date */}
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-850 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300" suppressHydrationWarning>
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span>{getDisplayDate()}</span>
          </div>

        </div>
      </div>
    </header>
  );
}
