'use client';

import React from 'react';
import { ThreadMessage } from '@/types';
import { cn, parseLocalDateTime } from '@/lib/utils';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { getInitials, getAvatarColorClass, parseAttachmentUrl } from './threadUtils';

interface ThreadMessageBubbleProps {
  msg: ThreadMessage;
  revealedSpoilers: Set<string>;
  onRevealSpoiler: (id: string) => void;
  onOpenLightbox: (url: string) => void;
}

export function ThreadMessageBubble({
  msg,
  revealedSpoilers,
  onRevealSpoiler,
  onOpenLightbox,
}: ThreadMessageBubbleProps) {
  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 shadow-inner',
          getAvatarColorClass(msg.authorName)
        )}
      >
        {getInitials(msg.authorName)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Author + timestamp */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-slate-200">{msg.authorName}</span>
          <span className="text-3xs text-slate-500">
            {parseLocalDateTime(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Text bubble */}
        {msg.text && (
          <div className="mt-1 text-xs text-slate-200 bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 leading-relaxed break-words whitespace-pre-wrap">
            {msg.text}
          </div>
        )}

        {/* Attachment thumbnails */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.attachments.map((att) => {
              const parsed = parseAttachmentUrl(att.url);
              const isBlurred = att.isSpoiler && !revealedSpoilers.has(att.id);
              return (
                <div
                  key={att.id}
                  onClick={() => {
                    if (isBlurred) {
                      onRevealSpoiler(att.id);
                    } else if (parsed.isImage) {
                      onOpenLightbox(att.url);
                    } else {
                      // Trigger local download for documents/files
                      const link = document.createElement('a');
                      link.href = att.url;
                      link.download = parsed.fileName;
                      link.click();
                    }
                  }}
                  className={cn(
                    'relative w-28 h-28 rounded-lg overflow-hidden border border-slate-800 cursor-pointer bg-slate-950 flex items-center justify-center transition-all duration-300',
                    isBlurred ? 'ring-1 ring-amber-500/30' : 'hover:border-slate-600 hover:scale-[1.02]'
                  )}
                >
                  {parsed.isImage ? (
                    <img
                      src={att.url}
                      alt="discussion attachment"
                      className={cn(
                        'w-full h-full object-cover transition-all duration-500',
                        isBlurred && 'blur-md brightness-50 scale-105'
                      )}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center h-full w-full">
                      <FileText size={24} className={cn('text-emerald-400 mb-1.5', isBlurred && 'blur-[2px]')} />
                      <span className={cn('text-4xs font-semibold text-slate-300 line-clamp-2 px-1 break-all', isBlurred && 'blur-[3px] select-none')}>
                        {parsed.fileName}
                      </span>
                      <span className="text-5xs text-slate-500 mt-1 uppercase tracking-wider">
                        {parsed.mimeType.split('/')[1] || 'FILE'}
                      </span>
                    </div>
                  )}

                  {/* Spoiler overlay */}
                  {isBlurred && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/60 backdrop-blur-sm">
                      <EyeOff size={16} className="text-amber-400 mb-1" />
                      <span className="text-3xs font-extrabold text-amber-400 tracking-wide uppercase">Spoiler</span>
                      <span className="text-4xs text-slate-300 mt-0.5">Click to reveal</span>
                    </div>
                  )}

                  {/* Re-blur button */}
                  {att.isSpoiler && !isBlurred && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRevealSpoiler(att.id); }}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-md text-amber-400 hover:text-amber-300 hover:bg-slate-900 transition"
                      title="Hide spoiler"
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
  );
}
