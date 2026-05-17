import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOwnedProducts(userId: string | undefined) {
  const [ownedProductIds, setOwnedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOwnedProductIds(new Set());
      setLoading(false);
      return;
    }

    loadOwnedProducts();

    // Setup realtime subscription for purchases
    const channel = supabase
      .channel(`purchases-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `member_id=eq.${userId}`,
        },
        () => {
          loadOwnedProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadOwnedProducts() {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('product_id, access_type, payment_status')
        .eq('member_id', userId);

      if (error) throw error;

      // Only include products with access (free or paid) or completed payment
      const owned = new Set(
        data
          ?.filter(
            (p) =>
              p.access_type === 'free' ||
              p.access_type === 'paid' ||
              p.payment_status === 'completed'
          )
          .map((p) => p.product_id) || []
      );

      setOwnedProductIds(owned);
    } catch (error) {
      console.error('Error loading owned products:', error);
    } finally {
      setLoading(false);
    }
  }

  function isOwned(productId: string): boolean {
    return ownedProductIds.has(productId);
  }

  return { isOwned, loading, ownedProductIds };
}
