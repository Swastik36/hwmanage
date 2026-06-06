import { Subject, Homework, ThreadAttachment } from '@/types';
import { parseLocalDate, formatDate } from '@/lib/utils';
export { formatDate };

export const getInitials = (name: string): string => {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

export const getAvatarColorClass = (name: string): string => {
  const safeName = name ? name.trim() : '';
  const hash = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

export const getSubjectColorPill = (color: Subject['color']): string => {
  switch (color) {
    case 'indigo':  return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'emerald': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'amber':   return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'rose':    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
};

export const getPriorityBadge = (priority: Homework['priority']): string => {
  switch (priority) {
    case 'high':   return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'low':    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
};


export const getDueDateStatusLabel = (dateStr: string, completed: boolean): string => {
  if (completed) return 'Completed';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseLocalDate(dateStr);
  if (dueDate < today) return 'Overdue';
  if (dueDate.getTime() === today.getTime()) return 'Due Today';
  return 'Upcoming';
};

export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDimension = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression output returned null'));
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            0.7
          );
        } else {
          reject(new Error('Canvas context unavailable'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
};

// Compiled flat list of all attachments from all messages for the gallery tab
export interface GalleryItem {
  messageId: string;
  authorName: string;
  createdAt: string;
  attachment: ThreadAttachment;
}

export interface ParsedAttachment {
  isImage: boolean;
  mimeType: string;
  fileName: string;
}

export const parseAttachmentUrl = (url: string): ParsedAttachment => {
  if (!url) {
    return { isImage: false, mimeType: '', fileName: 'attachment' };
  }

  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+)(?:;name=([^;]+))?;base64,/);
    if (match) {
      const mimeType = match[1] || '';
      const isImage = mimeType.startsWith('image/');
      let fileName = 'Document';
      if (match[2]) {
        fileName = decodeURIComponent(match[2]);
      } else {
        // Fallback name based on MIME type
        if (mimeType === 'application/pdf') fileName = 'Document.pdf';
        else if (mimeType.startsWith('text/')) fileName = 'Document.txt';
      }
      return { isImage, mimeType, fileName };
    }
  }

  // Fallback for standard URLs
  const cleanUrl = url.split(/[?#]/)[0];
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(cleanUrl);
  let fileName = 'Attachment';
  const parts = cleanUrl.split('/');
  const lastPart = parts[parts.length - 1];
  if (lastPart && !lastPart.startsWith('data:')) {
    fileName = lastPart;
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  let mimeType = 'application/octet-stream';
  if (isImage) {
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'bmp') mimeType = 'image/bmp';
    else mimeType = 'image/jpeg';
  }
  
  return {
    isImage,
    mimeType,
    fileName,
  };
};

