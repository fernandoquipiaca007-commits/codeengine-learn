import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';

export function useOwnedProducts(userId: string | undefined) {
  const [ownedProductIds, setOwnedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetcher = useCallback(async () => {
    if (!userId) return new Set<string>();

    // 1. Resolve member.id from auth_id (userId)
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) return new Set<string>();

    const memberId = member.id;

    // 2. Get purchases
    const { data: purchasesData, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        product_id, 
        access_type, 
        payment_status, 
        created_at,
        products ( id )
      `)
      .eq('member_id', memberId);

    if (purchaseError) throw purchaseError;

    // 3. Get member grants
    const { data: grantsData, error: grantsError } = await supabase
      .from('member_grants')
      .select('product_id, expires_at')
      .eq('member_id', memberId);

    if (grantsError) throw grantsError;

    const owned = new Set<string>();
    const now = new Date();

    // Process purchases
    purchasesData?.forEach((p: any) => {
      if (p.access_type === 'free' || p.access_type === 'paid' || p.payment_status === 'completed') {
        owned.add(p.product_id);
      }
    });

    // Process grants
    grantsData?.forEach((g: any) => {
      if (!g.expires_at || new Date(g.expires_at) > now) {
        owned.add(g.product_id);
      }
    });

    return owned;
  }, [userId]);

  const load = useCallback(async (revalidate = true) => {
    if (!userId) {
      setOwnedProductIds(new Set());
      setLoading(false);
      return;
    }
    try {
      const data = await queryCache.get(`owned-products-${userId}`, fetcher, { revalidate });
      setOwnedProductIds(data);
    } catch (err) {
      console.error('Error loading owned products:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, fetcher]);

  useEffect(() => {
    if (!userId) return;

    void load();

    // Subscribe to Cache changes for reactive updates
    const unsubscribeCache = queryCache.subscribe(`owned-products-${userId}`, (data) => {
      setOwnedProductIds(data);
      setLoading(false);
    });

    let channel: any = null;

    // Setup realtime subscription
    supabase
      .from('members')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle()
      .then(({ data: member }) => {
        if (member) {
          const memberId = member.id;
          channel = supabase
            .channel(`purchases-${memberId}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'purchases', filter: `member_id=eq.${memberId}` },
              () => {
                queryCache.invalidate(`owned-products-${userId}`);
                void load();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'member_grants', filter: `member_id=eq.${memberId}` },
              () => {
                queryCache.invalidate(`owned-products-${userId}`);
                void load();
              }
            )
            .subscribe();
        }
      });

    return () => {
      unsubscribeCache();
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [userId, load]);

  function isOwned(productId: string): boolean {
    return ownedProductIds.has(productId);
  }

  return { isOwned, loading, ownedProductIds };
}
