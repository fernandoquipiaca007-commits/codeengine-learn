import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Campaign {
  id: string;
  banner_text: string;
  banner_style: Record<string, string> | null;
  end_date: string;
  show_countdown: boolean;
  special_price: number | null;
}

interface CampaignBannerProps {
  productId: string;
  onSpecialPrice?: (price: number | null) => void;
}

function normalizeCampaign(row: Record<string, unknown>): Campaign | null {
  const bannerText =
    (row.banner_text as string) ||
    (row.badge_text as string) ||
    (row.title as string) ||
    (row.name as string) ||
    '';
  const endDate =
    (row.end_date as string) ||
    (row.valid_until as string) ||
    (row.countdown_end_date as string) ||
    '';
  const startDate = (row.start_date as string) || (row.valid_from as string) || null;
  const now = new Date();

  if (startDate && new Date(startDate) > now) return null;
  if (endDate && new Date(endDate) < now) return null;

  return {
    id: row.id as string,
    banner_text: bannerText,
    banner_style: (row.banner_style as Record<string, string>) || null,
    end_date: endDate,
    show_countdown: Boolean(row.show_countdown ?? row.countdown_enabled),
    special_price: row.special_price != null ? Number(row.special_price) : null,
  };
}

export function CampaignBanner({ productId, onSpecialPrice }: CampaignBannerProps) {
  const onSpecialPriceRef = useRef(onSpecialPrice);
  onSpecialPriceRef.current = onSpecialPrice;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const loadActiveCampaign = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_campaigns')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const active = (data ?? [])
        .map((row) => normalizeCampaign(row as Record<string, unknown>))
        .find((c): c is Campaign => c !== null && Boolean(c.banner_text));

      setCampaign(active ?? null);
      onSpecialPriceRef.current?.(active?.special_price ?? null);

      if (active?.show_countdown && active.end_date) {
        calculateTimeLeft(active.end_date);
      } else {
        setTimeLeft(null);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setCampaign(null);
      onSpecialPriceRef.current?.(null);
    }
  }, [productId]);

  useEffect(() => {
    void loadActiveCampaign();
  }, [loadActiveCampaign, productId]);

  useEffect(() => {
    if (!campaign?.show_countdown || !campaign.end_date) return;

    const interval = setInterval(() => {
      calculateTimeLeft(campaign.end_date);
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign]);

  function calculateTimeLeft(endDateStr: string) {
    const endDate = new Date(endDateStr);
    const now = new Date();
    const difference = endDate.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeLeft(null);
      void loadActiveCampaign();
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  }

  if (!campaign?.banner_text) return null;

  const bannerStyle = campaign.banner_style || {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 py-3 px-6 shadow-lg"
      style={{ background: bannerStyle.background }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <p
          className="font-display text-sm md:text-base font-bold tracking-wide"
          style={{ color: bannerStyle.textColor }}
        >
          {campaign.banner_text}
        </p>

        {campaign.show_countdown && timeLeft && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: bannerStyle.textColor }} />
            <div
              className="flex items-center gap-2 font-mono text-sm md:text-base font-bold"
              style={{ color: bannerStyle.textColor }}
            >
              {timeLeft.days > 0 && (
                <>
                  <span className="bg-white/20 px-2 py-1 rounded">
                    {String(timeLeft.days).padStart(2, '0')}d
                  </span>
                  <span>:</span>
                </>
              )}
              <span className="bg-white/20 px-2 py-1 rounded">
                {String(timeLeft.hours).padStart(2, '0')}h
              </span>
              <span>:</span>
              <span className="bg-white/20 px-2 py-1 rounded">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </span>
              <span>:</span>
              <span className="bg-white/20 px-2 py-1 rounded">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
