import React, { useState, useEffect } from 'react';
import { Subject } from '@/types';
import { Card, CardContent } from './ui/Card';
import { cn, isCoachingSubject } from '@/lib/utils';
import { BookOpen, Trash2 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  taskCount: number;
  completedCount: number;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'compact' | 'grid';
  onDelete?: (id: string) => void;
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
  onDelete,
}: SubjectCardProps) {
  const accent = accentMap[subject.color] ?? accentMap.indigo;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset confirmation state if subject changes
  useEffect(() => {
    Promise.resolve().then(() => setIsConfirmingDelete(false));
  }, [subject.id]);
  const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const pendingCount = taskCount - completedCount;

  // Fallback warn for unknown colors
  if (typeof window !== 'undefined' && !accentMap[subject.color]) {
    console.warn(`SubjectCard: Fallback to "indigo" for subject "${subject.name}" with unknown color "${subject.color}".`);
  }

  // 1. Compact Sidebar Button Layout
  if (variant === 'compact') {
    const isCoaching = isCoachingSubject(subject.name);
    return (
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99] focus:outline-none',
          isSelected
            ? isCoaching
              ? 'border-amber-500/30 bg-amber-500/10 ring-1 ring-amber-500/15 text-white'
              : 'border-indigo-500/30 bg-indigo-500/10 ring-1 ring-indigo-500/15 text-white'
            : 'border-transparent bg-slate-800/30 text-slate-300 hover:bg-slate-700/30 hover:border-slate-700/40'
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isCoaching ? 'bg-amber-400' : 'bg-indigo-400'
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-200">{subject.name}</span>
            <span className="mt-1 block text-xs text-slate-400">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </span>
        </span>
        <span className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-md border',
          isCoaching
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/20'
            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
        )}>
          {completedCount}/{taskCount}
        </span>
      </button>
    );
  }

  // 2. Full Grid Card Layout
  if (variant === 'grid' && isConfirmingDelete) {
    return (
      <Card className="border-red-900 bg-red-950/20 overflow-hidden transition-all duration-300">
        <div className="h-1.5 bg-red-500" />
        <CardContent className="p-5 flex flex-col justify-between h-44">
          <div className="flex-1 flex flex-col justify-center text-center">
            <h4 className="font-bold text-white text-sm">Delete {subject.name}?</h4>
            <p className="text-3xs text-red-300 mt-1 leading-relaxed">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete?.(subject.id);
              }}
              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition cursor-pointer select-none"
            >
              Delete
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-700 transition-all duration-300">
      <div className={cn('h-1.5', accent.progressBar)} />
      <CardContent className="p-5 flex flex-col justify-between h-44">
        <div>
          <div className="flex justify-between items-start">
            <div className={cn('p-1.5 rounded-lg text-slate-950', accent.progressBar)}>
              <BookOpen size={14} className="stroke-[3]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </span>
              {variant === 'grid' && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(true);
                  }}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800/80 transition cursor-pointer"
                  title="Delete subject"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
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
