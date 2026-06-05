'use client';

import React, { useState } from 'react';
import { useHomework } from '@/hooks/useHomework';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { SubjectCard } from '@/components/SubjectCard';
import { Plus, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ManageSubjects() {
  const { subjects, homework, addSubject } = useHomework();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [error, setError] = useState('');

  const colors = [
    { name: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400/50' },
    { name: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400/50' },
    { name: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-400/50' },
    { name: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-400/50' },
  ];

  const handleAddSubject = (e: React.FormEvent) => {
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

    addSubject(newSubjectName.trim(), selectedColor);
    setNewSubjectName('');
    setSelectedColor('indigo');
  };

  return (
    <main className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Subjects</h2>
          <p className="text-sm text-slate-400">Configure your school subjects and track metrics across each category.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Subject Column */}
          <div className="md:col-span-1">
            <Card className="border-slate-800 bg-slate-900/80 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Tag size={18} className="text-emerald-400" />
                  <span>Create Subject</span>
                </CardTitle>
                <CardDescription className="text-slate-400">Add a new subject to categorize homework.</CardDescription>
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
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Name</label>
                    <Input
                      placeholder="e.g. Science, Literature"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Color Label</label>
                    <div className="flex items-center space-x-3">
                      {colors.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={cn(
                            'w-8 h-8 rounded-full transition-all duration-200 focus:outline-none',
                            c.bg,
                            selectedColor === c.name ? 'ring-4 ring-offset-2 ring-offset-slate-900 ' + c.ring : 'hover:scale-105'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-lg h-10">
                    <Plus size={16} />
                    <span>Add Subject</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Subjects List Column */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Current Subjects ({subjects.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                const totalTasks = homework.filter((h) => h.subjectId === sub.id).length;
                const completedTasks = homework.filter((h) => h.subjectId === sub.id && h.completed).length;

                return (
                  <SubjectCard
                    key={sub.id}
                    subject={sub}
                    taskCount={totalTasks}
                    completedCount={completedTasks}
                    variant="grid"
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
