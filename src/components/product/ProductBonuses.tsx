import { useState, useEffect } from 'react';
import { Gift, Book, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { queryCache } from '../../lib/queryCache';
import { useLocale } from '../../contexts/LocaleContext';

const TRANSLATIONS = {
  pt: {
    value: 'Valor:',
    before: 'Antes:',
    free: 'Hoje: Grátis',
    limitedOffer: 'Oferta por Tempo Limitado',
    endsIn: 'Termina em:',
    hours: 'Horas',
    mins: 'Mins',
    segs: 'Segs',
    freeWord: 'Grátis',
    title: 'Bônus Exclusivos',
    subtitle: 'Complementos premium incluídos gratuitamente nesta oferta.'
  },
  en: {
    value: 'Value:',
    before: 'Before:',
    free: 'Today: Free',
    limitedOffer: 'Limited Time Offer',
    endsIn: 'Ends in:',
    hours: 'Hours',
    mins: 'Mins',
    segs: 'Secs',
    freeWord: 'Free',
    title: 'Exclusive Bonuses',
    subtitle: 'Premium add-ons included for free in this offer.'
  },
  fr: {
    value: 'Valeur:',
    before: 'Avant:',
    free: "Aujourd'hui: Gratuit",
    limitedOffer: 'Offre Limitée dans le Temps',
    endsIn: 'Se termine le:',
    hours: 'Heures',
    mins: 'Min',
    segs: 'Sec',
    freeWord: 'Gratuit',
    title: 'Bonus Exclusifs',
    subtitle: 'Compléments premium inclus gratuitement dans cette offre.'
  }
};

interface Bonus {
  id: string;
  title: string;
  description: string;
  original_value: number;   // kept for backward compatibility
  is_free: boolean;         // true = grátis; false = tem preço
  bonus_price: number;      // preço USD quando is_free = false
  bonus_price_aoa: number;  // preço AOA quando is_free = false
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
  productOriginalPrice?: number;
  productFinalPrice?: number;
  overrideBonuses?: any[];
  preferAoa?: boolean;
  productOriginalPriceAoa?: number;
  productFinalPriceAoa?: number;
}

export function ProductBonuses({
  productId,
  refreshKey = 0,
  title,
  subtitle,
  productOriginalPrice,
  productFinalPrice,
  overrideBonuses,
  preferAoa = false,
  productOriginalPriceAoa,
  productFinalPriceAoa,
}: ProductBonusesProps) {
  const { locale } = useLocale();
  const currentLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const tDict = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const todayPrefix = tDict.free.split(':')[0] || 'Hoje';
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (overrideBonuses) {
      setBonuses(overrideBonuses);
      setLoaded(true);
      return;
    }
    void loadBonuses();
    void loadActiveCampaign();
  }, [productId, refreshKey, overrideBonuses]);

  useEffect(() => {
    if (!campaign?.show_countdown || !campaign.end_date) return;

    const interval = setInterval(() => {
      calculateTimeLeft(campaign.end_date);
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign]);

  async function loadActiveCampaign() {
    try {
      const fetcher = async () => {
        const { data, error } = await supabase
          .from('product_campaigns')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data || null;
      };

      const cacheKey = `product-bonuses-campaign-${productId}`;
      const data = await queryCache.get(cacheKey, fetcher);

      if (data) {
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
      const fetcher = async () => {
        const { data, error } = await supabase
          .from('product_bonuses')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
      };

      const cacheKey = `product-bonuses-${productId}`;
      const cachedData = await queryCache.get(cacheKey, fetcher);
      setBonuses(cachedData);
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
            {tDict.limitedOffer}
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {title?.trim() || tDict.title}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {subtitle?.trim() || tDict.subtitle}
        </p>

        {/* Real-time Countdown Timer */}
        {timeLeft && (
          <div className="flex justify-center gap-3 sm:gap-4 mt-8 mb-4 max-w-lg mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-secondary/20 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <div className="flex items-center gap-2 text-secondary font-display text-xs font-bold uppercase tracking-wider self-center mr-2 sm:mr-4">
              <Clock className="w-5 h-5 text-secondary animate-pulse" />
              <span>{tDict.endsIn}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">{tDict.hours}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary -mt-5">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">{tDict.mins}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-secondary -mt-5">:</div>
              <div className="flex flex-col items-center">
                <div className="bg-[#1a1a1a] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10 text-xl sm:text-2xl font-bold font-mono text-secondary min-w-[50px] sm:min-w-[60px] text-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase tracking-wider">{tDict.segs}</span>
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
              className={`glass-panel p-8 rounded-2xl border ${color.border} hover:border-opacity-100 transition-all flex gap-6 items-start group bonus-card`}
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
                <div 
                  className="font-sans text-base text-on-surface-variant mb-4 rich-text-content"
                  dangerouslySetInnerHTML={{ 
                    __html: bonus.description?.includes('<') 
                      ? bonus.description 
                      : (bonus.description || '').replace(/\n/g, '<br/>') 
                  }}
                />
                <div className="font-display text-xs font-semibold tracking-widest uppercase flex flex-wrap items-center gap-2">
                  {preferAoa ? (
                    bonus.is_free !== false ? (
                      <span className="bg-green-500/10 px-2.5 py-1 rounded-full text-green-400 font-bold tracking-normal normal-case">
                        {tDict.freeWord || 'Grátis'}
                      </span>
                    ) : (
                      <span className="bg-primary/10 px-2.5 py-1 rounded-full text-primary font-bold tracking-normal normal-case">
                        {Number((bonus as any).bonus_price_aoa ?? 0).toLocaleString()} AOA
                      </span>
                    )
                  ) : (
                    bonus.is_free !== false ? (
                      <span className="bg-green-500/10 px-2.5 py-1 rounded-full text-green-400 font-bold tracking-normal normal-case">
                        {tDict.freeWord || 'Grátis'}
                      </span>
                    ) : (
                      <span className="bg-primary/10 px-2.5 py-1 rounded-full text-primary font-bold tracking-normal normal-case">
                        ${Number((bonus as any).bonus_price ?? 0).toFixed(2)}
                      </span>
                    )
                  )}
                  {/* Order Bump badge — unchanged */}
                  {Number((bonus as any).is_optional ? 1 : 0) === 1 && (
                    <span className="bg-yellow-500/10 px-2.5 py-1 rounded-full text-yellow-400 font-bold tracking-normal normal-case">
                      {preferAoa
                        ? `Opcional: +${Number((bonus as any).additional_price_aoa ?? 0).toLocaleString()} AOA`
                        : `Opcional: +$${Number((bonus as any).additional_price ?? 0).toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Premium Offer Stack Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 max-w-3xl mx-auto rounded-3xl border border-white/10 bg-[#151515]/60 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <h3 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
            {currentLang === 'pt' ? 'Resumo da Estrutura da Oferta' : 'Offer Stack Summary'}
          </h3>
          <p className="text-sm text-on-surface-variant/80 mt-1">
            {currentLang === 'pt' ? 'Tudo o que está incluído no seu acesso hoje' : 'Everything included in your access today'}
          </p>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Main Product row */}
          <div className="flex items-center justify-between text-sm sm:text-base border-b border-white/5 pb-3">
            <span className="text-white font-medium">
              {currentLang === 'pt' ? 'Curso Principal (Acesso Vitalício)' : 'Main Course (Lifetime Access)'}
            </span>
            <span className="font-semibold text-white/90">
              {preferAoa ? `${(productFinalPriceAoa || 0).toLocaleString()} AOA` : `$${(productFinalPrice || 0).toFixed(2)}`}
            </span>
          </div>

          {/* Individual bonus rows */}
          {bonuses.filter(b => !(b as any).is_optional).map((bonus, i) => (
            <div key={(bonus as any).id || i} className="flex items-center justify-between text-sm sm:text-base border-b border-white/5 pb-3">
              <span className="text-white/80">{bonus.title}</span>
              {(bonus as any).is_free !== false ? (
                <span className="text-green-400 font-bold uppercase tracking-wider text-xs bg-green-500/10 px-2.5 py-1 rounded-full">
                  {currentLang === 'pt' ? 'Grátis' : 'Free'}
                </span>
              ) : (
                <span className="font-semibold text-white/90">
                  {preferAoa
                    ? `${Number((bonus as any).bonus_price_aoa || 0).toLocaleString()} AOA`
                    : `$${Number((bonus as any).bonus_price || 0).toFixed(2)}`}
                </span>
              )}
            </div>
          ))}

          {/* Value comparison — conditional on whether any bonus has a price */}
          {(() => {
            const included = bonuses.filter(b => !(b as any).is_optional);
            const paidBonuses = included.filter(b => (b as any).is_free === false);
            const allFree = paidBonuses.length === 0;

            const totalBonusUsd = paidBonuses.reduce((acc, b) => acc + Number((b as any).bonus_price || 0), 0);
            const totalBonusAoa = paidBonuses.reduce((acc, b) => acc + Number((b as any).bonus_price_aoa || 0), 0);

            const productUsd = productFinalPrice || 0;
            const productAoa = productFinalPriceAoa || 0;

            const totalValueUsd = productUsd + totalBonusUsd;
            const totalValueAoa = productAoa + totalBonusAoa;
            const savingsUsd = totalValueUsd - productUsd;
            const savingsAoa = totalValueAoa - productAoa;

            const finalPriceDisplay = preferAoa
              ? `${productAoa.toLocaleString()} AOA`
              : `$${productUsd.toFixed(2)}`;

            if (allFree) {
              // Cenário B — todos os bônus gratuitos
              return (
                <div className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                    <div className="text-left">
                      <span className="block text-xs uppercase tracking-wider text-primary font-bold">
                        {currentLang === 'pt' ? 'Preço de Hoje' : 'Price Today'}
                      </span>
                      <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary-container animate-pulse">
                        {finalPriceDisplay}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-green-400 font-bold bg-green-500/10 py-3 rounded-xl border border-green-500/20">
                    <span>🎁</span>
                    <span>
                      {currentLang === 'pt'
                        ? 'Todos os bônus incluídos gratuitamente nesta oferta'
                        : 'All bonuses included for free in this offer'}
                    </span>
                  </div>
                </div>
              );
            }

            // Cenário A — pelo menos 1 bônus com preço
            const totalValueDisplay = preferAoa
              ? `${Math.round(totalValueAoa).toLocaleString()} AOA`
              : `$${totalValueUsd.toFixed(2)}`;
            const savingsDisplay = preferAoa
              ? `${Math.round(savingsAoa).toLocaleString()} AOA`
              : `$${savingsUsd.toFixed(2)}`;

            return (
              <div className="pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                  <div className="text-left">
                    <span className="block text-xs uppercase tracking-wider text-on-surface-variant/80">
                      {currentLang === 'pt' ? 'Valor Real da Oferta' : 'Total Package Value'}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-on-surface-variant line-through opacity-60">
                      {totalValueDisplay}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="block text-xs uppercase tracking-wider text-primary font-bold">
                      {currentLang === 'pt' ? 'Preço de Hoje' : 'Price Today'}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary-container animate-pulse">
                      {finalPriceDisplay}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-green-400 font-bold bg-green-500/10 py-3 rounded-xl border border-green-500/20">
                  <span>🚀</span>
                  <span>
                    {currentLang === 'pt'
                      ? `Você economiza ${savingsDisplay} imediatamente!`
                      : `You save ${savingsDisplay} immediately!`}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>
    </section>
  );
}
