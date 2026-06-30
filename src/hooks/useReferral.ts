// ============================================
// useReferral Hook
// ============================================
// Manages referral code detection, tracking, and progress

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const REFERRAL_COOKIE_KEY = 'ce_referral_code';
const REFERRAL_EXPIRY_DAYS = 30;
const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://api.srv1739567.hstgr.cloud';

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Detect ?ref= on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref) {
      // Save to localStorage with expiry
      const expiry = Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(REFERRAL_COOKIE_KEY, JSON.stringify({ code: ref, expiry }));
      setReferralCode(ref);

      // Track click (fire and forget)
      fetch(`${API_URL}/api/referral/track/${ref}`).catch(() => {});

      // Clean URL
      params.delete('ref');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else {
      // Load from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(REFERRAL_COOKIE_KEY) || 'null');
        if (stored && stored.expiry > Date.now()) {
          setReferralCode(stored.code);
        } else {
          localStorage.removeItem(REFERRAL_COOKIE_KEY);
        }
      } catch {}
    }
  }, []);

  // Get auth token helper
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  // Fetch user's referral links
  const fetchMyLinks = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/referral/links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMyLinks(data.links || []);
    } catch {}
  }, [getToken]);

  // Fetch referral stats
  const fetchStats = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/referral/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [getToken]);

  // Create a referral link
  const createLink = useCallback(async (productId?: string) => {
    const token = await getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}/api/referral/links`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMyLinks();
        return data.link;
      }
    } catch {}
    return null;
  }, [getToken, fetchMyLinks]);

  // Get or create global link
  const getGlobalLink = useCallback(async () => {
    const token = await getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}/api/referral/global-link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.link || null;
    } catch {}
    return null;
  }, [getToken]);

  // Get product referral progress
  const getProgress = useCallback(async (productId: string) => {
    const token = await getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}/api/referral/progress/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch {}
    return null;
  }, [getToken]);

  // Build share URL
  const getShareUrl = useCallback((code: string, productId?: string) => {
    const base = window.location.origin;
    if (productId) {
      return `${base}/?screen=product&id=${productId}&ref=${code}`;
    }
    return `${base}/?ref=${code}`;
  }, []);

  return {
    referralCode,
    myLinks,
    stats,
    loading,
    fetchMyLinks,
    fetchStats,
    createLink,
    getGlobalLink,
    getProgress,
    getShareUrl,
  };
}
