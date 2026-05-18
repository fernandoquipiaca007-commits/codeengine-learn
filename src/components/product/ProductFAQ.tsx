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

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'default-1',
    question: 'Como funciona o acesso ao conteúdo?',
    answer: 'Após a confirmação do pagamento, você receberá acesso imediato ao conteúdo completo. Basta fazer login na sua conta para começar.',
    is_highlighted: true,
    is_expanded_by_default: true
  },
  {
    id: 'default-2',
    question: 'O acesso é vitalício?',
    answer: 'Sim! Você paga uma única vez e tem acesso para sempre, incluindo todas as atualizações futuras do conteúdo.',
    is_highlighted: false,
    is_expanded_by_default: false
  },
  {
    id: 'default-3',
    question: 'Posso acessar de qualquer dispositivo?',
    answer: 'Sim, você pode acessar o conteúdo de qualquer dispositivo (computador, tablet ou celular) através do seu navegador.',
    is_highlighted: false,
    is_expanded_by_default: false
  },
  {
    id: 'default-4',
    question: 'Há garantia de reembolso?',
    answer: 'Sim, oferecemos garantia de 7 dias. Se você não ficar satisfeito, devolvemos 100% do seu investimento.',
    is_highlighted: false,
    is_expanded_by_default: false
  }
];

export function ProductFAQ({ productId }: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_FAQS);
  const [expandedId, setExpandedId] = useState<string | null>('default-1');

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

      // Se houver dados do banco, usar eles
      if (!error && data && data.length > 0) {
        setFaqs(data);
        const defaultExpanded = data.find(f => f.is_expanded_by_default);
        if (defaultExpanded) {
          setExpandedId(defaultExpanded.id);
        } else {
          setExpandedId(data[0]?.id || null);
        }
      }
      // Caso contrário, manter os FAQs padrão
    } catch (error) {
      console.error('Error loading FAQs:', error);
      // Em caso de erro, manter os FAQs padrão
    }
  }

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
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6 font-sans text-base text-on-surface-variant">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
