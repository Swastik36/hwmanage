'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hwmanage_anon_id';
const PREFIX = 'anonym';
const MIN_ID = 10_000_000;
const MAX_ID = 99_999_999;

function generateAnonId(): string {
  const num = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
  return `${PREFIX}${num}`;
}

export function getOrCreateAnonId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.startsWith(PREFIX)) {
      return stored;
    }
    const newId = generateAnonId();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch {
    // localStorage unavailable (SSR or private browsing with restrictions)
    return generateAnonId();
  }
}

/**
 * Returns a stable anonymous identity for the current browser session.
 * The ID is of the form `anonym########` and is persisted in localStorage.
 * The same browser always gets the same ID unless storage is cleared.
 */
export function useAnonIdentity(): string {
  const [anonId, setAnonId] = useState<string>('');

  useEffect(() => {
    setAnonId(getOrCreateAnonId());
  }, []);

  return anonId;
}
