import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { safeText } from '../../lib/safe-display';
import { useLocale } from '../../contexts/LocaleContext';

function resolveIcon(name: string | null | undefined): LucideIcon {
  const key = safeText(name, 'Zap');
  const candidate = (LucideIcons as Record<string, unknown>)[key];
  if (typeof candidate === 'function' || (typeof candidate === 'object' && candidate !== null)) {
    return candidate as LucideIcon;
  }
  return LucideIcons.Zap;
}

interface Benefit {
  id: string;
  icon: string | null;
  title: string;
  description: string;
}

interface ProductBenefitsProps {
  productId: string;
  refreshKey?: number;
  title?: string;
  subtitle?: string;
}

const DEFAULT_BENEFITS: Record<string, { title: string; subtitle: string; items: { icon: string; title: string; description: string }[] }> = {
  pt: {
    title: 'O que você vai dominar',
    subtitle: 'Um arsenal completo projetado para gerar resultados rápidos e práticos.',
    items: [
      {
        icon: 'Download',
        title: 'Acesso Imediato',
        description: 'Faça o download do conteúdo logo após a confirmação do pagamento e comece a aprender sem esperas.'
      },
      {
        icon: 'ShieldCheck',
        title: 'Garantia de Satisfação',
        description: 'Sua compra está 100% segura com nossa política de reembolso de 7 dias. Risco zero para você.'
      },
      {
        icon: 'Clock',
        title: 'Acesso Vitalício',
        description: 'Estude no seu próprio ritmo. O conteúdo é seu para sempre, incluindo todas as atualizações futuras gratuitas.'
      }
    ]
  },
  en: {
    title: 'What you will receive',
    subtitle: 'A complete package designed to deliver fast, actionable results.',
    items: [
      {
        icon: 'Download',
        title: 'Instant Access',
        description: 'Download the content immediately after payment confirmation and start learning without waiting.'
      },
      {
        icon: 'ShieldCheck',
        title: 'Satisfaction Guarantee',
        description: 'Your purchase is 100% secure with our 7-day refund policy. Zero risk for you.'
      },
      {
        icon: 'Clock',
        title: 'Lifetime Access',
        description: 'Study at your own pace. The content is yours forever, including all future updates for free.'
      }
    ]
  },
  fr: {
    title: 'Ce que vous allez recevoir',
    subtitle: 'Un pack complet conçu pour fournir des résultats rapides et concrets.',
    items: [
      {
        icon: 'Download',
        title: 'Accès Immédiat',
        description: 'Téléchargez le contenu immédiatement après la confirmation du paiement et commencez à apprendre sans attendre.'
      },
      {
        icon: 'ShieldCheck',
        title: 'Garantie de Satisfaction',
        description: 'Votre achat est 100% sécurisé avec notre politique de remboursement de 7 jours. Risque zéro pour vous.'
      },
      {
        icon: 'Clock',
        title: 'Accès à Vie',
        description: 'Étudiez à votre propre rythme. Le contenu vous appartient pour toujours, y compris toutes les mises à jour futures gratuites.'
      }
    ]
  }
};

export function ProductBenefits({ productId, refreshKey = 0, title, subtitle }: ProductBenefitsProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    void loadBenefits();
  }, [productId, refreshKey]);

  async function loadBenefits() {
    try {
      const { data, error } = await supabase
        .from('product_benefits')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setBenefits(data);
      } else {
        setBenefits([]);
      }
    } catch (err) {
      console.error('Error loading benefits:', err);
      setBenefits([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) return null;

  // Resolve language defaults
  const activeLang = (locale === 'en' || locale === 'fr') ? locale : 'pt';
  const defaults = DEFAULT_BENEFITS[activeLang];
  const listToRender = benefits.length > 0 ? benefits : defaults.items.map((item, idx) => ({
    id: `default-benefit-${idx}`,
    icon: item.icon,
    title: item.title,
    description: item.description
  }));

  const sectionTitle = title?.trim() || (benefits.length > 0 ? 'O que você vai dominar' : defaults.title);
  const sectionSubtitle = subtitle?.trim() || (benefits.length > 0 ? 'Um arsenal completo para elevar sua engenharia de software.' : defaults.subtitle);

  return (
    <section className="mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {sectionTitle}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {sectionSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {listToRender.map((benefit) => {
          const Icon = resolveIcon(benefit.icon);
          return (
            <div
              key={benefit.id}
              className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-primary/30 transition-all text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-semibold text-on-surface mb-3">{benefit.title}</h3>
              <p className="font-sans text-base text-on-surface-variant">{benefit.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
