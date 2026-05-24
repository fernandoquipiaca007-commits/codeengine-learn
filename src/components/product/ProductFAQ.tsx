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
  refreshKey?: number;
  title?: string;
}

export function ProductFAQ({ productId, refreshKey = 0, title }: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadFAQs();
  }, [productId, refreshKey]);

  async function loadFAQs() {
    try {
      const { data, error } = await supabase
        .from('product_faqs')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setFaqs(data);
        const defaultExpanded = data.find((f) => f.is_expanded_by_default);
        setExpandedId(defaultExpanded?.id ?? data[0]?.id ?? null);
      } else {
        setFaqs([]);
        setExpandedId(null);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setFaqs([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) return null;
  if (faqs.length === 0) return null;

  return (
    <section className="mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {title?.trim() || 'Perguntas Frequentes'}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          Tire suas dúvidas sobre o produto
        </p>
      </motion.div>

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
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <motion.div className="px-8 pb-6 font-sans text-base text-on-surface-variant">
                    {faq.answer}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
