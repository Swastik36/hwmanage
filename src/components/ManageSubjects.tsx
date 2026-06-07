'use client';

import React, { useState } from 'react';
import { useHomeworkContext } from '@/context/HomeworkContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { SubjectCard } from '@/components/SubjectCard';
import { ChevronDown, ChevronUp, Plus, Tag, AlertCircle, Search, X } from 'lucide-react';
import { cn, isCoachingSubject, SUBJECT_VISIBLE_COUNT } from '@/lib/utils';
import { useSubjectFilter } from '@/hooks/useSubjectFilter';

export default function ManageSubjects() {
  const { subjects, homework, addSubject, deleteSubject } = useHomeworkContext();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const colors = [
    { name: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400/50' },
    { name: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400/50' },
    { name: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-400/50' },
    { name: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-400/50' },
  ];

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    if (subjects.some((sub) => sub.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      setError('A subject with this name already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSubject(newSubjectName.trim(), selectedColor);
      setNewSubjectName('');
      setSelectedColor('indigo');
    } catch (err) {
      setError('Failed to save subject. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await deleteSubject(id);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg === 'Cannot delete subject with existing homework assignments') {
        setError('This subject still has homework tasks. Please delete or complete them first.');
      } else {
        setError('Failed to delete subject. Please try again.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <main className="flex-1 bg-page pt-8 pb-20 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-primary-text tracking-tight">Manage Subjects</h2>
          <p className="text-sm text-secondary-text">Configure your school subjects and track metrics across each category.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Subject Column */}
          <div className="md:col-span-1">
            <Card className="border-divider bg-surface/80 md:sticky md:top-24">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-primary-text">
                  <Tag size={18} className="text-emerald-400" />
                  <span>Create Subject</span>
                </CardTitle>
                <CardDescription className="text-secondary-text">Add a new subject to categorize homework.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddSubject} className="space-y-4">
                  {error && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 text-red-300 text-xs border border-red-500/20">
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-secondary-text uppercase tracking-wider mb-1.5">Subject Name</label>
                    <Input
                      placeholder="e.g. Science, Literature"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="border-divider bg-input text-primary-text placeholder:text-secondary-text focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary-text uppercase tracking-wider mb-2">Color Label</label>
                    <div className="flex items-center space-x-3">
                      {colors.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={cn(
                            'w-8 h-8 rounded-full transition-all duration-200 focus:outline-none',
                            c.bg,
                            selectedColor === c.name ? 'ring-4 ring-offset-2 ring-offset-page ' + c.ring : 'hover:scale-105'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !newSubjectName.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-lg h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Plus size={16} className={isSubmitting ? 'animate-spin' : ''} />
                    <span>{isSubmitting ? 'Saving...' : 'Add Subject'}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Subjects List Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-primary-text">Current Subjects ({subjects.length})</h3>

              {subjects.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-stretch sm:items-center bg-surface/30 p-3 rounded-xl border border-divider/40">
                  {/* Search Input */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-input border border-divider text-primary-text rounded-lg pl-9 pr-8 py-2.5 text-xs placeholder:text-secondary-text focus:outline-none focus:border-emerald-500/50 transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition"
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
                            'flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer select-none text-center',
                            activeCategory === tab
                              ? 'bg-hover-subtle text-primary-text shadow-sm'
                              : 'text-secondary-text hover:text-primary-text'
                          )}
                        >
                          {label} <span className={cn('text-[10px] ml-1', activeCategory === tab ? 'text-secondary-text' : 'text-secondary-text/60')}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-divider py-16 text-center text-sm text-secondary-text bg-surface/50">
                {subjects.length === 0 ? (
                  <span>No subjects yet. Add one using the form on the left.</span>
                ) : (
                  <span>No subjects match your search or filter.</span>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedSubjects.map((sub) => {
                    const totalTasks = homework.filter((h) => h.subjectId === sub.id).length;
                    const completedTasks = homework.filter((h) => h.subjectId === sub.id && h.completed).length;

                    return (
                      <SubjectCard
                        key={sub.id}
                        subject={sub}
                        taskCount={totalTasks}
                        completedCount={completedTasks}
                        variant="grid"
                        onDelete={handleDeleteSubject}
                      />
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
        </div>

      </div>
    </main>
  );
}
