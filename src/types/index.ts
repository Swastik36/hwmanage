export interface Subject {
  id: string;
  name: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose'; // Tailwind color key (e.g. indigo, emerald, etc.)
}

export interface ThreadAttachment {
  id: string;
  url: string; // Base64 data URI or public link
  isSpoiler: boolean;
}

export interface ThreadMessage {
  id: string;
  authorName: string;
  avatarUrl?: string;
  text: string;
  createdAt: string; // ISO timestamp
  attachments?: ThreadAttachment[];
}

export interface Homework {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  dueDate: string; // YYYY-MM-DD format
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  messages?: ThreadMessage[];
}
