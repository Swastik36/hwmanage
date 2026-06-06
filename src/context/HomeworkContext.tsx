'use client';

import React, { createContext, useContext } from 'react';
import { useHomework } from '@/hooks/useHomework';

type HomeworkContextType = ReturnType<typeof useHomework>;

const HomeworkContext = createContext<HomeworkContextType | null>(null);

export function HomeworkProvider({ children }: { children: React.ReactNode }) {
  const value = useHomework();
  return (
    <HomeworkContext.Provider value={value}>
      {children}
    </HomeworkContext.Provider>
  );
}

export function useHomeworkContext() {
  const context = useContext(HomeworkContext);
  if (!context) {
    throw new Error('useHomeworkContext must be used within a HomeworkProvider');
  }
  return context;
}
