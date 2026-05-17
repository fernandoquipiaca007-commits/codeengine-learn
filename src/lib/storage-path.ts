/**
 * Normalizes products.storage_url to a bucket-relative path for signed URLs.
 * Handles full public URLs and raw paths (e.g. "uuid/timestamp_file.pdf").
 */
export function getStoragePath(storageUrl: string): string {
  if (!storageUrl?.trim()) return '';

  const trimmed = storageUrl.trim();

  if (!trimmed.startsWith('http')) {
    return trimmed.replace(/^\//, '');
  }

  const publicMatch = trimmed.match(
    /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/
  );
  if (publicMatch?.[1]) {
    return decodeURIComponent(publicMatch[1]);
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    const objectIndex = parts.findIndex((p) => p === 'object');
    if (objectIndex >= 0 && parts.length > objectIndex + 2) {
      return decodeURIComponent(parts.slice(objectIndex + 3).join('/'));
    }
  } catch {
    /* ignore */
  }

  return trimmed;
}

/**
 * Resolves the display URL for a product cover image.
 * Prefers cover_storage_path (new) over cover_url (legacy).
 * For storage paths, generates the full public URL.
 */
export function getProductCoverUrl(product: {
  cover_url?: string | null;
  cover_storage_path?: string | null;
}): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Prefer the new storage_path column
  const path = product.cover_storage_path || product.cover_url;
  if (!path) return '';

  // Already a full URL — return as-is
  if (path.startsWith('http')) return path;

  // It's a relative path — build the public URL
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/product-covers/${path}`;
  }

  return path;
}

/**
 * Resolves the storage path for a product's downloadable file.
 * Prefers file_storage_path (new) over storage_url (legacy).
 */
export function getProductFilePath(product: {
  storage_url?: string | null;
  file_storage_path?: string | null;
}): string {
  const raw = product.file_storage_path || product.storage_url || '';
  return getStoragePath(raw);
}
