import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, Star, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProductCoverUrl } from '../lib/storage-path';
import type { Product } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteButton } from '../components/FavoriteButton';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../components/ui/LazyImage';
import { useLocale } from '../contexts/LocaleContext';
import { fetchLocalizedProducts } from '../hooks/useLocalizedProduct';

interface ReleasesProps {
  setScreen: (screen: string) => void;
  onProductClick?: (productId: string) => void;
}

export function Releases({ setScreen, onProductClick }: ReleasesProps) {
  const { t } = useTranslation('pages');
  const { locale } = useLocale();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get favorites hook
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadRecentProducts();
  }, [locale]);

  async function loadRecentProducts() {
    try {
      const localized = await fetchLocalizedProducts(locale, 'active');
      setRecentProducts(localized.slice(0, 12) as Product[]);
    } catch (error) {
      console.error('Error loading recent products:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
    const dateLoc = activeLang === 'pt' ? 'pt-BR' : activeLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(dateLoc, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('releases.timeAgo.today');
    if (diffInDays === 1) return t('releases.timeAgo.yesterday');
    if (diffInDays < 7) return t('releases.timeAgo.daysAgo', { count: diffInDays });
    if (diffInDays < 30) return t('releases.timeAgo.weeksAgo', { count: Math.floor(diffInDays / 7) });
    return t('releases.timeAgo.monthsAgo', { count: Math.floor(diffInDays / 30) });
  };

  return (
    <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen">
      {/* Hero Section */}
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              {t('releases.badge')}
            </span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            {t('releases.heading')}
          </h1>
          
          <p className="font-sans text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            {t('releases.subtitle')}
          </p>
        </motion.div>
      </header>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-16"
      >
        <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                {t('releases.stats.last30Days')}
              </p>
              <p className="font-sans text-xs text-on-surface-variant">
                {t('releases.stats.newContent', { count: recentProducts.length })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-primary" />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                {t('releases.stats.premiumQuality')}
              </p>
              <p className="font-sans text-xs text-on-surface-variant">
                {t('releases.stats.curatedByExperts')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                {t('releases.stats.alwaysUpdated')}
              </p>
              <p className="font-sans text-xs text-on-surface-variant">
                {t('releases.stats.weeklyContent')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="w-full h-48 bg-white/5 rounded-xl mb-4"></div>
              <div className="h-6 bg-white/5 rounded mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {recentProducts.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer relative group"
            >
              <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
              
              {/* Favorite Button */}
              {user && (
                <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton
                    isFavorite={isFavorite(product.id)}
                    onToggle={() => toggleFavorite(product.id)}
                    size="md"
                  />
                </div>
              )}
              
              {/* New Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 backdrop-blur-xl">
                  <span className="font-display text-xs font-semibold text-on-primary uppercase tracking-wider">
                    {t('releases.badges.new')}
                  </span>
                </div>
              </div>
              
              {/* Cover Image */}
              <div className="relative w-full h-64 overflow-hidden">
                <LazyImage
                  src={getProductCoverUrl(product)}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  fallback={`https://placehold.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Date */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-sans text-xs text-on-surface-variant">
                    {getTimeAgo(product.created_at)}
                  </span>
                </div>
                
                {/* Title */}
                <h3 className="font-display text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                
                {/* Description */}
                <p className="font-sans text-sm text-on-surface-variant mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl font-bold text-primary">
                    {product.is_free || product.price === 0 ? (
                      <span className="text-green-400">{t('releases.badges.free')}</span>
                    ) : (
                      <>$ {product.price}</>
                    )}
                  </div>
                  
                  <button className="flex items-center gap-2 font-display text-xs font-semibold tracking-widest uppercase text-primary group-hover:gap-3 transition-all">
                    {t('releases.actions.viewMore')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && recentProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-white mb-3">
            {t('releases.empty.title')}
          </h3>
          <p className="font-sans text-on-surface-variant mb-8">
            {t('releases.empty.description')}
          </p>
          <button
            onClick={() => setScreen('library')}
            className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
          >
            {t('releases.actions.exploreLibrary')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
