'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHomeworkContext } from '@/context/HomeworkContext';
import { HomeworkList } from '@/components/HomeworkList';
import { AddTaskModal } from '@/components/AddTaskModal';
import { ThreadDrawer } from '@/components/thread/ThreadDrawer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, parseLocalDate, formatDate, isCoachingSubject, SUBJECT_VISIBLE_COUNT } from '@/lib/utils';
import { useSubjectFilter } from '@/hooks/useSubjectFilter';
import { Calendar, BookOpen, Sparkles, Smile, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock, Trash2, Plus, MessageSquare, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function MasterAgenda() {
  const {
    homework,
    subjects,
    loading,
    toggleHomework,
    deleteHomework,
    addHomework,
    addMessageToThread,
    editHomework,
  } = useHomeworkContext();

  // State for active view layout preference (persistent)
  const [viewMode, setViewMode] = useState<'date' | 'subject'>('date');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [activeTaskForThreadId, setActiveTaskForThreadId] = useState<string | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    expanded,
    setExpanded,
    filteredSubjects,
    displayedSubjects,
  } = useSubjectFilter(subjects);

  const activeTaskForThread = useMemo(() => {
    return homework.find((t) => t.id === activeTaskForThreadId) || null;
  }, [homework, activeTaskForThreadId]);

  // Load active view preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('hm_agenda_view_preference');
      if (savedPreference === 'date' || savedPreference === 'subject') {
        Promise.resolve().then(() => setViewMode(savedPreference));
      }
    } catch (e) {
      console.warn('Could not read view preference from localStorage:', e);
    }
  }, []);

  // Update localStorage when viewMode changes
  const handleViewModeChange = (mode: 'date' | 'subject') => {
    setViewMode(mode);
    try {
      localStorage.setItem('hm_agenda_view_preference', mode);
    } catch (e) {
      console.warn('Could not save view preference to localStorage:', e);
    }
  };

  // 1. Normalized Date Boundaries (Time portion set to zero)
  const dateGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTime = tomorrow.getTime();

    const overdueOrToday: typeof homework = [];
    const dueTomorrow: typeof homework = [];
    const laterThisWeek: typeof homework = [];
    const completedTasks: typeof homework = [];

    homework.forEach((item) => {
      if (item.completed) {
        completedTasks.push(item);
        return;
      }

      const itemDate = parseLocalDate(item.dueDate);
      const itemTime = itemDate.getTime();

      if (itemTime <= todayTime) {
        overdueOrToday.push(item);
      } else if (itemTime >= tomorrowTime && itemTime < tomorrowTime + 86400000) {
        dueTomorrow.push(item);
      } else {
        laterThisWeek.push(item);
      }
    });

    // Sort active tasks by due date ascending
    const sortByDate = (arr: typeof homework) =>
      [...arr].sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime());

    return {
      overdueOrToday: sortByDate(overdueOrToday),
      dueTomorrow: sortByDate(dueTomorrow),
      laterThisWeek: sortByDate(laterThisWeek),
      completed: sortByDate(completedTasks),
    };
  }, [homework]);



  // Accent mapping for Subject Grid cards
  const colorMap: Record<string, { bg: string; text: string; border: string; ribbon: string }> = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', ribbon: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', ribbon: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', ribbon: 'bg-amber-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', ribbon: 'bg-rose-500' },
  };


  return (
    <main className="min-h-screen bg-page pt-8 pb-20 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header and Toggle Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-primary-text tracking-tight">Master Agenda</h2>
            <p className="text-sm text-secondary-text">View and track all confirmed homework tasks across your courses.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Add Task Button */}
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Add Task</span>
            </button>

            {/* Persistent Switch View Tabs */}
            <div className="flex rounded-lg border border-divider bg-surface/60 p-1 w-full sm:w-auto">
              <button
                onClick={() => handleViewModeChange('date')}
                className={cn(
                  'flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.98]',
                  viewMode === 'date'
                    ? 'bg-hover-subtle border border-divider text-primary-text shadow-md'
                    : 'text-secondary-text hover:text-primary-text'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Schedule View</span>
              </button>
              <button
                onClick={() => handleViewModeChange('subject')}
                className={cn(
                  'flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.98]',
                  viewMode === 'subject'
                    ? 'bg-hover-subtle border border-divider text-primary-text shadow-md'
                    : 'text-secondary-text hover:text-primary-text'
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Subject Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Loading Spinner */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-divider py-16 text-center text-sm text-secondary-text bg-surface/50">
            Loading your agenda...
          </div>
        ) : (
          <>
            {/* View A: Group by Date (Schedule View) */}
            {viewMode === 'date' && (
              <div className="space-y-8">
                {/* 1. Due Today / Overdue */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-red-400 uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    <span>Due Today / Overdue</span>
                  </h3>
                  {dateGroups.overdueOrToday.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-divider bg-surface/30 px-5 py-4 text-sm text-secondary-text">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      <span>🎉 No homework due today! Time to relax or get ahead.</span>
                    </div>
                  ) : (
                    <HomeworkList
                      homework={dateGroups.overdueOrToday}
                      subjects={subjects}
                      onToggle={toggleHomework}
                      onDelete={deleteHomework}
                      onSelectTask={(task) => setActiveTaskForThreadId(task.id)}
                      onUpdate={editHomework}
                    />
                  )}
                </div>

                {/* 2. Due Tomorrow */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-amber-400 uppercase tracking-wider">
                    <CalendarDays className="h-4 w-4" />
                    <span>Due Tomorrow</span>
                  </h3>
                  {dateGroups.dueTomorrow.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-divider bg-surface/30 px-5 py-4 text-sm text-secondary-text">
                      <Smile className="h-5 w-5 text-amber-400" />
                      <span>🌅 Free evening tomorrow! No tasks scheduled.</span>
                    </div>
                  ) : (
                    <HomeworkList
                      homework={dateGroups.dueTomorrow}
                      subjects={subjects}
                      onToggle={toggleHomework}
                      onDelete={deleteHomework}
                      onSelectTask={(task) => setActiveTaskForThreadId(task.id)}
                      onUpdate={editHomework}
                    />
                  )}
                </div>

                {/* 3. Later This Week */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-indigo-400 uppercase tracking-wider">
                    <Calendar className="h-4 w-4" />
                    <span>Later This Week & Beyond</span>
                  </h3>
                  {dateGroups.laterThisWeek.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-divider bg-surface/30 px-5 py-4 text-sm text-secondary-text">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                      <span>📅 No upcoming tasks. You are all caught up!</span>
                    </div>
                  ) : (
                    <HomeworkList
                      homework={dateGroups.laterThisWeek}
                      subjects={subjects}
                      onToggle={toggleHomework}
                      onDelete={deleteHomework}
                      onSelectTask={(task) => setActiveTaskForThreadId(task.id)}
                      onUpdate={editHomework}
                    />
                  )}
                </div>
 
                {/* 4. Completed Tasks Section */}
                {dateGroups.completed.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-divider">
                    <h3 className="flex items-center gap-2 text-base font-bold text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completed Tasks</span>
                    </h3>
                    <HomeworkList
                      homework={dateGroups.completed}
                      subjects={subjects}
                      onToggle={toggleHomework}
                      onDelete={deleteHomework}
                      onSelectTask={(task) => setActiveTaskForThreadId(task.id)}
                      onUpdate={editHomework}
                    />
                  </div>
                )}
              </div>
            )}

            {/* View B: Group by Subject (Grid View) */}
            {viewMode === 'subject' && (
              <div className="space-y-6">
                {subjects.length > 0 && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface/40 p-4 border border-divider/60 rounded-xl">
                    {/* Search Bar */}
                    <div className="relative w-full sm:max-w-xs">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-input border border-divider text-primary-text rounded-lg pl-9 pr-8 py-2 text-xs placeholder:text-secondary-text focus:outline-none focus:border-emerald-500/50 transition"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
 
                    {/* Category tabs */}
                    <div className="flex gap-0.5 rounded-lg border border-divider/40 bg-surface/60 p-0.5 w-full sm:w-auto">
                      {(['all', 'school', 'coaching'] as const).map((tab) => {
                        const label = tab === 'all' ? 'All' : tab === 'school' ? 'School' : 'Coaching';
                        
                        const count = subjects.filter((s) => {
                          if (tab === 'all') return true;
                          const isCoaching = isCoachingSubject(s.name);
                          return tab === 'coaching' ? isCoaching : !isCoaching;
                        }).length;

                        return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveCategory(tab)}
                            className={cn(
                              'flex-1 sm:flex-none px-3 py-0.5 rounded-md text-xs font-normal transition-all duration-150 cursor-pointer select-none text-center',
                              activeCategory === tab
                                ? 'bg-hover-subtle text-primary-text shadow-sm'
                                : 'text-secondary-text hover:text-primary-text'
                            )}
                          >
                            {label} <span className={cn('text-[10px]', activeCategory === tab ? 'text-secondary-text' : 'text-secondary-text/60')}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredSubjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-divider py-16 text-center text-sm text-secondary-text bg-surface/50">
                    {subjects.length === 0 
                      ? <>No subjects defined. Add one in <Link href="/subjects" className="text-emerald-400 hover:underline">Subjects</Link>.</>
                      : <>No matching subjects found.</>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedSubjects.map((sub) => {
                        const activeSubTasks = homework.filter((item) => item.subjectId === sub.id && !item.completed);
                        const completedSubTasks = homework.filter((item) => item.subjectId === sub.id && item.completed);
                        const color = colorMap[sub.color] ?? colorMap.indigo;

                        return (
                          <Card key={sub.id} className="border-divider bg-surface/80 flex flex-col justify-between overflow-hidden hover:border-divider/80 transition-all duration-300">
                            <div>
                              {/* Subject Header Ribbon */}
                              <div className={cn('h-1.5', color.ribbon)} />
                              <CardHeader className="p-4">
                                <CardTitle className="text-base flex items-center justify-between text-primary-text font-bold">
                                  <span className="truncate">{sub.name}</span>
                                  <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border', color.bg, color.text, color.border)}>
                                    {activeSubTasks.length} pending
                                  </span>
                                </CardTitle>
                              </CardHeader>
 
                              {/* Task List Inside Subject Card */}
                              <CardContent className="p-4 pt-0 space-y-3">
                                {activeSubTasks.length === 0 ? (
                                  <p className="text-xs text-secondary-text italic py-2">No active homework assignments.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {activeSubTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        onClick={() => setActiveTaskForThreadId(task.id)}
                                        className="group/item flex items-center justify-between gap-2 rounded-lg border border-divider bg-input/60 p-2.5 hover:border-divider transition cursor-pointer active:scale-[0.985]"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {/* Interactive Checkbox */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleHomework(task.id);
                                            }}
                                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-divider hover:border-divider/80"
                                          >
                                            <div className="h-2 w-2 rounded-2xs bg-transparent group-hover/item:bg-hover-subtle transition" />
                                          </button>
                                          
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-primary-text">{task.title}</p>
                                            <p className="text-3xs text-secondary-text mt-0.5 flex items-center gap-1.5 flex-wrap">
                                              <span>Due {formatDate(task.dueDate, false)}</span>
                                              <span>•</span>
                                              <span>{task.priority}</span>
                                              {task.messages && task.messages.length > 0 && (
                                                <>
                                                  <span>•</span>
                                                  <span className="inline-flex items-center gap-0.5 text-indigo-400 font-bold">
                                                    <MessageSquare className="h-2.5 w-2.5" />
                                                    {task.messages.length}
                                                  </span>
                                                </>
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Action button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteHomework(task.id);
                                          }}
                                          className="p-1 text-secondary-text hover:text-red-400 rounded-md hover:bg-hover-subtle transition"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Completed Section for visual completion feedback */}
                                {completedSubTasks.length > 0 && (
                                  <div className="mt-4 border-t border-divider/60 pt-3">
                                    <p className="text-3xs font-bold text-secondary-text uppercase tracking-wider mb-2">Completed</p>
                                    <div className="space-y-1.5 opacity-60">
                                      {completedSubTasks.map((task) => (
                                        <div
                                          key={task.id}
                                          onClick={() => setActiveTaskForThreadId(task.id)}
                                          className="flex items-center justify-between gap-2 rounded-lg border border-divider bg-surface/30 p-2 cursor-pointer active:scale-[0.985] hover:border-divider transition"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleHomework(task.id);
                                              }}
                                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-emerald-500/20 text-emerald-400 hover:text-secondary-text hover:border-divider transition"
                                              aria-label="Reopen homework task"
                                            >
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="truncate text-xs text-secondary-text line-through">{task.title}</span>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteHomework(task.id);
                                            }}
                                            className="p-1 text-secondary-text hover:text-red-400 rounded transition"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {filteredSubjects.length > SUBJECT_VISIBLE_COUNT && (
                      <div className="relative flex items-center justify-center mt-1">
                        <div className="absolute inset-x-0 top-1/2 h-px bg-divider" />
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => !p)}
                          className="relative z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-divider text-secondary-text hover:text-primary-text hover:border-divider text-xs font-normal transition-all duration-200 cursor-pointer select-none"
                        >
                          {expanded ? (
                            <><ChevronUp size={12} strokeWidth={1.5} />show less</>
                          ) : (
                            <><ChevronDown size={12} strokeWidth={1.5} />{filteredSubjects.length - SUBJECT_VISIBLE_COUNT} more subjects</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSubmit={addHomework}
        subjects={subjects}
      />

      <ThreadDrawer
        isOpen={activeTaskForThreadId !== null}
        onClose={() => setActiveTaskForThreadId(null)}
        task={activeTaskForThread}
        subjects={subjects}
        onAddMessage={addMessageToThread}
        onToggleComplete={toggleHomework}
      />
    </main>
  );
}
