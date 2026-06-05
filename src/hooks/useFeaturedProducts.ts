import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getProductCoverUrl } from '../lib/storage-path';
import { queryCache } from '../lib/queryCache';
import { useLocale } from '../contexts/LocaleContext';

export interface FeaturedProductCard {
  id: string;
  product_id: string;
  order_position: number;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  cta: string;
  tag: string;
}

export function useFeaturedProducts() {
  const { locale } = useLocale();
  const [items, setItems] = useState<FeaturedProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('featured_products')
      .select(
        `
        id,
        product_id,
        order_position,
        custom_title,
        custom_subtitle,
        custom_description,
        custom_cover,
        custom_cta,
        products (
          id,
          title,
          description,
          cover_url,
          cover_storage_path,
          tags,
          status,
          updated_at,
          use_shared_content
        )
      `
      )
      .eq('active', true)
      .order('order_position', { ascending: true })
      .limit(3);

    if (error) throw error;

    const filteredRows = (data ?? []).filter((row: any) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      return product && product.status === 'active';
    });

    const ids = filteredRows.map((row: any) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      return product.id;
    });

    let translations: any[] = [];
    if (ids.length > 0) {
      const { data: trs } = await supabase
        .from('products_translations')
        .select('*')
        .in('product_id', ids)
        .in('language', [locale, 'pt']);
      translations = trs ?? [];
    }

    return filteredRows.map((row: any) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      if (!product) {
        return {
          id: row.id,
          product_id: row.product_id,
          order_position: row.order_position,
          title: '',
          subtitle: '',
          description: '',
          cover_url: '',
          cta: '',
          tag: '',
        };
      }

      const t = translations.find((tr) => tr.product_id === product.id && tr.language === locale);
      const fb = translations.find((tr) => tr.product_id === product.id && tr.language === 'pt');
      const useShared = Boolean(product.use_shared_content);

      // Localize details from translations
      const title = useShared ? product.title : (t?.title || fb?.title || product.title);
      const description = useShared ? product.description : (t?.description || fb?.description || product.description);
      const cover_url = useShared ? product.cover_url : (t?.cover_url || fb?.cover_url || product.cover_url);
      const cover_storage_path = useShared ? product.cover_storage_path : (t?.cover_url || fb?.cover_url || product.cover_storage_path);

      const tags = product.tags ?? [];
      const resolvedCover = row.custom_cover?.trim() ||
        getProductCoverUrl({
          cover_url,
          cover_storage_path,
          language: useShared ? 'pt' : locale,
          use_shared_content: useShared,
          updated_at: product.updated_at
        });

      const defaultCta = locale === 'pt' ? 'Ver produto' : locale === 'fr' ? 'Voir le produit' : 'View product';

      return {
        id: row.id,
        product_id: row.product_id,
        order_position: row.order_position,
        title: row.custom_title?.trim() || title,
        subtitle: row.custom_subtitle?.trim() || (tags[0] ?? (locale === 'pt' ? 'PRODUTO' : 'PRODUCT')),
        description:
          row.custom_description?.trim() ||
          description?.slice(0, 120) ||
          '',
        cover_url: resolvedCover,
        cta: row.custom_cta?.trim() || defaultCta,
        tag: tags[0]?.toUpperCase() ?? (locale === 'pt' ? 'PRODUTO' : 'PRODUCT'),
      };
    });
  }, [locale]);

  const load = useCallback(async (revalidate = true) => {
    try {
      const cachedData = await queryCache.get(`featured-products-${locale}`, fetcher, { revalidate });
      setItems(cachedData);
    } catch (err) {
      console.error('[featured] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetcher, locale]);

  useEffect(() => {
    void load();

    // Subscribe to Cache changes for reactive updates
    const unsubscribeCache = queryCache.subscribe(`featured-products-${locale}`, (data) => {
      setItems(data);
      setLoading(false);
    });

    // Realtime postgres changes subscription (Supabase)
    const channel = supabase
      .channel(`featured-products-live-${locale}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_products' }, () => {
        queryCache.invalidate(`featured-products-${locale}`);
        void load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryCache.invalidate(`featured-products-${locale}`);
        void load();
      })
      .subscribe();

    return () => {
      unsubscribeCache();
      void supabase.removeChannel(channel);
    };
  }, [load, locale]);

  return { items, loading, refresh: () => load(true) };
}
