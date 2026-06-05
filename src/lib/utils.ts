import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a date string in a timezone-safe manner.
 * If the string contains a time portion (e.g. ISO format 'T'), it parses it and zeroes out the time.
 * If the string is just 'YYYY-MM-DD', it constructs the date using the local timezone.
 */
export function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
