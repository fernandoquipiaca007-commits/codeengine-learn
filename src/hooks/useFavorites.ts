import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setMemberId(null);
      setLoading(false);
      return;
    }

    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!member) {
        setFavorites([]);
        setMemberId(null);
        return;
      }

      setMemberId(member.id);

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('member_id', member.id);

      if (error) throw error;
      setFavorites(data?.map((f) => f.product_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel(`favorites-live-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `member_id=eq.${memberId}` },
        () => void loadFavorites()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [memberId, loadFavorites]);

  async function toggleFavorite(productId: string) {
    if (!userId || !memberId) {
      console.warn('User not logged in');
      return;
    }

    try {
      const isFavorite = favorites.includes(productId);

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('member_id', memberId)
          .eq('product_id', productId);

        if (error) throw error;
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        const { error } = await supabase.from('favorites').insert({
          member_id: memberId,
          product_id: productId,
        });

        if (error) throw error;
        setFavorites((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  return {
    favorites,
    loading,
    isFavorite: (productId: string) => favorites.includes(productId),
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };
}
