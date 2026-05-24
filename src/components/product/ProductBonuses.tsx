import { useState, useEffect } from 'react';
import { Gift, Book, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

const TRANSLATIONS = {
  pt: {
    value: 'Valor:',
    before: 'Antes:',
    free: 'Hoje: Grátis'
  },
  en: {
    value: 'Value:',
    before: 'Before:',
    free: 'Today: Free'
  },
  fr: {
    value: 'Valeur:',
    before: 'Avant:',
    free: "Aujourd'hui: Gratuit"
  }
};

interface Bonus {
  id: string;
  title: string;
  description: string;
  original_value: number;
}

interface Campaign {
  id: string;
  end_date: string;
  show_countdown: boolean;
}

interface ProductBonusesProps {
  productId: string;
  refreshKey?: number;
  title?: string;
  subtitle?: string;
}

export function ProductBonuses({
  productId,
  refreshKey = 0,
  title,
  subtitle,
}: ProductBonusesProps) {
  const { i18n } = useTranslation();
  const currentLang = ((i18n.language || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const tDict = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    void loadBonuses();
    void loadActiveCampaign();
  }, [productId, refreshKey]);

  useEffect(() => {
    if (!campaign?.show_countdown || !campaign.end_date) return;

    const interval = setInterval(() => {
      calculateTimeLeft(campaign.end_date);
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign]);

  async function loadActiveCampaign() {
    try {
      const { data, error } = await supabase
        .from('product_campaigns')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const endDate = (data.end_date as string) || (data.valid_until as string) || (data.countdown_end_date as string) || '';
        const showCountdown = Boolean(data.show_countdown ?? data.countdown_enabled);
        if (endDate && showCountdown) {
          setCampaign({
            id: data.id,
            end_date: endDate,
            show_countdown: showCountdown,
          });
          calculateTimeLeft(endDate);
        } else {
          setCampaign(null);
          setTimeLeft(null);
        }
      } else {
        setCampaign(null);
        setTimeLeft(null);
      }
    } catch (e) {
      console.error('Error loading campaign for bonuses:', e);
      setCampaign(null);
      setTimeLeft(null);
    }
  }

  function calculateTimeLeft(endDateStr: string) {
    const endDate = new Date(endDateStr);
    const now = new Date();
    const difference = endDate.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeLeft(null);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) + days * 24;
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeLeft({ hours, minutes, seconds });
  }

  async function loadBonuses() {
    try {
      const { data, error } = await supabase
        .from('product_bonuses')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setBonuses(data);
      } else {
        setBonuses([]);
      }
    } catch (error) {
      console.error('Error loading bonuses:', error);
      setBonuses([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) return null;
  if (bonuses.length === 0) return null;

  const icons = [Book, Users, Gift];

  return (
    <section className="mt-32 relative">
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <motion.div className="relative z-10 text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel w-fit border border-secondary/30 mb-6">
          <Gift className="w-4 h-4 text-secondary" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-secondary">
            Oferta por Tempo Limitado
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {title?.trim() || 'Bônus Exclusivos'}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {subtitle?.trim() || 'Complementos premium incluídos gratuitamente nesta oferta.'}
        </p>

        {/* Real-time Countdown Timer */}
        {timeLeft && (
          <div className="flex justify-center gap-3 sm:gap-4 mt-8 mb-4 max-w-lg mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-secondary/20 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <div className="flex items-center gap-2 text-secondary font-display text-xs font-bold uppercase tracking-wider self-center mr-2 sm:mr-4">
              <Clock className="w-5 h-5 text-secondary animate-pulse" />
              <span>Termina em:</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Horas</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary -mt-5">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Mins</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary -mt-5">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">Segs</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {bonuses.map((bonus, index) => {
          const Icon = icons[index % icons.length];
          const colors = [
            { bg: 'from-secondary/20', border: 'border-secondary/30', text: 'text-secondary' },
            { bg: 'from-tertiary-container/20', border: 'border-tertiary-container/30', text: 'text-tertiary-container' },
            { bg: 'from-primary/20', border: 'border-primary/30', text: 'text-primary' },
          ];
          const color = colors[index % colors.length];

          return (
            <div
              key={bonus.id}
              className={`glass-panel p-8 rounded-2xl border ${color.border} hover:border-opacity-100 transition-all flex gap-6 items-start group`}
            >
              <motion.div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color.bg} to-transparent flex items-center justify-center border ${color.border} ${color.text} shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-8 h-8" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-2xl font-semibold text-on-surface mb-2">
                  {bonus.title}
                </h3>
                <p className="font-sans text-base text-on-surface-variant mb-4">
                  {bonus.description}
                </p>
                <div className="font-display text-xs font-semibold tracking-widest uppercase flex flex-wrap items-center gap-2">
                  <span className="text-on-surface-variant/70">{tDict.value}</span>
                  <span className="text-on-surface-variant/50 mr-1">
                    {tDict.before} <span className="line-through">${Number(bonus.original_value ?? 0).toFixed(2)}</span>
                  </span>
                  <span className="bg-green-500/10 px-2.5 py-1 rounded-full text-green-400 font-bold tracking-normal normal-case">
                    {tDict.free}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
