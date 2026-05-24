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
      // 1. Get purchases with product duration
      const { data: purchasesData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          product_id, 
          access_type, 
          payment_status, 
          created_at,
          products ( id )
        `)
        .eq('member_id', userId);

      if (purchaseError) throw purchaseError;

      // 2. Get member grants
      const { data: grantsData, error: grantsError } = await supabase
        .from('member_grants')
        .select('product_id, expires_at')
        .eq('member_id', userId);

      if (grantsError) throw grantsError;

      const owned = new Set<string>();
      const now = new Date();

      // Process purchases
      purchasesData?.forEach((p: any) => {
        if (p.access_type === 'free' || p.access_type === 'paid' || p.payment_status === 'completed') {
          // Fallback to lifetime access if column doesn't exist
          owned.add(p.product_id);
        }
      });

      // Process grants
      grantsData?.forEach((g: any) => {
        if (!g.expires_at || new Date(g.expires_at) > now) {
          owned.add(g.product_id);
        }
      });

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
