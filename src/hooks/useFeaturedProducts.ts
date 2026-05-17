import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getProductCoverUrl } from '../lib/storage-path';

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

  const load = useCallback(async () => {
    try {
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

      const mapped: FeaturedProductCard[] = (data ?? [])
        .filter((row) => row.products && (row.products as { status?: string }).status === 'active')
        .map((row) => {
          const product = row.products as {
            title: string;
            description: string;
            cover_url: string;
            cover_storage_path?: string | null;
            tags?: string[];
          };
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

      setItems(mapped);
    } catch (err) {
      console.error('[featured] load error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('featured-products-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_products' }, () => {
        void load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { items, loading, refresh: load };
}
