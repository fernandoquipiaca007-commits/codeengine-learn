import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { usePurchaseStatus, type PurchaseStatus } from '../hooks/usePurchaseStatus';

type PurchaseContextValue = PurchaseStatus & {
  refetch: () => Promise<void>;
  authUserId: string | undefined;
};

const ProductPurchaseContext = createContext<PurchaseContextValue | null>(null);

export function ProductPurchaseProvider({
  productId,
  children,
}: {
  productId: string;
  children: ReactNode;
}) {
  const [authUserId, setAuthUserId] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setAuthUserId(data.user?.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const purchase = usePurchaseStatus(productId, authUserId);

  return (
    <ProductPurchaseContext.Provider value={{ ...purchase, authUserId }}>
      {children}
    </ProductPurchaseContext.Provider>
  );
}

export function useProductPurchase() {
  const ctx = useContext(ProductPurchaseContext);
  if (!ctx) {
    throw new Error('useProductPurchase must be used within ProductPurchaseProvider');
  }
  return ctx;
}

/** Optional hook for components that may render outside provider */
export function useProductPurchaseOptional() {
  return useContext(ProductPurchaseContext);
}
