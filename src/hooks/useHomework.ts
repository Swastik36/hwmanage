'use client';

import { useState, useEffect } from 'react';
import { Homework, Subject, ThreadMessage } from '@/types';
import { db } from '@/lib/db';

export function useHomework() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data on mount (pure client side trigger)
  useEffect(() => {
    db.initializeDb();
    Promise.resolve().then(() => {
      setSubjects(db.getSubjects());
      setHomework(db.getHomework());
      setLoading(false);
    });
  }, []);

  // Declarative database syncing for homework state changes
  useEffect(() => {
    if (!loading) {
      db.saveHomework(homework);
    }
  }, [homework, loading]);

  // Declarative database syncing for subjects state changes
  useEffect(() => {
    if (!loading) {
      db.saveSubjects(subjects);
    }
  }, [subjects, loading]);

  // Add Homework (using functional updater to prevent stale closures)
  const addHomework = (task: Omit<Homework, 'id' | 'completed'>) => {
    setHomework((prev) => {
      const newHomeworkItem: Homework = {
        ...task,
        id: `h_${Date.now()}`,
        completed: false,
      };
      return [newHomeworkItem, ...prev];
    });
  };

  // Toggle Homework status (Completed vs Pending)
  const toggleHomework = (id: string) => {
    setHomework((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Edit Homework
  const editHomework = (updatedItem: Homework) => {
    setHomework((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  // Delete Homework
  const deleteHomework = (id: string) => {
    setHomework((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Subject (validating subject color options)
  const addSubject = (name: string, color: string) => {
    const validColors: Subject['color'][] = ['indigo', 'emerald', 'amber', 'rose'];
    const validatedColor = (validColors.includes(color as Subject['color'])
      ? color
      : 'indigo') as Subject['color'];

    setSubjects((prev) => [
      ...prev,
      {
        id: `s_${Date.now()}`,
        name,
        color: validatedColor,
      },
    ]);
  };

  // Add Message to Discussion Thread
  const addMessageToThread = (homeworkId: string, message: Omit<ThreadMessage, 'id' | 'createdAt'>) => {
    setHomework((prev) =>
      prev.map((item) => {
        if (item.id === homeworkId) {
          const currentMessages = item.messages || [];
          const newMessage: ThreadMessage = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          return {
            ...item,
            messages: [...currentMessages, newMessage],
          };
        }
        return item;
      })
    );
  };

  return {
    homework,
    subjects,
    loading,
    addHomework,
    toggleHomework,
    editHomework,
    deleteHomework,
    addSubject,
    addMessageToThread,
  };
}
