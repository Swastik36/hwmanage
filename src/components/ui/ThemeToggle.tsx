'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by waiting for mount on the client
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-divider bg-surface-elevated/40" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-surface-elevated/40 text-secondary-text hover:text-primary-text hover:bg-hover-subtle transition-all duration-200 active:scale-95 cursor-pointer"
      )}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun size={16} className="text-amber-400 stroke-[2.5] animate-scale-in" />
      ) : (
        <Moon size={16} className="text-indigo-600 dark:text-indigo-400 stroke-[2.5] animate-scale-in" />
      )}
    </button>
  );
}
