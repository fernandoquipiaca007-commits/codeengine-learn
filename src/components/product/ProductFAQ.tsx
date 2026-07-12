import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { queryCache } from '../../lib/queryCache';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../contexts/LocaleContext';

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
  overrideFAQs?: any[];
}

const DEFAULT_FAQS: Record<string, { title: string; subtitle: string; items: { question: string; answer: string; is_highlighted: boolean; is_expanded_by_default: boolean }[] }> = {
  pt: {
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas dúvidas sobre o produto',
    items: [
      {
        question: 'Como irei receber o produto?',
        answer: 'Imediatamente após a confirmação do pagamento, você receberá um e-mail com os dados de acesso à sua área de membros exclusiva, onde poderá baixar todos os arquivos ou assistir às aulas.',
        is_highlighted: false,
        is_expanded_by_default: true
      },
      {
        question: 'Quais são as formas de pagamento disponíveis?',
        answer: 'Oferecemos pagamentos 100% seguros via Stripe (cartões de crédito e débito) e FastPay, com liberação imediata.',
        is_highlighted: true,
        is_expanded_by_default: false
      },
      {
        question: 'O produto tem alguma garantia?',
        answer: 'Sim! Damos 7 dias de garantia incondicional. Se por qualquer motivo você achar que o produto não é para você, basta solicitar o reembolso total dentro desse prazo.',
        is_highlighted: false,
        is_expanded_by_default: false
      },
      {
        question: 'Terei direito a atualizações futuras?',
        answer: 'Sim! Todos os compradores recebem acesso vitalício ao produto, incluindo todas as atualizações, melhorias e novos materiais adicionados futuramente, sem qualquer custo adicional.',
        is_highlighted: false,
        is_expanded_by_default: false
      }
    ]
  },
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Clear your doubts about the product',
    items: [
      {
        question: 'How will I receive the product?',
        answer: 'Immediately after payment confirmation, you will receive an email with your login details for your exclusive members area, where you can download all files or watch the classes.',
        is_highlighted: false,
        is_expanded_by_default: true
      },
      {
        question: 'What payment methods are available?',
        answer: 'We offer 100% secure payments via Stripe (credit and debit cards) and FastPay, with immediate product delivery.',
        is_highlighted: true,
        is_expanded_by_default: false
      },
      {
        question: 'Is there any guarantee?',
        answer: 'Yes! We offer a 7-day unconditional guarantee. If for any reason you feel the product is not right for you, simply request a full refund within this period.',
        is_highlighted: false,
        is_expanded_by_default: false
      },
      {
        question: 'Will I have access to future updates?',
        answer: 'Yes! All buyers receive lifetime access to the product, including all future updates, improvements, and new materials added in the future, at no extra cost.',
        is_highlighted: false,
        is_expanded_by_default: false
      }
    ]
  },
  fr: {
    title: 'Questions Fréquentes',
    subtitle: 'Clarifiez vos doutes sur le produit',
    items: [
      {
        question: 'Comment vais-je recevoir le produit ?',
        answer: "Immédiatement après la confirmation du paiement, vous recevrez un e-mail avec vos identifiants d'accès à votre espace membre exclusif, où vous pourrez télécharger tous les fichiers ou suivre les cours.",
        is_highlighted: false,
        is_expanded_by_default: true
      },
      {
        question: 'Quels sont les moyens de paiement disponibles ?',
        answer: 'Nous proposons des paiements 100 % sécurisés via Stripe (cartes de crédit et de débit) et FastPay, avec livraison immédiate du produit.',
        is_highlighted: true,
        is_expanded_by_default: false
      },
      {
        question: 'Y a-t-il une garantie ?',
        answer: "Oui ! Nous offrons une garantie inconditionnelle de 7 jours. Si, pour une raison quelconque, vous estimez que le produit ne vous convient pas, demandez simplement un remboursement complet dans ce délai.",
        is_highlighted: false,
        is_expanded_by_default: false
      },
      {
        question: 'Aurai-je droit aux futures mises à jour ?',
        answer: "Oui ! Tous les acheteurs bénéficient d'un accès à vie au produit, y compris toutes les mises à jour futures, améliorations et nouveaux contenus ajoutés, sans frais supplémentaires.",
        is_highlighted: false,
        is_expanded_by_default: false
      }
    ]
  }
};

const TRANSLATIONS = {
  pt: {
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas dúvidas sobre o produto',
  },
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Get answers to your questions about the product',
  },
  fr: {
    title: 'Questions Fréquentes',
    subtitle: 'Obtenez des réponses à vos questions sur le produit',
  }
};

export function ProductFAQ({ productId, refreshKey = 0, title, overrideFAQs }: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    if (overrideFAQs) {
      setFaqs(overrideFAQs);
      const defaultExpanded = overrideFAQs.find((f: FAQ) => f.is_expanded_by_default);
      setExpandedId(defaultExpanded?.id ?? overrideFAQs[0]?.id ?? null);
      setLoaded(true);
      return;
    }
    void loadFAQs();
  }, [productId, refreshKey, overrideFAQs]);

  async function loadFAQs() {
    try {
      const fetcher = async () => {
        const { data, error } = await supabase
          .from('product_faqs')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
      };

      const cacheKey = `product-faqs-${productId}`;
      const cachedData = await queryCache.get(cacheKey, fetcher);

      setFaqs(cachedData);
      const defaultExpanded = cachedData.find((f: FAQ) => f.is_expanded_by_default);
      setExpandedId(defaultExpanded?.id ?? cachedData[0]?.id ?? null);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setFaqs([]);
      setExpandedId('default-faq-0');
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) return null;

  const activeLang = (locale === 'en' || locale === 'fr') ? locale : 'pt';
  const defaults = DEFAULT_FAQS[activeLang];
  const tDict = TRANSLATIONS[activeLang];
  const listToRender = faqs.length > 0 ? faqs : defaults.items.map((item, idx) => ({
    id: `default-faq-${idx}`,
    question: item.question,
    answer: item.answer,
    is_highlighted: item.is_highlighted,
    is_expanded_by_default: item.is_expanded_by_default
  }));

  const sectionTitle = title?.trim() || (faqs.length > 0 ? tDict.title : defaults.title);
  const sectionSubtitle = faqs.length > 0 ? tDict.subtitle : defaults.subtitle;

  return (
    <section className="mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {sectionTitle}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {sectionSubtitle}
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-4">
        {listToRender.map((faq) => (
          <div
            key={faq.id}
            className={`glass-panel rounded-2xl border ${
              faq.is_highlighted ? 'border-primary/30' : 'border-white/10'
            } faq-item`}
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
