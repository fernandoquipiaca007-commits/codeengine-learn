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

    let active = true;
    let channel: any = null;

    async function loadOwnedProducts() {
      if (!userId) return;

      try {
        // 1. Resolve member.id from auth_id (userId)
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('auth_id', userId)
          .maybeSingle();

        if (memberError) throw memberError;
        if (!member) {
          if (active) {
            setOwnedProductIds(new Set());
            setLoading(false);
          }
          return;
        }

        const memberId = member.id;

        // 2. Get purchases with product duration
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

        if (active) {
          setOwnedProductIds(owned);
        }

        // Setup realtime subscription if not already done
        if (active && !channel) {
          channel = supabase
            .channel(`purchases-${memberId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'purchases',
                filter: `member_id=eq.${memberId}`,
              },
              () => {
                void loadOwnedProducts();
              }
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'member_grants',
                filter: `member_id=eq.${memberId}`,
              },
              () => {
                void loadOwnedProducts();
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error loading owned products:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOwnedProducts();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  function isOwned(productId: string): boolean {
    return ownedProductIds.has(productId);
  }

  return { isOwned, loading, ownedProductIds };
}
