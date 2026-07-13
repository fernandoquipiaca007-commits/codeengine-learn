import { supabase } from './supabase';
import { AppLocale } from './locale';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

export async function downloadProduct(
  productId: string,
  locale: AppLocale = 'pt'
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('LOGIN_REQUIRED');
  }

  const url = `${BACKEND_URL}/api/downloads/${productId}?lang=${locale}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errorMsg = (err as { error?: string }).error || `Download failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    if (match) filename = decodeURIComponent(match[1]);

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download fetch failure:', err);
    throw err;
  }
}

export async function downloadBonus(
  bonusId: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('LOGIN_REQUIRED');
  }

  const url = `${BACKEND_URL}/api/downloads/bonus/${bonusId}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errorMsg = (err as { error?: string }).error || `Download failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'bonus-download.zip';
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    if (match) filename = decodeURIComponent(match[1]);

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Bonus download fetch failure:', err);
    throw err;
  }
}
