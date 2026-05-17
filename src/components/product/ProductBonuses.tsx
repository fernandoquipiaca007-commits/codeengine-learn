import { useState, useEffect } from 'react';
import { Gift, Book, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Bonus {
  id: string;
  title: string;
  description: string;
  original_value: number;
}

interface ProductBonusesProps {
  productId: string;
}

export function ProductBonuses({ productId }: ProductBonusesProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBonuses();
  }, [productId]);

  async function loadBonuses() {
    try {
      const { data, error } = await supabase
        .from('product_bonuses')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBonuses(data || []);
    } catch (error) {
      console.error('Error loading bonuses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || bonuses.length === 0) return null;

  const icons = [Book, Users, Gift];

  return (
    <section className="mt-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <div className="relative z-10 text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel w-fit border border-secondary/30 mb-6">
          <Gift className="w-4 h-4 text-secondary" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-secondary">
            Oferta por Tempo Limitado
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          Bônus Exclusivos
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          Complementos premium incluídos gratuitamente nesta oferta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
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
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color.bg} to-transparent flex items-center justify-center border ${color.border} ${color.text} shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-on-surface mb-2">
                  {bonus.title}
                </h3>
                <p className="font-sans text-base text-on-surface-variant mb-4">
                  {bonus.description}
                </p>
                <div className={`font-display text-xs font-semibold tracking-widest uppercase ${color.text}`}>
                  Valor: R$ {Number(bonus.original_value ?? 0).toFixed(2)}{' '}
                  <span className="text-on-surface-variant line-through ml-2">Hoje: Grátis</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
