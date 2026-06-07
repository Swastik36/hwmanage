'use client';

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <UIContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return ctx;
}
