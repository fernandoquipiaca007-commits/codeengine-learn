// ============================================
// usePoints Hook
// ============================================
// Manages points balance, level, history, and rewards

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://codeengine-api-production.up.railway.app';

export interface PointsBalance {
  total_points: number;
  available_points: number;
  used_points: number;
  level: string;
  total_referrals: number;
  total_purchases: number;
  total_content_completed: number;
  levelInfo: {
    level: string;
    multiplier: number;
    nextLevel: string | null;
    nextThreshold: number | null;
    currentThreshold: number;
    progressToNext: number;
    isMaxLevel: boolean;
  };
}

export interface Reward {
  id: string;
  level: string;
  reward_type: string;
  reward_value: any;
  description: string;
  status: 'available' | 'claimed' | 'locked';
  is_used: boolean;
  reward_data?: Record<string, any> | null;
}

export function usePoints() {
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const fetchBalance = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/points/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBalance(null);
        return;
      }
      const data = await res.json();
      if (data && data.success === true && typeof data.available_points === 'number' && typeof data.total_points === 'number') {
        setBalance(data);
      } else {
        setBalance(null);
      }
    } catch {
      setBalance(null);
    }
  }, [getToken]);

  const fetchHistory = useCallback(async (limit = 50) => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/points/history?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
        setTransactions(data.history || []);
      }
    } catch {}
  }, [getToken]);

  const fetchRewards = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/points/rewards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRewards(data.rewards || []);
    } catch {}
  }, [getToken]);

  const spendPoints = useCallback(async (amount: number, description?: string) => {
    const token = await getToken();
    if (!token) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/points/use`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });
      const data = await res.json();
      if (data.success) await fetchBalance();
      return data;
    } catch {
      return { success: false };
    }
  }, [getToken, fetchBalance]);

  const claimReward = useCallback(async (rewardId: string) => {
    const token = await getToken();
    if (!token) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/points/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchRewards();
        await fetchBalance();
      }
      return data;
    } catch {
      return { success: false };
    }
  }, [getToken, fetchRewards, fetchBalance]);

  // Real-time subscription — only run once after auth is confirmed
  const setupDone = useRef(false);
  useEffect(() => {
    if (setupDone.current) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      // Wait for auth session to be available
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!member?.id || cancelled) return;

      setupDone.current = true;

      // Fetch initial data
      setLoading(true);
      await Promise.all([fetchBalance(), fetchRewards()]).catch(() => {});
      setLoading(false);

      // Subscribe to real-time changes (best effort)
      try {
        channel = supabase
          .channel(`points-${member.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'member_points',
            filter: `member_id=eq.${member.id}`,
          }, () => void fetchBalance())
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'points_transactions',
            filter: `member_id=eq.${member.id}`,
          }, () => {
            void fetchBalance();
            void fetchHistory();
          })
          .subscribe();
      } catch {}
    };

    setup();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    balance,
    history,
    transactions,
    rewards,
    loading,
    fetchBalance,
    fetchHistory,
    fetchRewards,
    spendPoints,
    claimReward,
  };
}

// ---- Level Display Helpers ----
export const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  starter: { bg: 'bg-zinc-700/30', text: 'text-zinc-400', border: 'border-zinc-600', glow: '' },
  bronze: { bg: 'bg-amber-900/30', text: 'text-amber-500', border: 'border-amber-700', glow: 'shadow-amber-500/20' },
  silver: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-500', glow: 'shadow-slate-300/20' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-600', glow: 'shadow-yellow-400/30' },
  platinum: { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-500', glow: 'shadow-cyan-300/40' },
};

// Level icons are now rendered as Lucide React components in the UI
// This object is kept for backwards compatibility but values are not used
export const LEVEL_ICONS: Record<string, string> = {
  starter: 'Star',
  bronze: 'Award',
  silver: 'Medal',
  gold: 'Crown',
  platinum: 'Gem',
};

export const LEVEL_NAMES: Record<string, string> = {
  starter: 'Starter',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export const LEVEL_ORDER = ['starter', 'bronze', 'silver', 'gold', 'platinum'] as const;

// Helper to get the Lucide icon component for a level
export function getLevelIconComponent(level: string) {
  const icons = {
    starter: 'Star',
    bronze: 'Award',
    silver: 'Medal',
    gold: 'Crown',
    platinum: 'Gem',
  };
  return icons[level as keyof typeof icons] || 'Star';
}
