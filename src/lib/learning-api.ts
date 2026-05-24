import { supabase } from './supabase';
import { AppLocale } from './locale';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export async function getLessonStreamUrl(lessonId: string): Promise<{ url: string; type: 'video' | 'audio' | 'link' }> {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}/api/lessons/${lessonId}/stream`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load media');
  }
  const data = await res.json();
  return { url: data.url, type: data.type || 'video' };
}

export async function saveProgress(payload: {
  product_id: string;
  lesson_id?: string;
  progress_type: 'video' | 'ebook';
  position_seconds?: number;
  position_percent?: number;
  page_number?: number;
  status?: string;
}) {
  const headers = await authHeaders();
  await fetch(`${BACKEND_URL}/api/progress`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

export async function getProductProgress(productId: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}/api/progress/${productId}`, { headers });
  if (!res.ok) throw new Error('Failed to load progress');
  return res.json();
}

export async function getContinueWatching() {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}/api/progress/continue`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.continue;
}

export async function getMemberLibrary() {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}/api/progress/library`, { headers });
  if (!res.ok) throw new Error('Failed to load library');
  const data = await res.json();
  return data.library as LibraryItem[];
}

export async function getEbookReadUrl(productId: string, locale: AppLocale = 'pt') {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}/api/ebooks/${productId}/read?lang=${locale}`, { headers });
  if (!res.ok) throw new Error('Failed to load ebook');
  return res.json() as { url: string; format: string };
}

export interface LibraryItem {
  id: string;
  title: string;
  cover_url: string;
  product_type: 'file' | 'course' | 'ebook';
  is_free?: boolean;
  percentComplete: number;
  status: string;
  lastProgress?: {
    lesson_id?: string;
    position_seconds?: number;
    page_number?: number;
    progress_type: string;
  };
}

export function downloadLesson(lessonId: string) {
  return authHeaders().then((headers) => {
    window.open(`${BACKEND_URL}/api/lessons/${lessonId}/download`, '_blank');
  });
}
