import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { safeText } from '../../lib/safe-display';

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

export function ProductBenefits({ productId, refreshKey = 0, title, subtitle }: ProductBenefitsProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loaded, setLoaded] = useState(false);

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
  if (benefits.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {title?.trim() || 'O que você vai dominar'}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {subtitle?.trim() || 'Um arsenal completo para elevar sua engenharia de software.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {benefits.map((benefit) => {
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
