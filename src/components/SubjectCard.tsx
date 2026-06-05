import React from 'react';
import { Subject } from '@/types';
import { Card, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  taskCount: number;
  completedCount: number;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'compact' | 'grid';
}

type AccentClasses = {
  marker: string;
  soft: string;
  active: string;
  inactiveHover: string;
  progressBar: string;
};

const accentMap: Record<string, AccentClasses> = {
  indigo: {
    marker: 'bg-indigo-400',
    soft: 'bg-indigo-500/10 text-indigo-100 border-indigo-400/30',
    active: 'border-indigo-400 bg-indigo-500/15 text-white shadow-lg shadow-indigo-950/30',
    inactiveHover: 'hover:border-indigo-400/70 hover:bg-indigo-500/10',
    progressBar: 'bg-indigo-500',
  },
  emerald: {
    marker: 'bg-emerald-400',
    soft: 'bg-emerald-500/10 text-emerald-100 border-emerald-400/30',
    active: 'border-emerald-400 bg-emerald-500/15 text-white shadow-lg shadow-emerald-950/30',
    inactiveHover: 'hover:border-emerald-400/70 hover:bg-emerald-500/10',
    progressBar: 'bg-emerald-500',
  },
  amber: {
    marker: 'bg-amber-400',
    soft: 'bg-amber-500/10 text-amber-100 border-amber-400/30',
    active: 'border-amber-400 bg-amber-500/15 text-white shadow-lg shadow-amber-950/30',
    inactiveHover: 'hover:border-amber-400/70 hover:bg-amber-500/10',
    progressBar: 'bg-amber-500',
  },
  rose: {
    marker: 'bg-rose-400',
    soft: 'bg-rose-500/10 text-rose-100 border-rose-400/30',
    active: 'border-rose-400 bg-rose-500/15 text-white shadow-lg shadow-rose-950/30',
    inactiveHover: 'hover:border-rose-400/70 hover:bg-rose-500/10',
    progressBar: 'bg-rose-500',
  },
};

export function SubjectCard({
  subject,
  taskCount,
  completedCount,
  isSelected = false,
  onClick,
  variant = 'grid',
}: SubjectCardProps) {
  const accent = accentMap[subject.color] ?? accentMap.indigo;
  const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const pendingCount = taskCount - completedCount;

  // Fallback warn for unknown colors
  if (typeof window !== 'undefined' && !accentMap[subject.color]) {
    console.warn(`SubjectCard: Fallback to "indigo" for subject "${subject.name}" with unknown color "${subject.color}".`);
  }

  // 1. Compact Sidebar Button Layout
  if (variant === 'compact') {
    return (
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition active:scale-[0.99] focus:outline-none',
          isSelected
            ? accent.active
            : cn('border-slate-800 bg-slate-950/60 text-slate-300', accent.inactiveHover)
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'h-3 w-3 shrink-0 rotate-45 rounded-[2px]',
              isSelected ? accent.marker : 'bg-slate-600'
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{subject.name}</span>
            <span className="mt-1 block text-xs text-slate-400">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </span>
        </span>
        <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold', accent.soft)}>
          {completedCount}/{taskCount}
        </span>
      </button>
    );
  }

  // 2. Full Grid Card Layout
  return (
    <Card className="border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-700 transition-all duration-300">
      <div className={cn('h-1.5', accent.progressBar)} />
      <CardContent className="p-5 flex flex-col justify-between h-44">
        <div>
          <div className="flex justify-between items-start">
            <div className={cn('p-1.5 rounded-lg text-slate-950', accent.progressBar)}>
              <BookOpen size={14} className="stroke-[3]" />
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <h4 className="mt-3 font-bold text-white text-base truncate">{subject.name}</h4>
          
          <div className="mt-3 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Completed tasks:</span>
              <span className="font-semibold text-emerald-400">{completedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending tasks:</span>
              <span className="font-semibold text-amber-400">{pendingCount}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between items-center text-3xs text-slate-500 font-bold mb-1 uppercase tracking-wider">
            <span>Progress</span>
            <span>{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
            <div
              className={cn('h-full transition-all duration-500', accent.progressBar)}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
