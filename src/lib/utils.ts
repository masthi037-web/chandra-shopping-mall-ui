import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Handle multiple images joined by &&&
  const firstPath = path.split('&&&')[0];
  if (!firstPath) return '';

  if (firstPath.startsWith('http') || firstPath.startsWith('blob:')) return firstPath;

  // Ensure we don't double slash
  const cleanPath = firstPath.startsWith('/') ? firstPath.slice(1) : firstPath;
  return `https://api.manabuy.in/${cleanPath}`;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}
