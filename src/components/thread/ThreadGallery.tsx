'use client';

import React from 'react';
import { cn, parseLocalDateTime } from '@/lib/utils';
import { Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from './threadUtils';

interface ThreadGalleryProps {
  items: GalleryItem[];
  revealedSpoilers: Set<string>;
  onRevealSpoiler: (id: string) => void;
  onOpenLightbox: (url: string) => void;
}

export function ThreadGallery({
  items,
  revealedSpoilers,
  onRevealSpoiler,
  onOpenLightbox,
}: ThreadGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <ImageIcon className="h-10 w-10 text-slate-700 mb-3" />
        <h4 className="font-semibold text-slate-300 text-sm">No solutions uploaded</h4>
        <p className="text-slate-500 text-2xs mt-1 max-w-[240px]">
          Solution images shared in the discussion thread will compile here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
      {items.map(({ authorName, createdAt, attachment }) => {
        const isBlurred = attachment.isSpoiler && !revealedSpoilers.has(attachment.id);
        return (
          <div
            key={attachment.id}
            onClick={() => {
              if (isBlurred) onRevealSpoiler(attachment.id);
              else onOpenLightbox(attachment.url);
            }}
            className={cn(
              'relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square cursor-pointer transition-all duration-300 flex flex-col group',
              isBlurred ? 'ring-1 ring-amber-500/30' : 'hover:border-slate-600 hover:scale-[1.02]'
            )}
          >
            {/* Image */}
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <img
                src={attachment.url}
                alt="homework solution"
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  isBlurred && 'blur-md brightness-50 scale-105'
                )}
              />

              {isBlurred && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-950/40">
                  <EyeOff size={16} className="text-amber-400 mb-1" />
                  <span className="text-4xs font-extrabold text-amber-400 tracking-wide uppercase">Spoiler</span>
                  <span className="text-5xs text-slate-300 mt-0.5">Click to reveal</span>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="p-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-4xs font-bold text-slate-300 truncate flex-1 pr-1">{authorName}</span>
              <span className="text-5xs text-slate-500 font-medium whitespace-nowrap">
                {parseLocalDateTime(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Re-blur toggle */}
            {attachment.isSpoiler && !isBlurred && (
              <button
                onClick={(e) => { e.stopPropagation(); onRevealSpoiler(attachment.id); }}
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
  );
}
