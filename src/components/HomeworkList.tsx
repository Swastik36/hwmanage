import React, { useState } from 'react';
import { Homework, Subject } from '@/types';
import { Trash2, Calendar, CheckCircle2, Clock, AlertCircle, MessageSquare, Pencil, Check, X } from 'lucide-react';
import { cn, parseLocalDate } from '@/lib/utils';

interface HomeworkListProps {
  homework: Homework[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTask?: (task: Homework) => void;
  onUpdate?: (updated: Homework) => void;
}

export function HomeworkList({ homework, subjects, onToggle, onDelete, onSelectTask, onUpdate }: HomeworkListProps) {
  // Local state for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Homework['priority']>('medium');

  const startEditing = (item: Homework) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate);
    setEditPriority(item.priority);
  };

  const handleSave = (item: Homework) => {
    if (!editTitle.trim()) return;
    onUpdate?.({
      ...item,
      title: editTitle.trim(),
      dueDate: editDueDate,
      priority: editPriority,
    });
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: Homework) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(item);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Format Date string helper
  const formatDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to determine status and colors of due date
  const getDueDateStatus = (dateStr: string, completed: boolean) => {
    if (completed) {
      return {
        text: 'text-secondary-text',
        bg: 'bg-surface/50',
        status: 'completed',
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = parseLocalDate(dateStr);

    if (dueDate < today) {
      return {
        text: 'text-red-600 dark:text-red-400 font-medium',
        bg: 'bg-red-50 dark:bg-red-500/10',
        status: 'overdue',
        label: 'Overdue',
      };
    } else if (dueDate.getTime() === today.getTime()) {
      return {
        text: 'text-amber-600 dark:text-amber-400 font-medium',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        status: 'today',
        label: 'Due today',
      };
    }

    return {
      text: 'text-secondary-text',
      bg: 'bg-surface/40',
      status: 'upcoming',
    };
  };

  // Helper to render icon dynamically based on status metadata
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={13} className="text-emerald-500" />;
      case 'overdue':
        return <AlertCircle size={13} className="text-red-500" />;
      case 'today':
        return <Clock size={13} className="text-amber-500" />;
      default:
        return <Calendar size={13} className="text-secondary-text" />;
    }
  };

  // Get Priority Styling helper
  const getPriorityBadge = (priority: Homework['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-3.5">
      {homework.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface/50 rounded-2xl border border-dashed border-divider">
          <CheckCircle2 className="h-10 w-10 text-secondary-text/60 mb-3" />
          <h3 className="font-semibold text-primary-text text-lg">All caught up!</h3>
          <p className="text-secondary-text text-sm max-w-xs mt-1">No homework found for this selection. Have a great day!</p>
        </div>
      ) : (
        homework.map((item) => {
          const subject = subjects.find((s) => s.id === item.subjectId);
          const dateStatus = getDueDateStatus(item.dueDate, item.completed);

          if (editingId === item.id) {
            return (
              <div
                key={item.id}
                onKeyDown={(e) => handleKeyDown(e, item)}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border bg-surface/60 border-divider"
              >
                <div className="flex flex-col sm:flex-row flex-1 gap-2.5 min-w-0">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="flex-1 min-w-[150px] bg-input border border-divider text-primary-text rounded-lg px-3 py-1.5 text-sm placeholder:text-secondary-text focus:outline-none focus:border-emerald-500/50 transition"
                    placeholder="Task title"
                  />
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full sm:w-36 bg-input border border-divider text-primary-text rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                  />
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Homework['priority'])}
                    className="w-full sm:w-28 bg-input border border-divider text-primary-text rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 ml-auto sm:ml-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSave(item)}
                    className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition"
                    aria-label="Save changes"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-2 text-secondary-text hover:text-primary-text hover:bg-hover-subtle rounded-lg transition"
                    aria-label="Cancel editing"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              onClick={() => onSelectTask?.(item)}
              className={cn(
                'group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer active:scale-[0.995]',
                item.completed
                  ? 'bg-surface/30 border-divider/40'
                  : 'bg-surface border-divider hover:border-divider/80'
              )}
            >
              <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                {/* Custom Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(item.id);
                  }}
                  className={cn(
                    'flex items-center justify-center w-5.5 h-5.5 rounded-md border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    item.completed
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-divider hover:border-divider/80'
                  )}
                >
                  {item.completed && <CheckCircle2 size={14} className="stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h5
                      className={cn(
                        'text-sm sm:text-base leading-snug truncate',
                        item.completed
                          ? 'line-through text-secondary-text/80 font-normal'
                          : 'font-semibold text-primary-text'
                      )}
                    >
                      {item.title}
                    </h5>
                    {subject && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-secondary-text uppercase tracking-wider">
                        {subject.name}
                      </span>
                    )}
                    <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider', getPriorityBadge(item.priority))}>
                      {item.priority}
                    </span>
                  </div>

                  {item.description && (
                    <p 
                      className={cn(
                        'text-xs mt-1 max-w-lg truncate', 
                        item.completed 
                          ? 'text-secondary-text/60 line-through' 
                          : 'text-secondary-text'
                      )}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Indicators (Due Date, Comments) */}
                  <div className="flex items-center space-x-2 mt-2 flex-wrap gap-y-1">
                    <span className={cn('flex items-center space-x-1 text-2xs px-2 py-0.5 rounded-md', dateStatus.bg, dateStatus.text)}>
                      {renderStatusIcon(dateStatus.status)}
                      <span>
                        {dateStatus.label ? `${dateStatus.label}: ` : ''}
                        {formatDate(item.dueDate)}
                      </span>
                    </span>

                    {item.messages && item.messages.length > 0 && (
                      <span className="flex items-center space-x-1 text-2xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        <MessageSquare size={12} className="text-indigo-500" />
                        <span>{item.messages.length} {item.messages.length === 1 ? 'reply' : 'replies'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item);
                  }}
                  className="p-2 text-secondary-text hover:text-indigo-400 rounded-lg hover:bg-hover-subtle transition-colors"
                  aria-label="Edit homework"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-2 text-secondary-text hover:text-red-500 rounded-lg hover:bg-hover-subtle transition-colors"
                  aria-label="Delete homework"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
