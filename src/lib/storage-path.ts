/**
 * Normalizes products.storage_url to a bucket-relative path for signed URLs.
 * Handles full public URLs and raw paths (e.g. "uuid/timestamp_file.pdf").
 */
export function getStoragePath(storageUrl: string): string {
  if (!storageUrl?.trim()) return '';

  const trimmed = storageUrl.trim();

  if (!trimmed.startsWith('http')) {
    return decodeURIComponent(trimmed.replace(/^\//, ''));
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
/**
 * Resolves any public storage URL or path (Supabase or Cloudflare R2).
 */
export function getPublicStorageUrl(
  urlOrPath: string | null | undefined,
  bucketName: string,
  updatedAt?: string | null
): string {
  if (!urlOrPath?.trim()) return '';
  const trimmed = urlOrPath.trim();

  let baseUrl = '';
  if (trimmed.startsWith('r2://')) {
    const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-c54d043e644fcfd77ca7c0307a26917b.r2.dev';
    baseUrl = `${R2_PUBLIC_URL}/${trimmed.replace('r2://', '')}`;
  } else if (trimmed.startsWith('http')) {
    baseUrl = trimmed;
  } else {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ffdqqiunkzhtgbgaojay.supabase.co';
    const cleanPath = trimmed.replace(/^\//, '');
    const cleanBaseUrl = supabaseUrl.replace(/\/$/, '');
    baseUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
  }

  // Add cache buster if updatedAt is present to bypass browser cache
  if (updatedAt) {
    try {
      const t = new Date(updatedAt).getTime();
      if (!isNaN(t)) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        baseUrl = `${baseUrl}${separator}t=${t}`;
      }
    } catch {
      // ignore
    }
  }

  return baseUrl;
}

/**
 * Resolves the display URL for a product cover image.
 * Prefers cover_storage_path (new) over cover_url (legacy).
 * For storage paths, generates the full public URL.
 */
export function getProductCoverUrl(
  product: {
    cover_url?: string | null;
    cover_storage_path?: string | null;
    language?: string | null;
    use_shared_content?: boolean | null;
    updated_at?: string | null;
  },
  activeLocale?: string
): string {
  const currentLang = activeLocale || product.language || 'pt';

  // By default, prefer cover_storage_path (new) over cover_url (legacy)
  let path = (product.cover_storage_path || product.cover_url || '').trim();

  // If we have a language and it is not Portuguese (pt), and we are not sharing content,
  // we must prefer the translated cover_url over the base cover_storage_path.
  if (
    currentLang &&
    currentLang !== 'pt' &&
    !product.use_shared_content &&
    product.cover_url
  ) {
    path = product.cover_url.trim();
  }

  if (!path) return '';

  let baseUrl = '';
  if (path.startsWith('r2://')) {
    const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-c54d043e644fcfd77ca7c0307a26917b.r2.dev';
    baseUrl = `${R2_PUBLIC_URL}/${path.replace('r2://', '')}`;
  } else {
    baseUrl = getPublicStorageUrl(path, 'product-covers');
  }

  // Add cache buster if updated_at is present to bypass browser cache
  if (product.updated_at) {
    try {
      const t = new Date(product.updated_at).getTime();
      if (!isNaN(t)) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        baseUrl = `${baseUrl}${separator}t=${t}`;
      }
    } catch {
      // ignore
    }
  }

  console.log('[getProductCoverUrl] input product:', {
    cover_url: product.cover_url,
    cover_storage_path: product.cover_storage_path,
    language: product.language,
    use_shared_content: product.use_shared_content,
    updated_at: product.updated_at
  }, '-> final URL:', baseUrl);

  return baseUrl;
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
