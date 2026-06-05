'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Homework, Subject, ThreadMessage, ThreadAttachment } from '@/types';
import { cn, parseLocalDate } from '@/lib/utils';
import { 
  X, 
  Send, 
  Paperclip, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  CheckCircle2
} from 'lucide-react';

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Homework | null;
  subjects: Subject[];
  onAddMessage: (homeworkId: string, message: Omit<ThreadMessage, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
}

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const getAvatarColorClass = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  ];
  return colors[hash % colors.length];
};

const getSubjectColorPill = (color: Subject['color']) => {
  switch (color) {
    case 'indigo':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'amber':
      return 'bg-amber-50/15 text-amber-300 border-amber-500/30';
    case 'rose':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
};

const getPriorityBadge = (priority: Homework['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality jpeg
        } else {
          reject(new Error('Canvas context could not be created'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export function ThreadDrawer({ 
  isOpen, 
  onClose, 
  task, 
  subjects, 
  onAddMessage, 
  onToggleComplete 
}: ThreadDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'gallery'>('chat');
  const [filterImagesOnly, setFilterImagesOnly] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; file: File }[]>([]);
  const [isSpoilerChecked, setIsSpoilerChecked] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Custom interactive user author details
  const [authorName, setAuthorName] = useState('Alex Rivera');
  
  // Spoiler overlay reveal list
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  
  // Lightbox selection
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages list to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [task?.messages, isOpen, activeTab]);

  const subject = useMemo(() => {
    if (!task) return null;
    return subjects.find((s) => s.id === task.subjectId) || null;
  }, [task, subjects]);

  // Compile all attachments across the discussion feed for the Solutions Gallery Tab
  const allAttachments = useMemo(() => {
    if (!task || !task.messages) return [];
    const attachmentsList: { messageId: string; authorName: string; createdAt: string; attachment: ThreadAttachment }[] = [];
    task.messages.forEach((msg) => {
      if (msg.attachments) {
        msg.attachments.forEach((att) => {
          attachmentsList.push({
            messageId: msg.id,
            authorName: msg.authorName,
            createdAt: msg.createdAt,
            attachment: att,
          });
        });
      }
    });
    return attachmentsList;
  }, [task]);

  // Filter discussion thread messages
  const filteredMessages = useMemo(() => {
    if (!task || !task.messages) return [];
    if (filterImagesOnly) {
      return task.messages.filter((msg) => msg.attachments && msg.attachments.length > 0);
    }
    return task.messages;
  }, [task, filterImagesOnly]);

  if (!task) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    setIsCompressing(true);
    try {
      const compressedList = await Promise.all(
        files.map(async (file) => {
          const base64Url = await compressImage(file);
          return { url: base64Url, file };
        })
      );
      setAttachments((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression error:', err);
      alert('Failed to process one or more images.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    const finalAttachments: ThreadAttachment[] = attachments.map((att, idx) => ({
      id: `att_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      url: att.url,
      isSpoiler: isSpoilerChecked,
    }));

    onAddMessage(task.id, {
      authorName: authorName.trim() || 'Anonymous',
      text: inputText.trim(),
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
    });

    setInputText('');
    setAttachments([]);
    setIsSpoilerChecked(false);
  };

  const toggleRevealSpoiler = (attId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(attId)) {
        next.delete(attId);
      } else {
        next.add(attId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDueDateStatusLabel = (dateStr: string, completed: boolean) => {
    if (completed) return 'Completed';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = parseLocalDate(dateStr);

    if (dueDate < today) return 'Overdue';
    if (dueDate.getTime() === today.getTime()) return 'Due Today';
    return 'Upcoming';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-wrap">
              {subject && (
                <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider', getSubjectColorPill(subject.color))}>
                  {subject.name}
                </span>
              )}
              <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider', getPriorityBadge(task.priority))}>
                {task.priority}
              </span>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close thread drawer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-start gap-3 justify-between">
            <div className="flex-1 min-w-0">
              <h2 className={cn(
                "text-lg font-bold text-white leading-snug truncate",
                task.completed && "line-through text-slate-500 font-normal"
              )}>
                {task.title}
              </h2>
              {task.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>

            {/* Checkbox status indicator inside drawer */}
            <button
              onClick={() => onToggleComplete(task.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-[0.98]',
                task.completed
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              <CheckCircle2 size={14} className={task.completed ? "text-emerald-400" : "text-slate-500"} />
              <span>{task.completed ? "Done" : "Mark Done"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-2xs text-slate-400 border-t border-slate-800/60 pt-2.5 mt-1">
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-slate-500" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-500" />
              <span>Status: {getDueDateStatusLabel(task.dueDate, task.completed)}</span>
            </span>
          </div>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-2",
              activeTab === 'chat' 
                ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/20" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <MessageSquare size={14} />
            <span>Discussion ({task.messages?.length || 0})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('gallery')}
            className={cn(
              "flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-2",
              activeTab === 'gallery' 
                ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-900/20" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ImageIcon size={14} />
            <span>Solutions Gallery ({allAttachments.length})</span>
          </button>
        </div>

        {/* Drawer Body content */}
        <div className="flex-1 overflow-y-auto bg-slate-950/20 flex flex-col min-h-0">
          {activeTab === 'chat' ? (
            <>
              {/* Filters Row */}
              <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-2xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Messages Stream</span>
                
                <button
                  onClick={() => setFilterImagesOnly(prev => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md border transition active:scale-[0.98]",
                    filterImagesOnly
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <ImageIcon size={11} />
                  <span>Images only</span>
                </button>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col min-h-0">
                {filteredMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="h-10 w-10 text-slate-700 mb-3" />
                    <h4 className="font-semibold text-slate-300 text-sm">No discussions yet</h4>
                    <p className="text-slate-500 text-2xs mt-1 max-w-[240px]">
                      {filterImagesOnly 
                        ? "No images have been shared in this thread yet." 
                        : "Start the study group discussion by typing a question or uploading a working sketch."}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3 items-start">
                      {/* Avatar initials or default image */}
                      <div className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 shadow-inner",
                        getAvatarColorClass(msg.authorName)
                      )}>
                        {getInitials(msg.authorName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-200">{msg.authorName}</span>
                          <span className="text-3xs text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Text message */}
                        {msg.text && (
                          <div className="mt-1 text-xs text-slate-200 bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 leading-relaxed break-words whitespace-pre-wrap">
                            {msg.text}
                          </div>
                        )}

                        {/* Attachments rendering */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att) => {
                              const isBlurred = att.isSpoiler && !revealedSpoilers.has(att.id);
                              return (
                                <div 
                                  key={att.id}
                                  onClick={() => {
                                    if (isBlurred) {
                                      setRevealedSpoilers(prev => {
                                        const n = new Set(prev);
                                        n.add(att.id);
                                        return n;
                                      });
                                    } else {
                                      setLightboxImage(att.url);
                                    }
                                  }}
                                  className={cn(
                                    "relative w-28 h-28 rounded-lg overflow-hidden border border-slate-800 cursor-pointer bg-slate-950 flex items-center justify-center transition-all duration-300",
                                    isBlurred ? "ring-1 ring-amber-500/30" : "hover:border-slate-600 hover:scale-[1.02]"
                                  )}
                                >
                                  {/* Image element */}
                                  <img 
                                    src={att.url} 
                                    alt="discussion attachment"
                                    className={cn(
                                      "w-full h-full object-cover transition-all duration-500",
                                      isBlurred && "blur-md brightness-50 scale-105"
                                    )}
                                  />

                                  {/* Spoiler Blurring Overlay */}
                                  {isBlurred && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/40">
                                      <EyeOff size={16} className="text-amber-400 mb-1" />
                                      <span className="text-3xs font-extrabold text-amber-400 tracking-wide uppercase">Spoiler</span>
                                      <span className="text-4xs text-slate-300 mt-0.5">Click to reveal</span>
                                    </div>
                                  )}

                                  {/* Eye button to re-blur if revealed */}
                                  {att.isSpoiler && !isBlurred && (
                                    <button
                                      onClick={(e) => toggleRevealSpoiler(att.id, e)}
                                      className="absolute top-1.5 right-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-md text-amber-400 hover:text-amber-300 hover:bg-slate-900 transition"
                                      title="Hide spoiler content"
                                    >
                                      <Eye size={10} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Section */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col gap-2.5"
              >
                {/* Author Name selector (classmate chooser) */}
                <div className="flex gap-2 items-center text-xs">
                  <span className="text-slate-400 font-medium">Posting as:</span>
                  <select
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                  >
                    <option value="Alex Rivera">Alex Rivera (You)</option>
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="Liam Carter">Liam Carter</option>
                    <option value="Emily Wong">Emily Wong</option>
                  </select>
                </div>

                {/* Attachments preview list */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    {attachments.map((att, index) => (
                      <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-800">
                        <img src={att.url} alt="upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-500/90 text-white rounded-full hover:bg-red-400 transition"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-1.5 ml-2">
                      <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1.5 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/15 transition select-none">
                        <input
                          type="checkbox"
                          checked={isSpoilerChecked}
                          onChange={(e) => setIsSpoilerChecked(e.target.checked)}
                          className="rounded border-slate-850 text-amber-500 bg-slate-950 focus:ring-amber-500/20 w-3.5 h-3.5"
                        />
                        <span className="text-3xs uppercase tracking-wider">Blur as Spoiler</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className={cn(
                      "p-3 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl hover:text-emerald-400 hover:border-slate-700 transition active:scale-[0.97]",
                      isCompressing && "opacity-50 cursor-not-allowed"
                    )}
                    title="Attach Image"
                  >
                    <Paperclip size={18} />
                  </button>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isCompressing ? "Processing images..." : "Ask a question or upload solution..."}
                    rows={1}
                    disabled={isCompressing}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 resize-none min-h-[40px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && attachments.length === 0) || isCompressing}
                    className="p-3 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Solutions Gallery Tab view */
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {allAttachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <ImageIcon className="h-10 w-10 text-slate-700 mb-3" />
                  <h4 className="font-semibold text-slate-300 text-sm">No solutions uploaded</h4>
                  <p className="text-slate-500 text-2xs mt-1 max-w-[240px]">
                    Solution images shared in the discussion thread will compile in this gallery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allAttachments.map(({ authorName, createdAt, attachment }) => {
                    const isBlurred = attachment.isSpoiler && !revealedSpoilers.has(attachment.id);
                    return (
                      <div 
                        key={attachment.id}
                        onClick={() => {
                          if (isBlurred) {
                            setRevealedSpoilers(prev => {
                              const n = new Set(prev);
                              n.add(attachment.id);
                              return n;
                            });
                          } else {
                            setLightboxImage(attachment.url);
                          }
                        }}
                        className={cn(
                          "relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square cursor-pointer transition-all duration-300 flex flex-col group",
                          isBlurred ? "ring-1 ring-amber-500/30" : "hover:border-slate-600 hover:scale-[1.02]"
                        )}
                      >
                        {/* Image */}
                        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
                          <img 
                            src={attachment.url} 
                            alt="homework solution diagram"
                            className={cn(
                              "w-full h-full object-cover transition-all duration-500",
                              isBlurred && "blur-md brightness-50 scale-105"
                            )}
                          />

                          {/* Spoiler overlay */}
                          {isBlurred && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/40">
                              <EyeOff size={16} className="text-amber-400 mb-1" />
                              <span className="text-4xs font-extrabold text-amber-400 tracking-wide uppercase">Spoiler</span>
                              <span className="text-5xs text-slate-300 mt-0.5">Click to reveal</span>
                            </div>
                          )}
                        </div>

                        {/* Author caption at bottom */}
                        <div className="p-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-4xs font-bold text-slate-300 truncate flex-1 pr-1">
                            {authorName}
                          </span>
                          <span className="text-5xs text-slate-500 font-medium whitespace-nowrap">
                            {new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Blurring toggle overlay controls */}
                        {attachment.isSpoiler && !isBlurred && (
                          <button
                            onClick={(e) => toggleRevealSpoiler(attachment.id, e)}
                            className="absolute top-1.5 right-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-md text-amber-400 hover:text-amber-300 hover:bg-slate-900 transition"
                            title="Hide spoiler content"
                          >
                            <Eye size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal overlay portal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-md transition-all animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition active:scale-[0.98] z-[70]"
            aria-label="Close Lightbox"
          >
            <X size={20} />
          </button>

          <div 
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 shadow-2xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="High-resolution homework solution thread attachment detail view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-inner select-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
