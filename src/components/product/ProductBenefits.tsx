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
  title?: string;
  subtitle?: string;
}

export function ProductBenefits({ productId, title, subtitle }: ProductBenefitsProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([
    // Inicializar com benefícios padrão
    {
      id: 'default-1',
      icon: 'Zap',
      title: 'Acesso Imediato',
      description: 'Comece a aprender assim que finalizar sua compra. Sem espera, sem complicação.'
    },
    {
      id: 'default-2',
      icon: 'Shield',
      title: 'Garantia de Qualidade',
      description: 'Conteúdo premium desenvolvido por especialistas da área.'
    },
    {
      id: 'default-3',
      icon: 'Infinity',
      title: 'Acesso Vitalício',
      description: 'Pague uma vez e tenha acesso para sempre, incluindo atualizações futuras.'
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadBenefits();
  }, [productId]);

  async function loadBenefits() {
    try {
      const { data, error } = await supabase
        .from('product_benefits')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      // Se houver dados do banco, usar eles
      if (!error && data && data.length > 0) {
        setBenefits(data);
      }
      // Caso contrário, manter os benefícios padrão que já estão no state
    } catch (err) {
      console.error('Error loading benefits:', err);
      // Em caso de erro, manter os benefícios padrão
    } finally {
      setLoading(false);
    }
  }

  // Sempre renderizar, nunca retornar null
  return (
    <section className="mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {safeText(title, 'O que você vai dominar')}
        </h2>
        {safeText(subtitle) && (
          <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
            {safeText(subtitle)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => {
          const Icon = resolveIcon(benefit.icon);
          const iconColor =
            index % 3 === 0 ? 'text-primary' : index % 3 === 1 ? 'text-secondary' : 'text-tertiary-container';

          return (
            <div
              key={benefit.id}
              className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl flex flex-col gap-6 hover:bg-surface-high/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16 opacity-50 group-hover:opacity-100" />
              <div
                className={`w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-white/10 ${iconColor}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl md:text-2xl font-semibold text-on-surface mb-2">
                  {benefit.title}
                </h3>
                <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                  {safeText(benefit.description)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
