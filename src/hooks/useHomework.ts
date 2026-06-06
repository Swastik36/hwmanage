'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Homework, Subject, ThreadMessage, ThreadAttachment } from '@/types';

// ─── Row-shape helpers ────────────────────────────────────────────────────────

interface DbSubjectRow {
  id: string;
  name: string;
  color: string;
}

interface DbHomeworkRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  subject_id: string;
  messages?: DbMessageRow[];
}

interface DbMessageRow {
  id: string;
  author_name: string;
  avatar_url?: string | null;
  text?: string | null;
  created_at: string;
  attachments?: DbAttachmentRow[];
}

interface DbAttachmentRow {
  id: string;
  url: string;
  is_spoiler: boolean;
}

export interface MutationStatus {
  loading: boolean;
  error: Error | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAttachment(row: DbAttachmentRow): ThreadAttachment {
  return { id: row.id, url: row.url, isSpoiler: row.is_spoiler };
}

function mapMessage(row: DbMessageRow): ThreadMessage {
  return {
    id: row.id,
    authorName: row.author_name,
    avatarUrl: row.avatar_url ?? undefined,
    text: row.text ?? undefined,
    createdAt: row.created_at,
    attachments: (row.attachments ?? []).map(mapAttachment),
  };
}

function mapHomework(row: DbHomeworkRow): Homework | null {
  // subject_id must always be present — orphaned rows are skipped
  if (!row.subject_id) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_date,
    completed: row.completed,
    priority: row.priority,
    subjectId: row.subject_id,
    messages: (row.messages ?? []).map(mapMessage),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHomework() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [mutationStates, setMutationStates] = useState<{
    addHomework: MutationStatus;
    addSubject: MutationStatus;
    deleteSubject: Record<string, MutationStatus>;
    toggleHomework: Record<string, MutationStatus>;
    editHomework: Record<string, MutationStatus>;
    deleteHomework: Record<string, MutationStatus>;
    addMessageToThread: Record<string, MutationStatus>;
  }>({
    addHomework: { loading: false, error: null },
    addSubject: { loading: false, error: null },
    deleteSubject: {},
    toggleHomework: {},
    editHomework: {},
    deleteHomework: {},
    addMessageToThread: {},
  });

  // ── 1. Fetch everything from Supabase on mount ────────────────────────────
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        const [{ data: subData, error: subError }, { data: hwData, error: hwError }] =
          await Promise.all([
            supabase.from('subjects').select('*').order('name'),
            supabase
              .from('homework')
              .select('*, messages(*, attachments(*))')
              .order('due_date', { ascending: true }),
          ]);

        if (subError) throw subError;
        if (hwError) throw hwError;

        setSubjects(
          (subData as DbSubjectRow[] | null ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color as Subject['color'],
          }))
        );
        setHomework(
          (hwData as DbHomeworkRow[] | null ?? [])
            .map(mapHomework)
            .filter((h): h is Homework => h !== null)
        );
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // ── 2. Add Homework ───────────────────────────────────────────────────────
  const addHomework = async (task: Omit<Homework, 'id' | 'completed' | 'messages'>) => {
    setMutationStates((prev) => ({
      ...prev,
      addHomework: { loading: true, error: null },
    }));
    try {
      const { data, error } = await supabase
        .from('homework')
        .insert({
          title: task.title,
          description: task.description ?? '',
          due_date: task.dueDate,
          priority: task.priority,
          subject_id: task.subjectId,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = mapHomework({ ...(data as DbHomeworkRow), messages: [] });
      if (!newItem) {
        throw new Error('Created homework row is missing subject_id');
      }
      setHomework((prev) => {
        const nextList = [...prev, newItem];
        return nextList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      });
      setMutationStates((prev) => ({
        ...prev,
        addHomework: { loading: false, error: null },
      }));
    } catch (err) {
      console.error('Failed to create homework:', err);
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        addHomework: { loading: false, error: errorInstance },
      }));
    }
  };

  // ── 3. Toggle completion (optimistic with rollback) ───────────────────────
  const toggleHomework = async (id: string) => {
    const target = homework.find((h) => h.id === id);
    if (!target) return;

    const next = !target.completed;

    // Optimistic update
    setHomework((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: next } : item))
    );

    setMutationStates((prev) => ({
      ...prev,
      toggleHomework: {
        ...prev.toggleHomework,
        [id]: { loading: true, error: null },
      },
    }));

    try {
      const { error } = await supabase
        .from('homework')
        .update({ completed: next })
        .eq('id', id);

      if (error) throw error;

      setMutationStates((prev) => {
        const nextStates = { ...prev.toggleHomework };
        delete nextStates[id];
        return {
          ...prev,
          toggleHomework: nextStates,
        };
      });
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      // Rollback
      setHomework((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed: !next } : item))
      );
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        toggleHomework: {
          ...prev.toggleHomework,
          [id]: { loading: false, error: errorInstance },
        },
      }));
    }
  };

  // ── 4. Edit Homework (optimistic with rollback) ───────────────────────────
  const editHomework = async (updated: Homework) => {
    // Snapshot original for rollback
    const original = homework.find((h) => h.id === updated.id);

    // Optimistic update
    setHomework((prev) => {
      const nextList = prev.map((item) => (item.id === updated.id ? updated : item));
      return nextList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    });

    setMutationStates((prev) => ({
      ...prev,
      editHomework: {
        ...prev.editHomework,
        [updated.id]: { loading: true, error: null },
      },
    }));

    try {
      const { error } = await supabase
        .from('homework')
        .update({
          title: updated.title,
          description: updated.description ?? '',
          due_date: updated.dueDate,
          priority: updated.priority,
          subject_id: updated.subjectId,
          completed: updated.completed,
        })
        .eq('id', updated.id);

      if (error) throw error;

      setMutationStates((prev) => {
        const nextStates = { ...prev.editHomework };
        delete nextStates[updated.id];
        return {
          ...prev,
          editHomework: nextStates,
        };
      });
    } catch (err) {
      console.error('Failed to edit homework:', err);
      // Rollback to original if available
      if (original) {
        setHomework((prev) => {
          const nextList = prev.map((item) => (item.id === updated.id ? original : item));
          return nextList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        });
      }
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        editHomework: {
          ...prev.editHomework,
          [updated.id]: { loading: false, error: errorInstance },
        },
      }));
    }
  };

  // ── 5. Delete Homework (optimistic with rollback) ─────────────────────────
  const deleteHomework = async (id: string) => {
    const snapshot = homework.find((h) => h.id === id);

    // Optimistic update
    setHomework((prev) => prev.filter((item) => item.id !== id));

    setMutationStates((prev) => ({
      ...prev,
      deleteHomework: {
        ...prev.deleteHomework,
        [id]: { loading: true, error: null },
      },
    }));

    try {
      const { error } = await supabase.from('homework').delete().eq('id', id);
      if (error) throw error;

      setMutationStates((prev) => {
        const nextStates = { ...prev.deleteHomework };
        delete nextStates[id];
        return {
          ...prev,
          deleteHomework: nextStates,
        };
      });
    } catch (err) {
      console.error('Failed to delete homework:', err);
      // Rollback functionally to avoid stale closure issues
      if (snapshot) {
        setHomework((prev) => {
          if (prev.some((item) => item.id === id)) return prev;
          const nextList = [...prev, snapshot];
          return nextList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        });
      }
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        deleteHomework: {
          ...prev.deleteHomework,
          [id]: { loading: false, error: errorInstance },
        },
      }));
    }
  };

  // ── 6. Add Subject ────────────────────────────────────────────────────────
  const addSubject = async (name: string, color: string) => {
    const validColors: Subject['color'][] = ['indigo', 'emerald', 'amber', 'rose'];
    const validatedColor = (
      validColors.includes(color as Subject['color']) ? color : 'indigo'
    ) as Subject['color'];

    setMutationStates((prev) => ({
      ...prev,
      addSubject: { loading: true, error: null },
    }));

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({ name, color: validatedColor })
        .select()
        .single();

      if (error) throw error;

      const subjectRow = data as DbSubjectRow;
      setSubjects((prev) => [
        ...prev,
        { id: subjectRow.id, name: subjectRow.name, color: validatedColor },
      ]);
      setMutationStates((prev) => ({
        ...prev,
        addSubject: { loading: false, error: null },
      }));
    } catch (err) {
      console.error('Failed to add subject:', err);
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        addSubject: { loading: false, error: errorInstance },
      }));
      throw errorInstance; // re-throw so callers can catch and show UI feedback
    }
  };

  // ── 8. Delete Subject (optimistic with rollback) ─────────────────────────
  const deleteSubject = async (id: string) => {
    // Check if any homework assignments are associated with the subject
    const hasHomework = homework.some((h) => h.subjectId === id);
    if (hasHomework) {
      throw new Error('Cannot delete subject with existing homework assignments');
    }

    const originalSubjects = subjects;

    // Optimistic update
    setSubjects((prev) => prev.filter((sub) => sub.id !== id));

    setMutationStates((prev) => ({
      ...prev,
      deleteSubject: {
        ...prev.deleteSubject,
        [id]: { loading: true, error: null },
      },
    }));

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;

      setMutationStates((prev) => {
        const nextStates = { ...prev.deleteSubject };
        delete nextStates[id];
        return {
          ...prev,
          deleteSubject: nextStates,
        };
      });
    } catch (err) {
      console.error('Failed to delete subject:', err);
      // Rollback to original subjects list
      setSubjects(originalSubjects);
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        deleteSubject: {
          ...prev.deleteSubject,
          [id]: { loading: false, error: errorInstance },
        },
      }));
      throw errorInstance;
    }
  };

  // ── 7. Add Message to Discussion Thread ───────────────────────────────────
  const addMessageToThread = async (
    homeworkId: string,
    message: Omit<ThreadMessage, 'id' | 'createdAt'>
  ) => {
    const tempMsgId = `temp_msg_${Date.now()}`;
    const optimisticMessage: ThreadMessage = {
      id: tempMsgId,
      authorName: message.authorName,
      text: message.text,
      createdAt: new Date().toISOString(),
      attachments: message.attachments,
    };

    // 1. Optimistic state update
    setHomework((prev) =>
      prev.map((item) => {
        if (item.id === homeworkId) {
          return {
            ...item,
            messages: [...(item.messages ?? []), optimisticMessage],
          };
        }
        return item;
      })
    );

    setMutationStates((prev) => ({
      ...prev,
      addMessageToThread: {
        ...prev.addMessageToThread,
        [homeworkId]: { loading: true, error: null },
      },
    }));

    try {
      // 2. Insert message row
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert({
          homework_id: homeworkId,
          author_name: message.authorName,
          text: message.text || null,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      const msgRow = msgData as DbMessageRow;

      // Insert attachments if any
      let savedAttachments: ThreadAttachment[] = [];
      if (message.attachments && message.attachments.length > 0) {
        const attachRows = message.attachments.map((a) => ({
          message_id: msgRow.id,
          url: a.url,
          is_spoiler: a.isSpoiler,
        }));

        const { data: attData, error: attError } = await supabase
          .from('attachments')
          .insert(attachRows)
          .select();

        if (attError) throw attError;
        savedAttachments = (attData as DbAttachmentRow[] ?? []).map(mapAttachment);
      }

      const newMessage: ThreadMessage = {
        id: msgRow.id,
        authorName: msgRow.author_name,
        text: msgRow.text ?? undefined,
        createdAt: msgRow.created_at,
        attachments: savedAttachments,
      };

      // 3. Reconcile optimistic message with database-saved one
      setHomework((prev) =>
        prev.map((item) => {
          if (item.id === homeworkId) {
            return {
              ...item,
              messages: (item.messages ?? []).map((m) =>
                m.id === tempMsgId ? newMessage : m
              ),
            };
          }
          return item;
        })
      );

      setMutationStates((prev) => {
        const nextStates = { ...prev.addMessageToThread };
        delete nextStates[homeworkId];
        return {
          ...prev,
          addMessageToThread: nextStates,
        };
      });
    } catch (err) {
      console.error('Failed to save thread message:', err);

      // 4. Rollback optimistic update on failure
      setHomework((prev) =>
        prev.map((item) => {
          if (item.id === homeworkId) {
            return {
              ...item,
              messages: (item.messages ?? []).filter((m) => m.id !== tempMsgId),
            };
          }
          return item;
        })
      );

      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setMutationStates((prev) => ({
        ...prev,
        addMessageToThread: {
          ...prev.addMessageToThread,
          [homeworkId]: { loading: false, error: errorInstance },
        },
      }));

      // 5. Explicit user feedback
      alert('Failed to send message. Please check your connection and try again.');
    }
  };

  return {
    homework,
    subjects,
    loading,
    mutationStates,
    addHomework,
    toggleHomework,
    editHomework,
    deleteHomework,
    addSubject,
    deleteSubject,
    addMessageToThread,
  };
}
