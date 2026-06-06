import { useState, useEffect, useMemo } from 'react';
import { Subject } from '@/types';
import { isCoachingSubject, SUBJECT_VISIBLE_COUNT } from '@/lib/utils';

interface UseSubjectFilterOptions {
  selectedSubjectId?: string | null;
  onSelectionExcluded?: () => void;
}

export function useSubjectFilter(subjects: Subject[], options?: UseSubjectFilterOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'school' | 'coaching'>('all');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setExpanded(false));
  }, [searchQuery, activeCategory]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isCoaching = isCoachingSubject(subject.name);
      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'coaching' && isCoaching) ||
        (activeCategory === 'school' && !isCoaching);
      return matchesSearch && matchesCategory;
    });
  }, [subjects, searchQuery, activeCategory]);

  const displayedSubjects = useMemo(() => {
    return expanded ? filteredSubjects : filteredSubjects.slice(0, SUBJECT_VISIBLE_COUNT);
  }, [filteredSubjects, expanded]);

  const selectedSubjectId = options?.selectedSubjectId;
  const onSelectionExcluded = options?.onSelectionExcluded;

  useEffect(() => {
    if (selectedSubjectId && onSelectionExcluded) {
      const isStillVisible = filteredSubjects.some((s) => s.id === selectedSubjectId);
      if (!isStillVisible) {
        Promise.resolve().then(() => {
          onSelectionExcluded();
        });
      }
    }
  }, [filteredSubjects, selectedSubjectId, onSelectionExcluded]);

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    expanded,
    setExpanded,
    filteredSubjects,
    displayedSubjects,
  };
}
