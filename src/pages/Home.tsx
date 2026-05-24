import { ArrowRight, Book, Settings, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';
import { getProductCoverUrl } from '../lib/storage-path';
import { useTranslation } from 'react-i18next';

const CARD_ICONS = [Book, Settings, Cpu];
const CARD_ACCENTS = ['text-primary', 'text-secondary', 'text-tertiary'];
const CARD_GRADIENTS = [
  'from-primary/20',
  'from-secondary/20',
  'from-tertiary/20',
];

interface HomeProps {
  setScreen: (s: string) => void;
  onProductClick?: (productId: string) => void;
}

export function Home({ setScreen, onProductClick }: HomeProps) {
  const { items, loading } = useFeaturedProducts();
  const { t } = useTranslation('common');

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden page-wrapper">
      <header className="relative flex flex-col items-center justify-center text-center overflow-hidden mb-24 sm:mb-28">
        <div className="max-w-3xl z-10 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="animate__animated animate__fadeInDown font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary pb-2"
          >
            CodeEngine Learn
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="animate__animated animate__fadeInUp font-sans text-sm sm:text-base md:text-lg text-on-surface-variant max-w-xl mx-auto"
          >
            {t('home.heroSubtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="pt-6"
          >
            <button
              onClick={() => setScreen('library')}
              className="animate__animated animate__pulse bg-on-surface text-background font-display text-base sm:text-lg md:text-xl font-semibold px-5 sm:px-7 md:px-10 py-3 sm:py-4 rounded-full transition-transform hover:scale-[0.98] duration-200 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {t('home.exploreVault')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
        <div className="absolute inset-0 z-0 hidden sm:flex items-center justify-center opacity-30 pointer-events-none hero-abstract">
          <div className="w-[800px] h-[800px] bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-[100px] mix-blend-screen"></div>
        </div>
      </header>

      <section className="relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="animate__animated animate__slideInDown font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface mb-4"
          >
            {t('home.featuredTitle')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="animate__animated animate__fadeInUp font-sans text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto"
          >
            {t('home.featuredSubtitle')}
          </motion.p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card rounded-xl p-1 h-80 animate-pulse bg-surface-container/30" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 perspective-container">
            {items.map((item, index) => {
              const Icon = CARD_ICONS[index % CARD_ICONS.length];
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              const offsetClass = index > 0 ? 'lg:-translate-y-4' : '';

              return (
                <div
                  key={item.id}
                  onClick={() => onProductClick?.(item.product_id)}
                  className={`glass-card rounded-xl p-1 mockup-rotate group cursor-pointer ${offsetClass}`}
                >
                  <div className="bg-surface-container-low rounded-lg p-4 sm:p-6 h-full border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${accent}`} />
                    </div>
                    <div className="h-40 sm:h-48 rounded-md mb-4 sm:mb-6 overflow-hidden bg-surface-container relative">
                      <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} to-transparent mix-blend-overlay z-10`} />
                      <img
                        src={getProductCoverUrl(item)}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(item.title?.charAt(0) || 'P')}`;
                        }}
                      />
                    </div>
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl font-semibold text-on-surface mb-2">
                      {item.title}
                    </h3>
                    <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-4 sm:mb-6">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-xs font-semibold tracking-widest uppercase ${accent}`}>
                        {item.tag}
                      </span>
                      <span className={`${accent} group-hover:text-tertiary transition-colors`}>
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center font-sans text-on-surface-variant text-sm">
            {t('home.noFeatured')}
          </p>
        )}
      </section>
    </div>
  );
}
