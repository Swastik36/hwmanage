'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar, LayoutDashboard, Clock, BookOpen, Menu } from 'lucide-react';
import { useUIContext } from '@/context/UIContext';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
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

  const getActiveTabIdx = () => {
    switch (pathname) {
      case '/':
        return 0;
      case '/agenda':
        return 1;
      case '/subjects':
        return 2;
      default:
        return null;
    }
  };

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const path = navItems[index].href;
    router.push(path);
  };

  return (
    <header className="border-b border-divider bg-page/80 backdrop-blur-md sticky top-0 z-40">
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
            <span className="hidden sm:inline text-lg font-bold text-primary-text tracking-tight">Homework Manager</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={cn(
                'p-2 text-secondary-text hover:text-primary-text hover:bg-hover-subtle rounded-lg transition md:hidden',
                sidebarOpen && 'text-emerald-400 bg-hover-subtle'
              )}
              aria-label="Toggle sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:block">
              <ExpandableTabs
                tabs={navItems.map((item) => ({
                  title: item.label,
                  icon: item.icon,
                }))}
                activeTab={getActiveTabIdx()}
                onChange={handleTabChange}
                activeColor="text-emerald-400 font-bold"
                className="border-divider bg-surface/40 p-1"
              />
            </div>
          </div>

          {/* Date & Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-divider bg-surface/50 px-3 py-1.5 text-xs font-semibold text-secondary-text" suppressHydrationWarning>
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>{getDisplayDate()}</span>
            </div>
            <ThemeToggle />
          </div>

        </div>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-divider bg-page/95 backdrop-blur-md h-16 flex items-center justify-around md:hidden px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-lg transition-all active:scale-95',
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
