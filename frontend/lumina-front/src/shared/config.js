/**
 * Базовый URL бэкенда без завершающего слэша.
 * Задаётся через VITE_API_URL (например https://api.example.com) или по умолчанию локальный Django.
 */
const trimmed = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
export const API_URL = trimmed || 'http://localhost:8000';

/**
 * Относительный путь с API (например /media/...) → абсолютный URL для <img src>.
 */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_URL}${path}`;
  return `${API_URL}/media/${path}`;
}
