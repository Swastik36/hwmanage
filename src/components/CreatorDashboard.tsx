'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { HomeworkList } from '@/components/HomeworkList';
import { SubjectCard } from '@/components/SubjectCard';
import { ThreadDrawer } from '@/components/thread/ThreadDrawer';
import { Input } from '@/components/ui/Input';
import { useHomeworkContext } from '@/context/HomeworkContext';
import { cn, parseLocalDate, isCoachingSubject, SUBJECT_VISIBLE_COUNT } from '@/lib/utils';
import { useSubjectFilter } from '@/hooks/useSubjectFilter';
import { Homework } from '@/types';
import { BookOpen, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, ListTodo, Plus, Search, X } from 'lucide-react';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useUIContext } from '@/context/UIContext';

type PresetSet = {
  primary: string[];
  extra: string[];
};

const priorityOptions: Homework['priority'][] = ['low', 'medium', 'high'];

function getTodayInputValue() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getPresetSet(subjectName: string): PresetSet {
  const normalized = subjectName.toLowerCase();

  if (normalized.includes('english') || normalized.includes('literature')) {
    return {
      primary: ['Essay draft', 'Reading log', 'Vocabulary'],
      extra: ['Book notes', 'Poem analysis', 'Grammar worksheet'],
    };
  }

  if (normalized.includes('math')) {
    return {
      primary: ['Problem set', 'Worksheet', 'Quiz review'],
      extra: ['Formula practice', 'Graphing drill', 'Chapter review'],
    };
  }

  if (normalized.includes('science') || normalized.includes('biology') || normalized.includes('chemistry')) {
    return {
      primary: ['Lab report', 'Diagram labels', 'Study notes'],
      extra: ['Experiment prep', 'Vocabulary cards', 'Chapter questions'],
    };
  }

  if (normalized.includes('history') || normalized.includes('social')) {
    return {
      primary: ['Timeline notes', 'Source review', 'Short essay'],
      extra: ['Map practice', 'Event summary', 'Vocabulary terms'],
    };
  }

  return {
    primary: ['Worksheet', 'Reading notes', 'Project work'],
    extra: ['Practice questions', 'Study guide', 'Research outline'],
  };
}

export default function CreatorDashboard() {
  const {
    homework,
    subjects,
    loading,
    addHomework,
    toggleHomework,
    deleteHomework,
    addMessageToThread,
    editHomework,
  } = useHomeworkContext();

  const { sidebarOpen, setSidebarOpen } = useUIContext();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [stagedTask, setStagedTask] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [dueDate, setDueDate] = useState(() => getTodayInputValue());
  const [priority, setPriority] = useState<Homework['priority']>('medium');
  const [showMorePresets, setShowMorePresets] = useState(false);
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
  } = useSubjectFilter(subjects, {
    selectedSubjectId,
    onSelectionExcluded: () => setSelectedSubjectId(null),
  });

  const activeTaskForThread = useMemo(() => {
    return homework.find((t) => t.id === activeTaskForThreadId) || null;
  }, [homework, activeTaskForThreadId]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId, subjects]
  );

  const selectedSubjectTasks = useMemo(
    () => homework.filter((item) => item.subjectId === selectedSubjectId),
    [homework, selectedSubjectId]
  );

  const visibleHomework = useMemo(() => {
    return [...homework]
      .filter((item) => !selectedSubjectId || item.subjectId === selectedSubjectId)
      .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime());
  }, [homework, selectedSubjectId]);

  const presets = selectedSubject ? getPresetSet(selectedSubject.name) : null;
  const visiblePresets = presets
    ? showMorePresets
      ? [...presets.primary, ...presets.extra]
      : presets.primary
    : [];
  const stagedTitle = stagedTask.trim();
  const [displayDate, setDisplayDate] = useState('');

  useEffect(() => {
    Promise.resolve().then(() => {
      setDisplayDate(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }));
    });
  }, []);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjectId((currentSubjectId) => (currentSubjectId === subjectId ? null : subjectId));
    setStagedTask('');
    setCustomTask('');
    setDueDate(getTodayInputValue());
    setPriority('medium');
    setShowMorePresets(false);
  };

  const handlePresetSelect = (title: string) => {
    setStagedTask(title);
    setCustomTask('');
  };

  const handleCustomChange = (value: string) => {
    setCustomTask(value);
    setStagedTask(value);
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSubject || !stagedTitle) {
      console.warn('handleAddTask: Missing selected subject or staged task title');
      return;
    }

    addHomework({
      title: stagedTitle,
      description: '',
      subjectId: selectedSubject.id,
      dueDate: dueDate, // raw YYYY-MM-DD string
      priority,
    });

    setStagedTask('');
    setCustomTask('');
    setShowMorePresets(false);
  };

  const renderSidebarContents = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex items-center justify-between hidden md:flex">
        <div>
          <h2 className="text-lg font-semibold text-primary-text">Subjects</h2>
          <p className="mt-1 text-xs text-secondary-text">Select one to open the panel.</p>
        </div>
        <BookOpen className="h-5 w-5 text-secondary-text" />
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-divider px-4 py-6 text-sm text-secondary-text">
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-divider px-4 py-6 text-sm text-secondary-text">
          No subjects yet. Add one from subject settings.
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Category Filters */}
          <div className="mb-4 space-y-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-divider text-primary-text rounded-lg pl-9 pr-8 py-2 text-xs placeholder:text-secondary-text focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition"
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
            <div className="flex gap-0.5 rounded-lg border border-divider/40 bg-surface/60 p-0.5">
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
                    onClick={() => {
                      setActiveCategory(tab);
                      setSelectedSubjectId(null);
                    }}
                    className={cn(
                      'flex-grow sm:flex-grow-0 flex-1 px-2.5 py-0.5 rounded-md text-xs font-normal transition-all duration-150 cursor-pointer select-none',
                      activeCategory === tab
                        ? 'bg-hover-subtle text-primary-text'
                        : 'text-secondary-text hover:text-primary-text'
                    )}
                  >
                    {label} <span className={cn('text-[10px]', activeCategory === tab ? 'text-secondary-text' : 'text-secondary-text/60')}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-divider px-4 py-6 text-center text-xs text-secondary-text bg-surface/20">
              No matching subjects found.
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                {displayedSubjects.map((subject) => {
                  const subjectTasks = homework.filter((item) => item.subjectId === subject.id);
                  const completedCount = subjectTasks.filter((item) => item.completed).length;
                  const isActive = selectedSubjectId === subject.id;

                  return (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      taskCount={subjectTasks.length}
                      completedCount={completedCount}
                      isSelected={isActive}
                      onClick={() => {
                        handleSubjectSelect(subject.id);
                        setSidebarOpen(false);
                      }}
                      variant="compact"
                    />
                  );
                })}
              </div>

              {filteredSubjects.length > SUBJECT_VISIBLE_COUNT && (
                <div className="relative flex items-center justify-center pt-1 shrink-0">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-divider" />
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => !p)}
                    className="relative z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-divider text-secondary-text hover:text-primary-text hover:border-divider text-xs font-normal transition-all duration-200 cursor-pointer select-none"
                  >
                    {expanded ? (
                      <><ChevronUp size={12} strokeWidth={1.5} />show less</>
                    ) : (
                      <><ChevronDown size={12} strokeWidth={1.5} />{filteredSubjects.length - SUBJECT_VISIBLE_COUNT} more</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <main className="flex flex-1 bg-page">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 shrink-0 border-r border-divider bg-surface/60 flex-col p-3 sticky top-16 h-[calc(100vh-64px)]">
        {renderSidebarContents()}
      </aside>

      {/* Mobile sidebar drawer */}
      <MobileDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Subjects">
        {renderSidebarContents()}
      </MobileDrawer>

      {/* Right content */}
      <div className="flex-1 pt-8 pb-20 md:pb-8 px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-primary-text tracking-tight">Creator Dashboard</h2>
          <p className="text-sm text-secondary-text">
            Select a subject to stage presets or type custom tasks, then confirm them to your agenda.
          </p>
        </div>

        <section className="flex flex-col gap-6">
          {/* task panel — full width now, no md:col-span-2 */}
          <section className="flex min-h-[400px] flex-col justify-between rounded-xl border border-divider bg-surface/85 p-6 shadow-2xl shadow-divider/30">
            {!selectedSubject ? (
              <div className="flex min-h-[352px] flex-1 items-center justify-center rounded-lg bg-page/30 px-6 text-center">
                <div className="max-w-md">
                  <BookOpen className="mx-auto h-10 w-10 text-secondary-text/60" />
                  <h2 className="mt-4 text-xl font-semibold text-primary-text">
                    Select a subject <span className="hidden md:inline">from the left</span><span className="inline md:hidden">using the menu button at the top</span> to start adding homework
                  </h2>
                  <p className="mt-2 text-sm text-secondary-text">
                    Your selected subject will open here with presets, custom entry, and confirmation controls.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddTask} className="flex min-h-[352px] flex-1 flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-secondary-text">Selected subject</p>
                      <h2 className="mt-1 text-2xl font-bold text-primary-text">{selectedSubject.name}</h2>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-divider bg-input/70 px-3 py-2 text-sm font-semibold text-primary-text">
                      <CalendarClock className="h-4 w-4 text-emerald-300" />
                      {displayDate}
                    </div>
                  </div>

                  <div className="my-5 rounded-lg border border-divider bg-input/70 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                        <ListTodo className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary-text">Active preview</p>
                        {stagedTitle ? (
                          <>
                            <h3 className="mt-1 break-words text-xl font-bold text-primary-text">{stagedTitle}</h3>
                            <p className="mt-2 text-sm text-secondary-text">
                              Due {dueDate ? parseLocalDate(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'not set'} with {priority} priority.
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="mt-1 text-xl font-bold text-primary-text">No task staged yet</h3>
                            <p className="mt-2 text-sm text-secondary-text/70">
                              Choose a preset or type a custom homework item below.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-divider pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-primary-text">Added for {selectedSubject.name}</p>
                        <span className="text-xs font-semibold text-secondary-text">{selectedSubjectTasks.length} total</span>
                      </div>

                      {selectedSubjectTasks.length === 0 ? (
                        <p className="mt-3 rounded-lg border border-dashed border-divider px-3 py-3 text-sm text-secondary-text">
                          No confirmed homework for this subject yet.
                        </p>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          {selectedSubjectTasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-divider bg-surface/80 px-3 py-2"
                            >
                              <span className="truncate text-sm font-semibold text-primary-text">{task.title}</span>
                              {task.completed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                              ) : (
                                <span className="shrink-0 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200">
                                  open
                                </span>
                              )}
                            </div>
                          ))}
                          {selectedSubjectTasks.length > 3 && (
                            <p className="text-xs text-secondary-text text-right mt-2 pr-1 font-semibold">
                              + {selectedSubjectTasks.length - 3} more task(s)...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-primary-text">Ready-made options</p>
                      {showMorePresets && <span className="text-xs font-semibold text-emerald-300">Expanded</span>}
                    </div>
                    <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1">
                      {visiblePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className={cn(
                            'h-20 w-24 shrink-0 rounded-lg border px-2 text-center text-xs font-bold text-primary-text transition hover:border-emerald-300 hover:bg-emerald-500/10',
                            stagedTitle === preset
                              ? 'border-emerald-300 bg-emerald-500/15 text-white'
                              : 'border-divider bg-input/70'
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-label="Toggle more recommendations"
                        onClick={() => setShowMorePresets((current) => !current)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-divider bg-input/70 text-primary-text transition hover:border-emerald-300 hover:bg-emerald-500/10"
                      >
                        <Plus className={cn('h-5 w-5 transition', showMorePresets && 'rotate-45')} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-primary-text">Due date</span>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="border-divider bg-input text-primary-text focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-primary-text">Priority</span>
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value as Homework['priority'])}
                        className="flex h-11 w-full rounded-xl border border-divider bg-input px-3.5 py-2 text-sm text-primary-text transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-primary-text">Custom</span>
                      <Input
                        value={customTask}
                        onChange={(event) => handleCustomChange(event.target.value)}
                        placeholder="Type your own homework"
                        className="border-divider bg-input text-primary-text placeholder:text-secondary-text focus:border-emerald-400 focus:ring-emerald-400/20"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!stagedTitle || !selectedSubject}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-secondary-text/50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </section>

        <section className="rounded-xl border border-divider bg-surface/80 p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary-text">Confirmed homework</h2>
              <p className="text-sm text-secondary-text">
                {selectedSubject ? `Showing ${selectedSubject.name}` : 'Showing every saved subject'}
              </p>
            </div>
            <span className="text-sm font-semibold text-secondary-text">
              {visibleHomework.length} {visibleHomework.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-divider px-4 py-8 text-center text-sm text-secondary-text">
              Loading homework...
            </div>
          ) : (
            <HomeworkList
              homework={visibleHomework}
              subjects={subjects}
              onToggle={toggleHomework}
              onDelete={deleteHomework}
              onSelectTask={(task) => setActiveTaskForThreadId(task.id)}
              onUpdate={editHomework}
            />
          )}
        </section>
      </div>

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
