import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a VND amount for display.
 * Examples:
 *  formatCurrency(5000000) -> "5.000.000₫"
 *  formatCurrency(125000)  -> "125.000₫"
 */
export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "";
  try {
    return value.toLocaleString("vi-VN") + "₫";
  } catch {
    return String(value) + "₫";
  }
}


/**
 * Normalize image URL to ensure it renders correctly
 * - Handles null/undefined/empty
 * - Fixes paths starting with public/
 * - Ensures local paths start with /
 * - Keeps external URLs intact
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return '/placeholder-room.jpg';
  
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  let normalized = url;
  
  // Replace backslashes with forward slashes just in case
  normalized = normalized.replace(/\\/g, '/');
  
  // Remove "public/" if it exists at the start
  if (normalized.startsWith('public/')) {
    normalized = normalized.replace(/^public\//, '/');
  }
  
  // Ensure it starts with a slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // If the string is just '/' or similar after cleanup, return fallback
  if (normalized === '/' || normalized.trim() === '') {
    return '/placeholder-room.jpg';
  }
  
  return normalized;
}
