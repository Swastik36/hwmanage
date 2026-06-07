'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAnonIdentity, getOrCreateAnonId } from '@/hooks/useAnonIdentity';
import { Homework, Subject, ThreadMessage, ThreadAttachment } from '@/types';
import { cn } from '@/lib/utils';
import {
  X, Send, Paperclip, MessageSquare, Image as ImageIcon, Calendar, Clock, CheckCircle2, FileText,
} from 'lucide-react';
import { ThreadMessageBubble } from './ThreadMessageBubble';
import { ThreadGallery } from './ThreadGallery';
import {
  compressImage, blobToBase64, formatDate, getDueDateStatusLabel,
  getSubjectColorPill, getPriorityBadge, GalleryItem, parseAttachmentUrl,
} from './threadUtils';

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Homework | null;
  subjects: Subject[];
  onAddMessage: (homeworkId: string, message: Omit<ThreadMessage, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
}

export function ThreadDrawer({ isOpen, onClose, task, subjects, onAddMessage, onToggleComplete }: ThreadDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'gallery'>('chat');
  const [filterImagesOnly, setFilterImagesOnly] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<{
    previewUrl: string;
    blob: Blob;
    file: File;
    url: string;
  }[]>([]);
  const [isSpoilerChecked, setIsSpoilerChecked] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const authorName = useAnonIdentity();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task?.messages, isOpen, activeTab]);

  // Reset revealed spoilers and filter settings when switching to a different task
  // — prevents stale client-side IDs from matching real Supabase UUIDs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealedSpoilers(new Set());
    setFilterImagesOnly(false);
  }, [task?.id]);

  // Reset attachments when the drawer is closed
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttachments([]);
    }
  }, [isOpen]);

  // Cleanup dynamic object URLs and staged attachments on task switch or unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
      setAttachments([]);
    };
  }, [task?.id]);

  const subject = useMemo(
    () => (task ? subjects.find((s) => s.id === task.subjectId) ?? null : null),
    [task, subjects]
  );

  // Flat list of ALL attachments across all messages — used as the unfiltered base
  // for imageAttachments below. Keep this binding even if gallery is refactored;
  // imageAttachments derives from it and must stay in sync.
  const allAttachments = useMemo<GalleryItem[]>(() => {
    if (!task?.messages) return [];
    return task.messages.flatMap((msg) =>
      (msg.attachments ?? []).map((att) => ({
        messageId: msg.id,
        authorName: msg.authorName,
        createdAt: msg.createdAt,
        attachment: att,
      }))
    );
  }, [task]);

  // Solutions Gallery strictly filters to image attachments only — non-image
  // documents are excluded from both the gallery grid and the tab badge count.
  const imageAttachments = useMemo<GalleryItem[]>(() => {
    return allAttachments.filter((item) => parseAttachmentUrl(item.attachment.url).isImage);
  }, [allAttachments]);

  const filteredMessages = useMemo(() => {
    if (!task?.messages) return [];
    return filterImagesOnly
      ? task.messages.filter((m) => m.attachments?.some((att) => parseAttachmentUrl(att.url).isImage))
      : task.messages;
  }, [task, filterImagesOnly]);

  const toggleRevealSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsCompressing(true);

    const MAX_SIZE = 5 * 1024 * 1024;
    const localBatchUrls: string[] = [];
    const skippedFiles: string[] = [];
    const processed: typeof attachments = [];

    try {
      for (const file of selectedFiles) {
        let blob: Blob;
        let previewUrl = '';

        if (file.type.startsWith('image/')) {
          try {
            // Compress image first
            blob = await compressImage(file);
            // Verify compressed image size
            if (blob.size > MAX_SIZE) {
              skippedFiles.push(`${file.name} (exceeds 5MB after compression)`);
              continue;
            }
            const objectUrl = URL.createObjectURL(blob);
            localBatchUrls.push(objectUrl);
            objectUrlsRef.current.push(objectUrl);
            previewUrl = objectUrl;
          } catch (err) {
            console.error('Compression failed for', file.name, err);
            // Fallback to original file size check if compression fails
            if (file.size > MAX_SIZE) {
              skippedFiles.push(file.name);
              continue;
            }
            blob = file;
          }
        } else {
          // PDFs, Videos, sheets - check original size
          if (file.size > MAX_SIZE) {
            skippedFiles.push(file.name);
            continue;
          }
          blob = file;
        }

        const base64Url = await blobToBase64(blob);

        // Custom name parameter format embedded in Data URI to persist filename.
        // Guard: if the URL already contains ;name= (e.g. refactored call path),
        // skip re-injection to avoid producing a silently malformed Data URI.
        const enrichedUrl = base64Url.includes(';name=')
          ? base64Url
          : base64Url.replace(
              /^data:([^;]+);base64,/,
              `data:$1;name=${encodeURIComponent(file.name)};base64,`
            );

        processed.push({
          previewUrl,
          blob, // Final optimized binary ready to upload upstream
          file,
          url: enrichedUrl,
        });
      }

      if (skippedFiles.length > 0) {
        alert(`The following file(s) exceed the 5MB size limit and were skipped:\n${skippedFiles.join('\n')}`);
      }

      if (processed.length > 0) {
        setAttachments((prev) => [...prev, ...processed]);
      }
    } catch (err) {
      console.error(err);
      // Clean up object URLs created during this failed batch to prevent memory leaks
      localBatchUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = objectUrlsRef.current.filter((url) => !localBatchUrls.includes(url));
      alert('Failed to process one or more files.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!task) return;
    const taskId = task.id;
    if (!inputText.trim() && attachments.length === 0) return;

    // NOTE: For future integration with Supabase Storage, the binary payload
    // is stored as `att.blob` (or the original `att.file`). At this point,
    // you would invoke:
    //   await supabase.storage.from('attachments').upload(path, att.blob)
    // and retrieve the public HTTP URL to store in the database instead of
    // the base64 data URI. For now, we fall back to embedding the enriched base64 URL.
    const finalAttachments: ThreadAttachment[] = attachments.map((att, idx) => ({
      id: `att_${Date.now()}_${idx}`,
      url: att.url,
      isSpoiler: isSpoilerChecked,
    }));

    const senderName = authorName || getOrCreateAnonId();

    onAddMessage(taskId, {
      authorName: senderName,
      text: inputText.trim() || undefined,
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
    });

    // Clean up local preview object URLs as they are now sent/uploaded
    attachments.forEach((att) => {
      if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(att.previewUrl);
      }
    });
    objectUrlsRef.current = [];

    setInputText('');
    setAttachments([]);
    setIsSpoilerChecked(false);
    // Clear revealed spoilers — fake client-side IDs are now stale
    // (Supabase returns real UUIDs after save, so the set would never match)
    setRevealedSpoilers(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-page/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-surface border-l border-divider flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* ── Header ── */}
        <div className="p-5 border-b border-divider bg-surface/90 backdrop-blur-md sticky top-0 z-10 flex flex-col gap-3">
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
            <button onClick={onClose} className="p-1 text-secondary-text hover:text-primary-text rounded-lg hover:bg-hover-subtle transition" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-start gap-3 justify-between">
            <div className="flex-1 min-w-0">
              <h2 className={cn('text-lg font-bold text-primary-text leading-snug truncate', task.completed && 'line-through text-secondary-text font-normal')}>
                {task.title}
              </h2>
              {task.description && <p className="text-xs text-secondary-text mt-1 line-clamp-2">{task.description}</p>}
            </div>

            <button
              onClick={() => onToggleComplete(task.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-[0.98]',
                task.completed
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-input/50 border-divider text-secondary-text hover:text-primary-text hover:border-divider'
              )}
            >
              <CheckCircle2 size={14} className={task.completed ? 'text-emerald-400' : 'text-secondary-text'} />
              <span>{task.completed ? 'Done' : 'Mark Done'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-2xs text-secondary-text border-t border-divider/60 pt-2.5 mt-1">
            <span className="flex items-center gap-1"><Calendar size={12} className="text-secondary-text" /><span>Due: {formatDate(task.dueDate)}</span></span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-secondary-text" /><span>Status: {getDueDateStatusLabel(task.dueDate, task.completed)}</span></span>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-divider bg-page/40">
          {([
            { key: 'chat', icon: <MessageSquare size={14} />, label: `Discussion (${task.messages?.length ?? 0})` },
            { key: 'gallery', icon: <ImageIcon size={14} />, label: `Solutions Gallery (${imageAttachments.length})` },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-2',
                activeTab === key
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-surface/20'
                  : 'text-secondary-text hover:text-primary-text'
              )}
            >
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-page/20 flex flex-col min-h-0">
          {activeTab === 'chat' ? (
            <>
              {/* Filter row */}
              <div className="p-3 border-b border-divider bg-surface/50 flex justify-between items-center text-2xs">
                <span className="text-secondary-text font-semibold uppercase tracking-wider">Messages Stream</span>
                <button
                  onClick={() => setFilterImagesOnly((p) => !p)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md border transition active:scale-[0.98]',
                    filterImagesOnly
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-surface border-divider text-secondary-text hover:text-primary-text'
                  )}
                >
                  <ImageIcon size={11} /><span>Images only</span>
                </button>
              </div>

              {/* Messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col min-h-0">
                {filteredMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="h-10 w-10 text-secondary-text/60 mb-3" />
                    <h4 className="font-semibold text-primary-text text-sm">No discussions yet</h4>
                    <p className="text-secondary-text text-2xs mt-1 max-w-[240px]">
                      {filterImagesOnly
                        ? 'No images have been shared in this thread yet.'
                        : 'Start the study group discussion by typing a question or uploading a working sketch.'}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <ThreadMessageBubble
                      key={msg.id}
                      msg={msg}
                      revealedSpoilers={revealedSpoilers}
                      onRevealSpoiler={toggleRevealSpoiler}
                      onOpenLightbox={setLightboxImage}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-divider bg-surface flex flex-col gap-2.5">
                {/* Anon identity badge */}
                <div className="flex gap-2 items-center text-xs">
                  <span className="text-secondary-text">Posting as:</span>
                  <span className="font-mono font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                    {authorName || '…'}
                  </span>
                  <span className="text-secondary-text/80 italic">(your anonymous ID)</span>
                </div>

                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-input/60 border border-divider/80 rounded-xl">
                    {attachments.map((att, i) => {
                      const isImage = att.file.type.startsWith('image/');
                      return (
                        <div key={i} className="relative flex items-center bg-surface border border-divider rounded-lg p-1.5 pr-8 h-14 max-w-[200px] shrink-0">
                          {isImage ? (
                            <img src={att.previewUrl} alt="preview" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-input rounded flex items-center justify-center text-secondary-text border border-divider/60 shrink-0">
                              <FileText size={18} className="text-emerald-400" />
                            </div>
                          )}
                          <div className="ml-2 flex flex-col justify-center min-w-0 flex-1">
                            <span className="text-3xs font-semibold text-primary-text truncate">{att.file.name}</span>
                            <span className="text-[10px] text-secondary-text shrink-0">{(att.file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const removed = attachments[i];
                              if (removed.previewUrl && removed.previewUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(removed.previewUrl);
                                objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== removed.previewUrl);
                              }
                              setAttachments((p) => p.filter((_, idx) => idx !== i));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-400 transition shadow-md"
                            title="Remove attachment"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-1.5 ml-2">
                      <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1.5 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/15 transition select-none">
                        <input
                          type="checkbox"
                          checked={isSpoilerChecked}
                          onChange={(e) => setIsSpoilerChecked(e.target.checked)}
                          className="rounded text-amber-500 bg-input focus:ring-amber-500/20 w-3.5 h-3.5"
                        />
                        <span className="text-3xs uppercase tracking-wider">Blur as Spoiler</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf,text/*" multiple className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className={cn('p-3 bg-input border border-divider text-secondary-text rounded-xl hover:text-emerald-400 hover:border-divider transition active:scale-[0.97]', isCompressing && 'opacity-50 cursor-not-allowed')}
                    title="Attach file (images, PDFs, text)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isCompressing ? 'Processing files…' : 'Ask a question or share a solution…'}
                    rows={1}
                    disabled={isCompressing}
                    className="flex-1 bg-input border border-divider text-primary-text rounded-xl px-3.5 py-2.5 text-xs placeholder:text-secondary-text focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 resize-none min-h-[40px] max-h-[120px]"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
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
            <ThreadGallery
              items={imageAttachments}
              revealedSpoilers={revealedSpoilers}
              onRevealSpoiler={toggleRevealSpoiler}
              onOpenLightbox={setLightboxImage}
            />
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-page/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-surface border border-divider text-secondary-text hover:text-primary-text rounded-xl hover:bg-hover-subtle transition z-[70]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-divider bg-input/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImage} alt="Full size attachment" className="max-w-full max-h-[85vh] object-contain rounded-2xl select-none" />
          </div>
        </div>
      )}
    </>
  );
}
