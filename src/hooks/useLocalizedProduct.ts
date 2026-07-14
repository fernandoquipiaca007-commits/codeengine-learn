import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { AppLocale } from '../lib/locale';
import { queryCache } from '../lib/queryCache';

export interface LocalizedProduct {
  id: string;
  product_id?: string;
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
  file_storage_path?: string | null;
  custom_copy?: Record<string, unknown>;
  faq?: unknown[];
  testimonials?: unknown[];
  price: number;
  is_free?: boolean;
  stripe_price_id: string;
  category_id: string;
  additional_category_ids?: string[];
  subcategory_id?: string | null;
  aoa_price?: number | null;
  fastpay_link?: string | null;
  tags: string[];
  status: string;
  video_url?: string;
  category_name?: string | null;
  codeengine_recommended?: boolean;
  editor_choice?: boolean;
  featured_pick?: boolean;
  is_bestseller?: boolean;
  product_type?: 'file' | 'course' | 'ebook';
  isSponsored?: boolean;
  theme_video_path?: string | null;
  theme_video_config?: any;
  created_at?: string;
  updated_at?: string;
}

export function useLocalizedProduct(productId: string | null) {
  const { locale } = useLocale();
  const [product, setProduct] = useState<LocalizedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProductRef = useRef({ productId, locale });
  useEffect(() => {
    activeProductRef.current = { productId, locale };
  }, [productId, locale]);

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
    console.log('[useLocalizedProduct] loadProduct starting execution:', { productId: id, locale: lang });
    try {
      const fetcher = async () => {
        const { data, error: rpcError } = await supabase.rpc('get_product_localized', {
          p_product_id: id,
          p_lang: lang,
        });

        if (rpcError) {
          console.warn('[useLocalizedProduct] RPC get_product_localized failed. Error:', rpcError, '. Falling back to client query.');
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
            .select(`
              *,
              collaborator:collaborators (
                id,
                display_name,
                plan,
                members (
                  profile_data
                )
              )
            `)
            .eq('id', id)
            .single();

          if (!base) throw new Error('Product not found');

          const t = translation || fallback;
          const mappedProduct = {
            id: base.id,
            product_id: base.id,
            language: lang,
            title: t?.title || base.title,
            subtitle: t?.subtitle,
            description: t?.description || base.description,
            content: t?.content,
            cta_text: t?.cta_text || base.cta_text,
            cover_url: t?.cover_url || base.cover_url,
            cover_storage_path: t?.cover_url || base.cover_storage_path,
            preview_url: t?.preview_url || base.preview_url,
            storage_url: t?.storage_url || base.storage_url,
            file_storage_path: t?.storage_url || base.file_storage_path,
            custom_copy: t?.custom_copy || base.custom_copy,
            faq: t?.faq,
            testimonials: t?.testimonials,
            price: base.price,
            is_free: base.is_free,
            stripe_price_id: base.stripe_price_id,
            category_id: base.category_id,
            additional_category_ids: base.additional_category_ids || [],
            subcategory_id: base.subcategory_id,
            aoa_price: base.aoa_price,
            fastpay_link: base.fastpay_link,
            tags: base.tags,
            status: base.status,
            video_url: base.video_url,
            category_name: t?.category_name || null,
            created_at: base.created_at,
            updated_at: t?.cover_url ? t.updated_at : base.updated_at,
            collaborator: base.collaborator,
          };
          console.log('[useLocalizedProduct] Client-resolved product:', {
            locale: lang,
            translation_found: !!translation,
            fallback_found: !!fallback,
            cover_url: mappedProduct.cover_url,
            cover_storage_path: mappedProduct.cover_storage_path
          });
          return mappedProduct;
        } else {
          console.log('[useLocalizedProduct] RPC get_product_localized succeeded. Returned:', data);
          return data as LocalizedProduct;
        }
      };

      const cacheKey = `localized-product-${id}-${lang}`;
      const cachedData = await queryCache.get(cacheKey, fetcher);

      if (activeProductRef.current.productId !== id || activeProductRef.current.locale !== lang) {
        return;
      }
      setProduct(cachedData);
    } catch (err) {
      if (activeProductRef.current.productId === id && activeProductRef.current.locale === lang) {
        console.error('[useLocalizedProduct] Error in loadProduct:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      }
    } finally {
      if (activeProductRef.current.productId === id && activeProductRef.current.locale === lang) {
        setLoading(false);
      }
    }
  }

  return { product, loading, error, refetch: () => productId && loadProduct(productId, locale) };
}

export async function fetchLocalizedProducts(lang: AppLocale, status = 'active') {
  console.log('[fetchLocalizedProducts] fetching for language:', lang, 'status:', status);
  
  const fetcher = async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, title, description, price, is_free, category_id, additional_category_ids, subcategory_id, aoa_price, fastpay_link, tags, status, created_at, updated_at, stripe_price_id, video_url, cover_url, cover_storage_path, visibility, min_member_level, access_duration_days, use_shared_content, product_type, storage_url, preview_url, file_storage_path, codeengine_recommended, editor_choice, featured_pick, is_bestseller,
        collaborator:collaborators (
          id,
          display_name,
          plan,
          members (
            profile_data
          )
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error || !products?.length) {
      console.error('[fetchLocalizedProducts] error or empty products list:', error);
      return [];
    }

    const ids = products.map((p) => p.id);
    const { data: translations } = await supabase
      .from('products_translations')
      .select('*')
      .in('product_id', ids)
      .in('language', [lang, 'pt']);

    console.log('[fetchLocalizedProducts] translations loaded:', translations);

    return products.map((p) => {
      const t = translations?.find((tr) => tr.product_id === p.id && tr.language === lang);
      const fb = translations?.find((tr) => tr.product_id === p.id && tr.language === 'pt');
      const shared = p.use_shared_content;

      const mapped = {
        ...p,
        title: t?.title || fb?.title || p.title || '',
        description: t?.description || fb?.description || p.description || '',
        cover_url: shared ? p.cover_url : (t?.cover_url || fb?.cover_url || p.cover_url || ''),
        cover_storage_path: shared ? p.cover_storage_path : (t?.cover_url || fb?.cover_url || p.cover_storage_path),
        cta_text: t?.cta_text || fb?.cta_text || 'Comprar Agora',
        storage_url: shared ? p.storage_url : (t?.storage_url || fb?.storage_url),
        preview_url: shared ? p.preview_url : (t?.preview_url || fb?.preview_url),
        file_storage_path: shared ? p.file_storage_path : (t?.storage_url || fb?.storage_url || p.file_storage_path),
        category_name: t?.category_name || fb?.category_name || null,
        language: lang,
        updated_at: (!shared && t?.cover_url) ? t.updated_at : p.updated_at,
        collaborator: p.collaborator,
      };

      console.log(`[fetchLocalizedProducts] mapped product ${p.id}:`, {
        title: mapped.title,
        cover_url: mapped.cover_url,
        cover_storage_path: mapped.cover_storage_path,
        shared
      });

      return mapped;
    });
  };

  const cacheKey = `localized-products-list-${lang}-${status}`;
  const cachedProducts = await queryCache.get(cacheKey, fetcher);

  // Get current user session to check ownership of hidden products
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  let currentCollabId: string | null = null;
  if (userId) {
    const { data: collab } = await supabase
      .from('collaborators')
      .select('id')
      .eq('member_id', userId)
      .maybeSingle();
    currentCollabId = collab?.id || null;
  }

  return (cachedProducts || []).filter((p: any) => {
    const vis = p.visibility || 'public';
    if (vis === 'hidden') {
      return currentCollabId && p.collaborator_id === currentCollabId;
    }
    return true;
  });
}
