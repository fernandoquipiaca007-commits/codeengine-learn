/** Evita crash ao renderizar valores do Supabase/JSONB no JSX */
export function safeText(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function safePrice(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isUserInAngola(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === 'Africa/Luanda';
  } catch (e) {
    return false;
  }
}

export function formatProductPrice(price: number, aoaPrice?: number | null): string {
  if (isUserInAngola() && aoaPrice != null && aoaPrice > 0) {
    const formatted = new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(aoaPrice);
    return `${formatted} Kz`;
  }
  return `$ ${price}`;
}

