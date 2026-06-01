import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getProductCoverUrl } from '../lib/storage-path';
import { queryCache } from '../lib/queryCache';

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
          status
        )
      `
      )
      .eq('active', true)
      .order('order_position', { ascending: true })
      .limit(3);

    if (error) throw error;

    return (data ?? [])
      .filter((row: any) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        return product && product.status === 'active';
      })
      .map((row: any) => {
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
        const tags = product.tags ?? [];
        // Resolve cover: custom_cover > cover_storage_path > cover_url
        const resolvedCover = row.custom_cover?.trim() ||
          getProductCoverUrl({ cover_url: product.cover_url, cover_storage_path: product.cover_storage_path });
        return {
          id: row.id,
          product_id: row.product_id,
          order_position: row.order_position,
          title: row.custom_title?.trim() || product.title,
          subtitle: row.custom_subtitle?.trim() || (tags[0] ?? 'PRODUTO'),
          description:
            row.custom_description?.trim() ||
            product.description?.slice(0, 120) ||
            '',
          cover_url: resolvedCover,
          cta: row.custom_cta?.trim() || 'Ver produto',
          tag: tags[0]?.toUpperCase() ?? 'PRODUTO',
        };
      });
  }, []);

  const load = useCallback(async (revalidate = true) => {
    try {
      const cachedData = await queryCache.get('featured-products', fetcher, { revalidate });
      setItems(cachedData);
    } catch (err) {
      console.error('[featured] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void load();

    // Subscribe to Cache changes for reactive updates
    const unsubscribeCache = queryCache.subscribe('featured-products', (data) => {
      setItems(data);
      setLoading(false);
    });

    // Realtime postgres changes subscription (Supabase)
    const channel = supabase
      .channel('featured-products-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_products' }, () => {
        queryCache.invalidate('featured-products');
        void load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryCache.invalidate('featured-products');
        void load();
      })
      .subscribe();

    return () => {
      unsubscribeCache();
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { items, loading, refresh: () => load(true) };
}
