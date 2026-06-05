import React from 'react';
import { Homework, Subject } from '@/types';
import { Trash2, Calendar, CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { cn, parseLocalDate } from '@/lib/utils';

interface HomeworkListProps {
  homework: Homework[];
  subjects: Subject[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTask?: (task: Homework) => void;
}

export function HomeworkList({ homework, subjects, onToggle, onDelete, onSelectTask }: HomeworkListProps) {
  // Format Date string helper
  const formatDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to determine status and colors of due date
  const getDueDateStatus = (dateStr: string, completed: boolean) => {
    if (completed) {
      return {
        text: 'text-slate-400',
        bg: 'bg-slate-50',
        status: 'completed',
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = parseLocalDate(dateStr);

    if (dueDate < today) {
      return {
        text: 'text-red-600 font-medium',
        bg: 'bg-red-50',
        status: 'overdue',
        label: 'Overdue',
      };
    } else if (dueDate.getTime() === today.getTime()) {
      return {
        text: 'text-amber-600 font-medium',
        bg: 'bg-amber-50',
        status: 'today',
        label: 'Due today',
      };
    }

    return {
      text: 'text-slate-500',
      bg: 'bg-slate-50',
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
        return <Calendar size={13} className="text-slate-400" />;
    }
  };

  // Get Priority Styling helper
  const getPriorityBadge = (priority: Homework['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  return (
    <div className="space-y-3.5">
      {homework.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700 text-lg">All caught up!</h3>
          <p className="text-slate-500 text-sm max-w-xs mt-1">No homework found for this selection. Have a great day!</p>
        </div>
      ) : (
        homework.map((item) => {
          const subject = subjects.find((s) => s.id === item.subjectId);
          const dateStatus = getDueDateStatus(item.dueDate, item.completed);

          return (
            <div
              key={item.id}
              onClick={() => onSelectTask?.(item)}
              className={cn(
                'group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 transition-all duration-200 hover:border-slate-200 hover:shadow-sm cursor-pointer active:scale-[0.995]',
                item.completed && 'bg-slate-50/50 border-slate-50'
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
                      : 'border-slate-300 hover:border-slate-400'
                  )}
                >
                  {item.completed && <CheckCircle2 size={14} className="stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h5
                      className={cn(
                        'font-semibold text-slate-800 text-sm sm:text-base leading-snug truncate',
                        item.completed && 'line-through text-slate-400 font-normal'
                      )}
                    >
                      {item.title}
                    </h5>
                    {subject && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {subject.name}
                      </span>
                    )}
                    <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider', getPriorityBadge(item.priority))}>
                      {item.priority}
                    </span>
                  </div>

                  {item.description && (
                    <p className={cn('text-xs text-slate-500 mt-1 max-w-lg truncate', item.completed && 'text-slate-400/80')}>{item.description}</p>
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
                      <span className="flex items-center space-x-1 text-2xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
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
                    onDelete(item.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
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
