import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { AppLocale } from '../lib/locale';

export interface LocalizedProduct {
  id: string;
  product_id: string;
  language: string;
  title: string;
  subtitle?: string;
  description: string;
  content?: string;
  cta_text: string;
  cover_url: string;
  cover_storage_path?: string | null;
  preview_url?: string;
  storage_url?: string;
  custom_copy?: Record<string, unknown>;
  faq?: unknown[];
  testimonials?: unknown[];
  price: number;
  is_free?: boolean;
  stripe_price_id: string;
  category_id: string;
  subcategory_id?: string | null;
  aoa_price?: number | null;
  fastpay_link?: string | null;
  tags: string[];
  status: string;
  video_url?: string;
  category_name?: string | null;
}

export function useLocalizedProduct(productId: string | null) {
  const { locale } = useLocale();
  const [product, setProduct] = useState<LocalizedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }
    loadProduct(productId, locale);
  }, [productId, locale]);

  async function loadProduct(id: string, lang: AppLocale) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_product_localized', {
        p_product_id: id,
        p_lang: lang,
      });

      if (rpcError) {
        const { data: translation } = await supabase
          .from('products_translations')
          .select('*')
          .eq('product_id', id)
          .eq('language', lang)
          .maybeSingle();

        const { data: fallback } = await supabase
          .from('products_translations')
          .select('*')
          .eq('product_id', id)
          .eq('language', 'pt')
          .maybeSingle();

        const { data: base } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (!base) throw new Error('Product not found');

        const t = translation || fallback;
        setProduct({
          id: base.id,
          product_id: base.id,
          language: lang,
          title: t?.title || base.title,
          subtitle: t?.subtitle,
          description: t?.description || base.description,
          content: t?.content,
          cta_text: t?.cta_text || base.cta_text,
          cover_url: t?.cover_url || base.cover_url,
          cover_storage_path: base.cover_storage_path,
          preview_url: t?.preview_url || base.preview_url,
          storage_url: t?.storage_url || base.storage_url,
          custom_copy: t?.custom_copy || base.custom_copy,
          faq: t?.faq,
          testimonials: t?.testimonials,
          price: base.price,
          is_free: base.is_free,
          stripe_price_id: base.stripe_price_id,
          category_id: base.category_id,
          subcategory_id: base.subcategory_id,
          aoa_price: base.aoa_price,
          fastpay_link: base.fastpay_link,
          tags: base.tags,
          status: base.status,
          video_url: base.video_url,
          category_name: t?.category_name || null,
        });
      } else {
        setProduct(data as LocalizedProduct);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  return { product, loading, error, refetch: () => productId && loadProduct(productId, locale) };
}

export async function fetchLocalizedProducts(lang: AppLocale, status = 'active') {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, price, is_free, category_id, subcategory_id, aoa_price, fastpay_link, tags, status, created_at, stripe_price_id, video_url, cover_url, cover_storage_path, visibility, min_member_level, access_duration_days, use_shared_content, product_type, storage_url, preview_url')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error || !products?.length) return [];

  const ids = products.map((p) => p.id);
  const { data: translations } = await supabase
    .from('products_translations')
    .select('*')
    .in('product_id', ids)
    .in('language', [lang, 'pt']);

  return products.map((p) => {
    const t = translations?.find((tr) => tr.product_id === p.id && tr.language === lang);
    const fb = translations?.find((tr) => tr.product_id === p.id && tr.language === 'pt');
    const shared = p.use_shared_content;

    return {
      ...p,
      title: t?.title || fb?.title || '',
      description: t?.description || fb?.description || '',
      cover_url: shared ? p.cover_url : (t?.cover_url || fb?.cover_url || p.cover_url || ''),
      cover_storage_path: p.cover_storage_path,
      cta_text: t?.cta_text || fb?.cta_text || 'Comprar Agora',
      storage_url: shared ? p.storage_url : (t?.storage_url || fb?.storage_url),
      preview_url: shared ? p.preview_url : (t?.preview_url || fb?.preview_url),
      category_name: t?.category_name || fb?.category_name || null,
    };
  });
}
