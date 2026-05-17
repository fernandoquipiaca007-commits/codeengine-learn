import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_highlighted: boolean;
  is_expanded_by_default: boolean;
}

interface ProductFAQProps {
  productId: string;
}

export function ProductFAQ({ productId }: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, [productId]);

  async function loadFAQs() {
    try {
      const { data, error } = await supabase
        .from('product_faqs')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
      
      // Expandir o primeiro por padrão se configurado
      const defaultExpanded = data?.find(f => f.is_expanded_by_default);
      if (defaultExpanded) {
        setExpandedId(defaultExpanded.id);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || faqs.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          Perguntas Frequentes
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          Tire suas dúvidas sobre o produto
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className={`glass-panel rounded-2xl border ${
              faq.is_highlighted ? 'border-primary/30' : 'border-white/10'
            }`}
          >
            <button
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors rounded-2xl"
            >
              <h3 className="font-display text-xl font-semibold text-on-surface pr-8">
                {faq.question}
              </h3>
              <ChevronDown
                className={`w-6 h-6 text-primary transition-transform flex-shrink-0 ${
                  expandedId === faq.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {expandedId === faq.id && (
                <div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6 font-sans text-base text-on-surface-variant">
                    {faq.answer}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
