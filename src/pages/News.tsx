import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Calendar, Eye, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  author: string | null;
  published_at: string;
  views: number;
  created_at: string;
}

interface NewsProps {
  setScreen: (screen: string) => void;
}

export function News({ setScreen }: NewsProps) {
  const { t } = useTranslation('pages');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadNews();
  }, [selectedCategory]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  async function loadNews() {
    try {
      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(20);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNews(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackView(newsId: string) {
    if (!user) return;

    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (member) {
        await supabase.rpc('track_news_view', {
          p_news_id: newsId,
          p_member_id: member.id
        });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const categories = [
    t('news.categories.ai'),
    t('news.categories.automation'),
    t('news.categories.saas'),
    t('news.categories.programming'),
    t('news.categories.productivity'),
    t('news.categories.innovation')
  ];

  const getCategoryColor = (category: string) => {
    // Normalize category name for color matching
    const normalizedCategory = category.toLowerCase();
    
    const colors: Record<string, string> = {
      'ai': 'from-purple-500/20 to-purple-500/5 text-purple-400',
      'inteligência artificial': 'from-purple-500/20 to-purple-500/5 text-purple-400',
      'artificial intelligence': 'from-purple-500/20 to-purple-500/5 text-purple-400',
      'automação': 'from-blue-500/20 to-blue-500/5 text-blue-400',
      'automation': 'from-blue-500/20 to-blue-500/5 text-blue-400',
      'saas': 'from-green-500/20 to-green-500/5 text-green-400',
      'programação': 'from-orange-500/20 to-orange-500/5 text-orange-400',
      'programming': 'from-orange-500/20 to-orange-500/5 text-orange-400',
      'produtividade': 'from-pink-500/20 to-pink-500/5 text-pink-400',
      'productivity': 'from-pink-500/20 to-pink-500/5 text-pink-400',
      'inovação': 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
      'innovation': 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
    };
    
    return colors[normalizedCategory] || 'from-primary/20 to-primary/5 text-primary';
  };

  if (!user) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="glass-panel rounded-2xl p-12 max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
              <Newspaper className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-4">
              {t('news.exclusiveContent')}
            </h2>
            <p className="font-sans text-sm text-on-surface-variant mb-8">
              {t('news.exclusiveDesc')}
            </p>
            <button
              onClick={() => setScreen('auth')}
              className="font-display text-xs font-semibold tracking-widest uppercase px-8 py-3 rounded-full bg-primary text-on-primary hover:bg-white hover:text-background transition-all shadow-[0_0_25px_rgba(192,193,255,0.4)]"
            >
              {t('news.signInNow')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen">
      {/* Header */}
      <header className="mb-16 md:mb-24 flex flex-col items-start max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-primary">
            {t('news.badge')}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6"
        >
          {t('news.heading')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-sans text-lg text-on-surface-variant max-w-2xl"
        >
          {t('news.subtitle')}
        </motion.p>
      </header>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-12 flex flex-wrap gap-3"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`font-display text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-full transition-all ${
            selectedCategory === null
              ? 'bg-primary text-on-primary shadow-[0_0_25px_rgba(192,193,255,0.4)]'
              : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-primary'
          }`}
        >
          {t('news.categories.all')}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`font-display text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-full transition-all ${
              selectedCategory === category
                ? 'bg-primary text-on-primary shadow-[0_0_25px_rgba(192,193,255,0.4)]'
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-primary'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="w-full h-48 bg-white/5 rounded-xl mb-4"></div>
              <div className="h-4 bg-white/5 rounded mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-white mb-3">
            {t('news.noNews')}
          </h3>
          <p className="font-sans text-sm text-on-surface-variant">
            {selectedCategory
              ? t('news.noNewsCategory', { category: selectedCategory })
              : t('news.noNewsGeneral')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:shadow-[0_0_40px_rgba(192,193,255,0.2)] transition-all"
              onClick={() => trackView(article.id)}
            >
              {/* Thumbnail */}
              {article.thumbnail_url && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Category Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(article.category)} font-display text-xs font-semibold uppercase tracking-wider mb-4`}>
                  <TrendingUp className="w-3 h-3" />
                  {article.category}
                </div>

                {/* Title */}
                <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="font-sans text-sm text-on-surface-variant mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span>{article.views} {t('news.views')}</span>
                  </div>
                </div>

                {/* Read More */}
                <div className="flex items-center gap-2 mt-4 text-primary group-hover:gap-3 transition-all">
                  <span className="font-display text-xs font-semibold tracking-widest uppercase">
                    {t('news.readMore')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
