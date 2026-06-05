'use client';

import React, { useState } from 'react';
import { Subject, Homework } from '@/types';
import { Input } from './ui/Input';
import { X, AlertCircle } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Homework, 'id' | 'completed'>) => void;
  subjects: Subject[];
}

export function AddTaskModal({ isOpen, onClose, onSubmit, subjects }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Homework['priority']>('medium');
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      subjectId,
      dueDate,
      priority,
    });

    // Reset fields & close
    setTitle('');
    setDescription('');
    setSubjectId('');
    setDueDate('');
    setPriority('medium');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden z-10 animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <h3 className="text-lg font-bold text-white">Add Homework Task</h3>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 text-red-300 text-xs border border-red-500/20">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Title *</label>
            <Input
              type="text"
              placeholder="e.g. Finish chemistry project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              className="flex w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              rows={3}
              placeholder="Add details, chapters, page numbers, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Grid for Subject and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
              <select
                className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all duration-200"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="" className="bg-slate-900">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-slate-900">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date *</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-slate-700 bg-slate-950 text-slate-100 focus:border-emerald-400 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-500/15 border-red-500 text-red-200 font-bold ring-2 ring-red-500/20'
                        : p === 'medium'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 font-bold ring-2 ring-amber-500/20'
                        : 'bg-emerald-500/15 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-750 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/85">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-750 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
