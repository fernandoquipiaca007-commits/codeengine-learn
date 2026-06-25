import { useState, useEffect } from 'react';
import { ArrowRight, Book, Settings, Cpu, Newspaper, Calendar, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';
import { getProductCoverUrl } from '../lib/storage-path';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../components/ui/LazyImage';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { queryCache } from '../lib/queryCache';
import { prefetchProduct } from '../lib/prefetch';

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
  const { locale } = useLocale();

  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);

  useEffect(() => {
    // Carregar últimas 3 notícias
    async function loadLatestNews() {
      try {
        const fetcher = async () => {
          let query = supabase
            .from('news')
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false })
            .limit(3);

          const { data, error } = await query;
          if (error) throw error;
          
          let fetched = data || [];

          // Traduzir se necessário
          if (locale !== 'pt' && fetched.length > 0) {
            const ids = fetched.map(n => n.id);
            const langOrder = locale === 'fr' ? ['fr', 'en'] : [locale];
            const { data: trans } = await supabase
              .from('news_translations')
              .select('*')
              .in('news_id', ids)
              .in('language', langOrder);

            if (trans && trans.length > 0) {
              const transMap = new Map<string, any>();
              for (const t of trans) {
                const existing = transMap.get(t.news_id);
                if (!existing || t.language === locale) {
                  transMap.set(t.news_id, t);
                }
              }
              fetched = fetched.map(art => {
                const tr = transMap.get(art.id);
                if (!tr) return art;
                return {
                  ...art,
                  title: tr.title || art.title,
                  excerpt: tr.excerpt || art.excerpt,
                };
              });
            }
          }
          return fetched;
        };

        const cacheKey = `latest-news-${locale}`;
        const cachedNews = await queryCache.get(cacheKey, fetcher);
        setLatestNews(cachedNews);
      } catch (e) {
        console.error('Error loading latest news on Home:', e);
      }
    }

    loadLatestNews();

    // Carregar likes
    async function loadLikes() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: member } = await supabase
            .from('members')
            .select('id')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          if (member) {
            const { data } = await supabase
              .from('news_likes')
              .select('news_id')
              .eq('member_id', member.id);
            if (data) {
              setLikedArticles(data.map((l: any) => l.news_id));
            }
          }
        } catch (e) {}
      } else {
        const localLikes = localStorage.getItem('guest_liked_news');
        if (localLikes) {
          try {
            setLikedArticles(JSON.parse(localLikes));
          } catch (e) {}
        }
      }
    }

    loadLikes();
  }, [locale]);

  async function toggleLike(articleId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const isLiked = likedArticles.includes(articleId);
    
    // Atualização local de likes
    let newLikes: string[];
    if (isLiked) {
      newLikes = likedArticles.filter(id => id !== articleId);
      setLatestNews(prev => prev.map(a => a.id === articleId ? { ...a, likes_count: Math.max(0, (a.likes_count || 0) - 1) } : a));
    } else {
      newLikes = [...likedArticles, articleId];
      setLatestNews(prev => prev.map(a => a.id === articleId ? { ...a, likes_count: (a.likes_count || 0) + 1 } : a));
    }
    setLikedArticles(newLikes);

    if (!session?.user) {
      localStorage.setItem('guest_liked_news', JSON.stringify(newLikes));
      return;
    }

    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (member) {
        if (isLiked) {
          await supabase
            .from('news_likes')
            .delete()
            .eq('news_id', articleId)
            .eq('member_id', member.id);
        } else {
          await supabase
            .from('news_likes')
            .insert({
              news_id: articleId,
              member_id: member.id
            });
        }
      }
    } catch (e) {
      console.error('Error toggling like from Home:', e);
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const loc = locale === 'pt' ? 'pt-BR' : locale === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(loc, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen overflow-x-hidden">
      <header className="relative flex flex-col items-center justify-center text-center overflow-hidden mb-16 sm:mb-20">
        <div className="max-w-2xl z-10 space-y-5">
          <motion.h1 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary pb-2"
          >
            CodeEngine 1
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.09, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-sm sm:text-base text-on-surface-variant max-w-lg mx-auto leading-relaxed"
          >
            {t('home.heroSubtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pt-5"
          >
            <button
              onClick={() => setScreen('library')}
              className="primary-btn text-sm sm:text-base font-semibold px-6 sm:px-9 py-2.5 sm:py-3 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {t('home.exploreVault')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
        <div className="absolute inset-0 z-0 hidden sm:flex items-center justify-center opacity-25 pointer-events-none hero-abstract">
          <div className="w-[700px] h-[700px] bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-[100px] mix-blend-screen"></div>
        </div>
      </header>

      <section className="relative z-10">
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-3"
          >
            {t('home.featuredTitle')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.23, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-sm text-on-surface-variant max-w-md mx-auto"
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
                <motion.div
                  key={item.id}
                  onClick={() => onProductClick?.(item.product_id)}
                  onMouseEnter={() => prefetchProduct(item.product_id, locale)}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`glass-card rounded-xl p-1 group cursor-pointer ${offsetClass}`}
                >
                  <div className="bg-surface-container-low rounded-lg p-4 sm:p-6 h-full border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${accent}`} />
                    </div>
                    <div className="h-40 sm:h-48 rounded-md mb-4 sm:mb-6 overflow-hidden bg-surface-container relative">
                      <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} to-transparent mix-blend-overlay z-10`} />
                      <LazyImage
                        src={getProductCoverUrl(item)}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-active:mix-blend-normal group-hover:opacity-100 group-active:opacity-100 transition-all duration-500"
                        fallback={`https://placehold.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(item.title?.charAt(0) || 'P')}`}
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
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center font-sans text-on-surface-variant text-sm">
            {t('home.noFeatured')}
          </p>
        )}
      </section>

      {/* Últimas Notícias Section */}
      {latestNews.length > 0 && (
        <section className="relative z-10 mt-20 sm:mt-24">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-3">
              {locale === 'pt' ? 'Últimas Notícias' : locale === 'fr' ? 'Dernières Actualités' : 'Latest News'}
            </h2>
            <p className="font-sans text-sm text-on-surface-variant max-w-md mx-auto">
              {locale === 'pt' ? 'Fique por dentro das novidades sobre tecnologia, automação e inteligência artificial.' : locale === 'fr' ? 'Restez au courant des nouveautés sur la technologie, l\'automatisation et l\'intelligence artificielle.' : 'Stay up to date with the latest insights on technology, automation and artificial intelligence.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latestNews.map((article) => {
              const isLiked = likedArticles.includes(article.id);
              return (
                <div
                  key={article.id}
                  onClick={() => setScreen('news')}
                  className="glass-card rounded-xl p-1 mockup-rotate group cursor-pointer"
                >
                  <div className="bg-surface-container-low rounded-lg p-4 sm:p-6 h-full border border-white/5 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="h-40 sm:h-48 rounded-md mb-4 sm:mb-6 overflow-hidden bg-surface-container relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
                        {article.thumbnail_url ? (
                          <LazyImage
                            src={article.thumbnail_url}
                            alt={article.title}
                            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          {article.category}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant/70">
                          {formatDate(article.published_at)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="font-sans text-sm text-on-surface-variant line-clamp-3 mb-6">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-1.5 text-[#6366f1] text-xs font-bold uppercase tracking-widest font-display">
                        <span>{locale === 'pt' ? 'Ler Mais' : locale === 'fr' ? 'Lire Plus' : 'Read More'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(article.id);
                        }}
                        className={`p-2 rounded-full border transition-all ${
                          isLiked
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
