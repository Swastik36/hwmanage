import { Homework, Subject } from '@/types';

// Mock DB initial data
const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', color: 'indigo' },
  { id: '2', name: 'Science', color: 'emerald' },
  { id: '3', name: 'History', color: 'amber' },
  { id: '4', name: 'English Literature', color: 'rose' },
];

const INITIAL_HOMEWORK: Homework[] = [
  {
    id: 'h1',
    title: 'Calculus Assignment 3',
    description: 'Solve problems 1-15 on page 245. Show all working steps.',
    subjectId: '1',
    dueDate: '2026-06-07', // Static future date
    completed: false,
    priority: 'high',
    messages: [
      {
        id: 'msg1_1',
        authorName: 'Sarah Jenkins',
        text: "Hey guys, is anyone else stuck on question 7? I'm getting a negative value for the area under the curve, which doesn't seem right.",
        createdAt: '2026-06-05T12:45:00Z',
      },
      {
        id: 'msg1_2',
        authorName: 'Alex Rivera',
        text: "Yeah, Sarah. I had the same issue! I forgot to split the integral where it crosses the x-axis. Since it dips below, you have to take the absolute value of that section. Here's a graph of the curve I plotted to visualize it:",
        createdAt: '2026-06-05T12:50:00Z',
        attachments: [
          {
            id: 'att1',
            url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
            isSpoiler: true,
          }
        ]
      }
    ]
  },
  {
    id: 'h2',
    title: 'Photosynthesis Lab Report',
    description: 'Write up the observations from last Wednesday\'s lab experiment.',
    subjectId: '2',
    dueDate: '2026-06-09', // Static future date
    completed: false,
    priority: 'medium',
    messages: [
      {
        id: 'msg2_1',
        authorName: 'Sarah Jenkins',
        text: "Do we need to draw the Calvin cycle in the observations, or is that just for the discussion section?",
        createdAt: '2026-06-05T13:02:00Z',
      },
      {
        id: 'msg2_2',
        authorName: 'Liam Carter',
        text: "Our teacher said we only need the light-dependent reaction diagram in observations, and we can discuss the Calvin cycle in the analysis. Here's the diagram I sketched out from the textbook:",
        createdAt: '2026-06-05T13:10:00Z',
        attachments: [
          {
            id: 'att2',
            url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&auto=format&fit=crop&q=80',
            isSpoiler: false,
          }
        ]
      }
    ]
  },
  {
    id: 'h3',
    title: 'French Revolution Essay',
    description: 'Write a 500-word analysis of the causes of the French Revolution.',
    subjectId: '3',
    dueDate: '2026-06-04', // Static completed date
    completed: true,
    priority: 'low',
    messages: []
  },
];

// Helper to interact with LocalStorage for the client-side app demo
export const db = {
  initializeDb: () => {
    if (typeof window === 'undefined') return;
    try {
      const subjects = localStorage.getItem('hm_subjects');
      if (!subjects) {
        localStorage.setItem('hm_subjects', JSON.stringify(INITIAL_SUBJECTS));
      }
      const homework = localStorage.getItem('hm_homework');
      if (!homework) {
        localStorage.setItem('hm_homework', JSON.stringify(INITIAL_HOMEWORK));
      }
    } catch (e) {
      console.warn('localStorage initialization failed:', e);
    }
  },

  getSubjects: (): Subject[] => {
    if (typeof window === 'undefined') return INITIAL_SUBJECTS;
    try {
      const data = localStorage.getItem('hm_subjects');
      if (!data) return INITIAL_SUBJECTS;
      return JSON.parse(data);
    } catch (e) {
      console.warn('localStorage read failed, falling back to initial subjects:', e);
      return INITIAL_SUBJECTS;
    }
  },

  saveSubjects: (subjects: Subject[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('hm_subjects', JSON.stringify(subjects));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },

  getHomework: (): Homework[] => {
    if (typeof window === 'undefined') return INITIAL_HOMEWORK;
    try {
      const data = localStorage.getItem('hm_homework');
      if (!data) return INITIAL_HOMEWORK;
      const parsed: Homework[] = JSON.parse(data);
      // Migrate existing items that don't have messages array
      return parsed.map((item) => ({
        ...item,
        messages: item.messages || [],
      }));
    } catch (e) {
      console.warn('localStorage read failed, falling back to initial homework:', e);
      return INITIAL_HOMEWORK;
    }
  },

  saveHomework: (homework: Homework[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('hm_homework', JSON.stringify(homework));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
};

/**
 * PLACEHOLDER: Firebase/Supabase setup
 * 
 * If you decide to connect to Supabase:
 * 
 * import { createClient } from '@supabase/supabase-js'
 * 
 * const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
 * const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
 * 
 * export const supabase = createClient(supabaseUrl, supabaseAnonKey)
 */
