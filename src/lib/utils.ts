import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a datetime/timestamp string in a timezone-safe manner.
 * Replaces space with 'T' and standardizes timezone suffixes for browser compatibility (e.g. Safari).
 */
export function parseLocalDateTime(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Replace space between date and time with 'T' (Safari compatibility)
  let normalized = dateStr.replace(' ', 'T');
  
  // Normalize short offsets like +00 or -05 to +00:00 or -05:00 for Safari support
  const shortOffset = normalized.match(/([+-]\d{2})$/);
  if (shortOffset) {
    normalized += ':00';
  } else if (normalized.includes('T') && !normalized.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
    // Treat as UTC by default if no timezone indicator is present
    normalized += 'Z';
  }
  
  return new Date(normalized);
}

/**
 * Parses a date string in a timezone-safe manner.
 * If the string contains a time portion (e.g. ISO format 'T' or space), it parses it and zeroes out the time.
 * If the string is just 'YYYY-MM-DD', it constructs the date using the local timezone.
 */
export function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T') || dateStr.includes(' ')) {
    const d = parseLocalDateTime(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string in a unified manner using local parsing.
 */
export function formatDate(dateStr: string, includeYear = true): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

/**
 * Helper to determine if a subject is a coaching subject based on its name.
 */
export function isCoachingSubject(name: string): boolean {
  const lower = name.toLowerCase().trim();
  // Matches: "Coaching Math", "Math Coaching", "Math - Coaching"
  // Does NOT match: "Pre-Coaching Math" (word boundary check)
  return /\bcoaching\b/.test(lower);
}

/**
 * Shared visible subject count constant for collapsing layouts.
 */
export const SUBJECT_VISIBLE_COUNT = 5;
