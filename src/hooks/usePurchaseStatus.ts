import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/queryCache';

export interface PurchaseStatus {
  ownsProduct: boolean;
  purchaseId: string | null;
  accessType: 'paid' | 'free' | 'gift' | null;
  purchaseDate: string | null;
  loading: boolean;
  error: string | null;
}

export function usePurchaseStatus(productId: string | undefined, authUserId: string | undefined) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [status, setStatus] = useState<PurchaseStatus>({
    ownsProduct: false,
    purchaseId: null,
    accessType: null,
    purchaseDate: null,
    loading: true,
    error: null,
  });
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!authUserId) {
      setMemberId(null);
      setStatus({
        ownsProduct: false,
        purchaseId: null,
        accessType: null,
        purchaseDate: null,
        loading: false,
        error: null,
      });
      hasLoadedOnce.current = false;
      return;
    }

    void (async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error resolving member:', error);
        setMemberId(null);
      } else {
        setMemberId(data?.id ?? null);
      }
    })();
  }, [authUserId]);

  const checkPurchaseStatus = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? hasLoadedOnce.current;

      if (!productId || !memberId) {
        setStatus({
          ownsProduct: false,
          purchaseId: null,
          accessType: null,
          purchaseDate: null,
          loading: false,
          error: null,
        });
        hasLoadedOnce.current = true;
        return;
      }

      try {
        if (!silent) {
          setStatus((prev) => ({ ...prev, loading: true, error: null }));
        }

        const fetcher = async () => {
          // 1. Check member_grants first (manual/gifted lifetime access)
          const now = new Date().toISOString();
          const { data: grant, error: grantError } = await supabase
            .from('member_grants')
            .select('id, expires_at, created_at')
            .eq('member_id', memberId)
            .eq('product_id', productId)
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .limit(1)
            .maybeSingle();

          if (grantError) {
            console.warn('Error querying member_grants, proceeding to purchases:', grantError);
          }

          if (grant) {
            return {
              ownsProduct: true,
              purchaseId: grant.id,
              accessType: 'gift' as const,
              purchaseDate: grant.created_at,
              loading: false,
              error: null,
            };
          }

          // 2. Check purchases
          const { data, error } = await supabase
            .from('purchases')
            .select('id, access_type, purchase_date, product_id')
            .eq('member_id', memberId)
            .eq('product_id', productId)
            .in('payment_status', ['completed', 'pending'])
            .order('purchase_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;

          if (data && data.product_id === productId) {
            return {
              ownsProduct: true,
              purchaseId: data.id,
              accessType: (data.access_type as 'paid' | 'free' | 'gift') || 'paid',
              purchaseDate: data.purchase_date,
              loading: false,
              error: null,
            };
          } else {
            return {
              ownsProduct: false,
              purchaseId: null,
              accessType: null,
              purchaseDate: null,
              loading: false,
              error: null,
            };
          }
        };

        const cacheKey = `purchase-status-${productId}-${memberId}`;
        const cachedRes = await queryCache.get(cacheKey, fetcher, { revalidate: true });
        setStatus(cachedRes);
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setStatus({
          ownsProduct: false,
          purchaseId: null,
          accessType: null,
          purchaseDate: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao verificar compra',
        });
      } finally {
        hasLoadedOnce.current = true;
      }
    },
    [productId, memberId]
  );

  useEffect(() => {
    hasLoadedOnce.current = false;
    void checkPurchaseStatus({ silent: false });
  }, [checkPurchaseStatus]);

  useEffect(() => {
    if (!memberId || !productId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channelPurchases = supabase
      .channel(`purchases-${memberId}-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const row = payload.new as { product_id?: string } | undefined;
          const oldRow = payload.old as { product_id?: string } | undefined;
          const pid = row?.product_id ?? oldRow?.product_id;
          if (pid && pid !== productId) return;

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const cacheKey = `purchase-status-${productId}-${memberId}`;
            queryCache.invalidate(cacheKey);
            void checkPurchaseStatus({ silent: true });
          }, 300);
        }
      )
      .subscribe();

    const channelGrants = supabase
      .channel(`grants-${memberId}-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_grants',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const row = payload.new as { product_id?: string } | undefined;
          const oldRow = payload.old as { product_id?: string } | undefined;
          const pid = row?.product_id ?? oldRow?.product_id;
          if (pid && pid !== productId) return;

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const cacheKey = `purchase-status-${productId}-${memberId}`;
            queryCache.invalidate(cacheKey);
            void checkPurchaseStatus({ silent: true });
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channelPurchases);
      void supabase.removeChannel(channelGrants);
    };
  }, [memberId, productId, checkPurchaseStatus]);

  const refetch = useCallback(() => {
    const cacheKey = `purchase-status-${productId}-${memberId}`;
    queryCache.invalidate(cacheKey);
    return checkPurchaseStatus({ silent: true });
  }, [productId, memberId, checkPurchaseStatus]);

  return { ...status, refetch };
}
