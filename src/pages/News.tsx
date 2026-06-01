import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Newspaper, Calendar, Eye, ArrowRight, Sparkles, TrendingUp,
  Heart, ChevronLeft, ChevronRight, X, Share2, Send, Copy, Check, Image, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../contexts/LocaleContext';
import { LazyImage } from '../components/ui/LazyImage';
import { queryCache } from '../lib/queryCache';

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
  likes_count?: number;
}

function getGroupLabel(dateString: string, currentLocale: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return currentLocale === 'pt' ? 'Hoje' : currentLocale === 'fr' ? "Aujourd'hui" : 'Today';
  } else if (isSameDay(date, yesterday)) {
    return currentLocale === 'pt' ? 'Ontem' : currentLocale === 'fr' ? 'Hier' : 'Yesterday';
  } else {
    return date.toLocaleDateString(currentLocale === 'pt' ? 'pt-PT' : currentLocale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}

interface NewsProps {
  setScreen: (screen: string) => void;
}

export function News({ setScreen }: NewsProps) {
  const { t } = useTranslation('pages');
  const { locale } = useLocale();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<NewsArticle[]>([]);
  const [normalArticles, setNormalArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // Pagination and sorting states
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sharing states
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showInstagramGraphic, setShowInstagramGraphic] = useState(false);

  const loadFeaturedNews = useCallback(async (revalidate = true) => {
    try {
      const fetcher = async () => {
        let query = supabase
          .from('news')
          .select('*')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        let baseNews = data || [];

        // Mapear traduções
        if (locale !== 'pt' && baseNews.length > 0) {
          const newsIds = baseNews.map(n => n.id);
          const langOrder = locale === 'fr' ? ['fr', 'en'] : [locale];
          const { data: trans } = await supabase
            .from('news_translations')
            .select('*')
            .in('news_id', newsIds)
            .in('language', langOrder);

          if (trans && trans.length > 0) {
            const transMap = new Map<string, any>();
            for (const t of trans) {
              const existing = transMap.get(t.news_id);
              if (!existing || t.language === locale) {
                transMap.set(t.news_id, t);
              }
            }
            baseNews = baseNews.map(article => {
              const tr = transMap.get(article.id);
              if (!tr) return article;
              return {
                ...article,
                title: tr.title || article.title,
                slug: tr.slug || article.slug,
                excerpt: tr.excerpt || article.excerpt,
                content: tr.content || article.content,
              };
            });
          }
        }
        return baseNews;
      };

      const baseNews = await queryCache.get(`news-featured-base-${locale}`, fetcher, { revalidate });
      setNews(baseNews);

      // Split into Featured (tagged with 'Destaque')
      const featured = baseNews.filter(a => 
        a.tags?.some(tag => tag.toLowerCase() === 'destaque')
      ).slice(0, 4);

      setFeaturedArticles(featured);
    } catch (e) {
      console.error('Error loading featured news:', e);
    }
  }, [locale]);

  const PAGE_SIZE = 6;

  const loadNews = useCallback(async (pageToLoad = 0, append = false, revalidate = true) => {
    if (pageToLoad === 0 && !append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const fetcher = async () => {
        let query = supabase
          .from('news')
          .select('*')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: sortBy === 'oldest' });

        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }

        query = query.range(from, to);

        const { data, error } = await query;
        if (error) throw error;

        let fetchedNews = data || [];

        // Mapear traduções
        if (locale !== 'pt' && fetchedNews.length > 0) {
          const newsIds = fetchedNews.map(n => n.id);
          const langOrder = locale === 'fr' ? ['fr', 'en'] : [locale];
          const { data: trans } = await supabase
            .from('news_translations')
            .select('*')
            .in('news_id', newsIds)
            .in('language', langOrder);

          if (trans && trans.length > 0) {
            const transMap = new Map<string, any>();
            for (const t of trans) {
              const existing = transMap.get(t.news_id);
              if (!existing || t.language === locale) {
                transMap.set(t.news_id, t);
              }
            }
            fetchedNews = fetchedNews.map(article => {
              const tr = transMap.get(article.id);
              if (!tr) return article;
              return {
                ...article,
                title: tr.title || article.title,
                slug: tr.slug || article.slug,
                excerpt: tr.excerpt || article.excerpt,
                content: tr.content || article.content,
              };
            });
          }
        }
        return fetchedNews;
      };

      const cacheKey = `news-grid-${selectedCategory || 'all'}-${sortBy}-${pageToLoad}-${locale}`;
      const fetchedNews = await queryCache.get(cacheKey, fetcher, { revalidate });

      if (append) {
        setNormalArticles(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const filtered = fetchedNews.filter((a: any) => !existingIds.has(a.id));
          return [...prev, ...filtered];
        });
      } else {
        setNormalArticles(fetchedNews);
      }

      setHasMore(fetchedNews.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, locale]);

  const handleWhatsAppShare = (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    const text = `🔥 *${article.title}*\n\n${article.excerpt}\n\n👉 Leia a notícia completa aqui: ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTwitterShare = (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    const text = `🔥 ${article.title}\n\nLeia a notícia completa na CodeEngine 1:\n`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleLinkedInShare = (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleCopyLink = (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCaption = (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    const text = `🔥 ${article.title}\n\n${article.excerpt}\n\nConfira as últimas novidades de tecnologia e inteligência artificial no hub de conhecimento da CodeEngine 1!\n\nLink: ${shareUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleNativeShare = async (article: NewsArticle) => {
    const shareUrl = `${window.location.origin}/?screen=noticias&newsId=${article.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink(article);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Load featured news once on mount or locale changes
  useEffect(() => {
    loadFeaturedNews();
  }, [locale]);

  // Load normal news on category, sorting or locale changes
  useEffect(() => {
    setPage(0);
    loadNews(0, false);
  }, [selectedCategory, sortBy, locale]);

  // Realtime updates subscription to invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel('news-realtime-caching')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        () => {
          queryCache.invalidate(`news-featured-base-${locale}`);
          const cacheKey = `news-grid-${selectedCategory || 'all'}-${sortBy}-${page}-${locale}`;
          queryCache.invalidate(cacheKey);
          void loadFeaturedNews(true);
          void loadNews(page, false, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news_translations' },
        () => {
          queryCache.invalidate(`news-featured-base-${locale}`);
          const cacheKey = `news-grid-${selectedCategory || 'all'}-${sortBy}-${page}-${locale}`;
          queryCache.invalidate(cacheKey);
          void loadFeaturedNews(true);
          void loadNews(page, false, true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [locale, selectedCategory, sortBy, page, loadFeaturedNews, loadNews]);

  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % featuredArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredArticles]);



  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      // Check if user is admin
      const isUserAdmin = currentUser.email === 'fernandoquipiaca007@gmail.com';
      setIsAdmin(isUserAdmin);

      try {
        const { data: member } = await supabase
          .from('members')
          .select('id, role')
          .eq('auth_id', currentUser.id)
          .maybeSingle();

        if (member) {
          setMemberId(member.id);
          if (member.role === 'admin' || member.role === 'owner') {
            setIsAdmin(true);
          }
          await loadLikedArticles(member.id);
        }
      } catch (err) {
        console.error('Error fetching member role:', err);
      }
    } else {
      // Load guest likes from localStorage
      const localLikes = localStorage.getItem('guest_liked_news');
      if (localLikes) {
        try {
          setLikedArticles(JSON.parse(localLikes));
        } catch (e) {}
      }
    }
  }

  async function loadLikedArticles(mId: string) {
    try {
      const { data, error } = await supabase
        .from('news_likes')
        .select('news_id')
        .eq('member_id', mId);

      if (!error && data) {
        setLikedArticles(data.map((l: any) => l.news_id));
      }
    } catch (err) {
      console.error('Error loading liked articles:', err);
    }
  }



  async function trackView(newsId: string) {
    if (!user || !memberId) return;

    try {
      await supabase.rpc('track_news_view', {
        p_news_id: newsId,
        p_member_id: memberId
      });
      // Increment views count in state locally
      setNews(prev => prev.map(a => a.id === newsId ? { ...a, views: (a.views || 0) + 1 } : a));
      setFeaturedArticles(prev => prev.map(a => a.id === newsId ? { ...a, views: (a.views || 0) + 1 } : a));
      setNormalArticles(prev => prev.map(a => a.id === newsId ? { ...a, views: (a.views || 0) + 1 } : a));
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  async function toggleLike(articleId: string) {
    if (!user) {
      // Guest local liked articles persistence in localStorage
      const isLiked = likedArticles.includes(articleId);
      let newLiked: string[];
      if (isLiked) {
        newLiked = likedArticles.filter(id => id !== articleId);
        const updateFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: Math.max(0, (a.likes_count || 0) - 1) } : a;
        setNews(prev => prev.map(updateFn));
        setFeaturedArticles(prev => prev.map(updateFn));
        setNormalArticles(prev => prev.map(updateFn));
      } else {
        newLiked = [...likedArticles, articleId];
        const updateFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: (a.likes_count || 0) + 1 } : a;
        setNews(prev => prev.map(updateFn));
        setFeaturedArticles(prev => prev.map(updateFn));
        setNormalArticles(prev => prev.map(updateFn));
      }
      setLikedArticles(newLiked);
      localStorage.setItem('guest_liked_news', JSON.stringify(newLiked));
      return;
    }

    let activeMemberId = memberId;
    if (!activeMemberId) {
      try {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();
        if (member) {
          activeMemberId = member.id;
          setMemberId(member.id);
        }
      } catch (err) {
        console.error('Error resolving memberId on demand:', err);
      }
    }

    if (!activeMemberId) {
      return;
    }

    const isLiked = likedArticles.includes(articleId);

    // Snappy Optimistic UI Updates
    if (isLiked) {
      setLikedArticles(prev => prev.filter(id => id !== articleId));
      const updateFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: Math.max(0, (a.likes_count || 0) - 1) } : a;
      setNews(prev => prev.map(updateFn));
      setFeaturedArticles(prev => prev.map(updateFn));
      setNormalArticles(prev => prev.map(updateFn));

      try {
        const { error } = await supabase
          .from('news_likes')
          .delete()
          .eq('news_id', articleId)
          .eq('member_id', activeMemberId);
        if (error) throw error;
      } catch (err) {
        console.error('Error unliking:', err);
        // Rollback on error
        setLikedArticles(prev => [...prev, articleId]);
        const rollbackFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: (a.likes_count || 0) + 1 } : a;
        setNews(prev => prev.map(rollbackFn));
        setFeaturedArticles(prev => prev.map(rollbackFn));
        setNormalArticles(prev => prev.map(rollbackFn));
      }
    } else {
      setLikedArticles(prev => [...prev, articleId]);
      const updateFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: (a.likes_count || 0) + 1 } : a;
      setNews(prev => prev.map(updateFn));
      setFeaturedArticles(prev => prev.map(updateFn));
      setNormalArticles(prev => prev.map(updateFn));

      try {
        const { error } = await supabase
          .from('news_likes')
          .insert({
            news_id: articleId,
            member_id: activeMemberId
          });
        if (error) throw error;
      } catch (err) {
        console.error('Error liking:', err);
        // Rollback on error
        setLikedArticles(prev => prev.filter(id => id !== articleId));
        const rollbackFn = (a: NewsArticle) => a.id === articleId ? { ...a, likes_count: Math.max(0, (a.likes_count || 0) - 1) } : a;
        setNews(prev => prev.map(rollbackFn));
        setFeaturedArticles(prev => prev.map(rollbackFn));
        setNormalArticles(prev => prev.map(rollbackFn));
      }
    }
  }

  const nextSlide = () => {
    setCarouselIndex(prev => (prev + 1) % featuredArticles.length);
  };

  const prevSlide = () => {
    setCarouselIndex(prev => (prev - 1 + featuredArticles.length) % featuredArticles.length);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const loc = locale === 'pt' ? 'pt-BR' : locale === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(loc, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const translateCategory = (cat: string) => {
    const norm = cat.toLowerCase();
    if (norm === 'ai') return t('news.categories.ai') || 'Inteligência Artificial';
    if (norm === 'automação' || norm === 'automation') return t('news.categories.automation') || 'Automação';
    if (norm === 'saas') return t('news.categories.saas') || 'SaaS';
    if (norm === 'programação' || norm === 'programming') return t('news.categories.programming') || 'Programação';
    if (norm === 'produtividade' || norm === 'productivity') return t('news.categories.productivity') || 'Produtividade';
    if (norm === 'inovação' || norm === 'innovation') return t('news.categories.innovation') || 'Inovação';
    return cat;
  };

  const getLikesText = (count: number) => {
    if (locale === 'fr') return `${count} J'aime`;
    if (locale === 'pt') return `${count} Gostos`;
    return `${count} Likes`;
  };

  const getCloseText = () => {
    if (locale === 'fr') return "Fermer l'article";
    if (locale === 'pt') return "Fechar Artigo";
    return "Close Article";
  };

  const categories = [
    'AI',
    'Automação',
    'SaaS',
    'Programação',
    'Produtividade',
    'Inovação'
  ];

  const getCategoryColor = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    const colors: Record<string, string> = {
      'ai': 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
      'inteligência artificial': 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
      'artificial intelligence': 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
      'automação': 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
      'automation': 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
      'saas': 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/30',
      'programação': 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30',
      'programming': 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30',
      'produtividade': 'from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30',
      'productivity': 'from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30',
      'inovação': 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30 border-cyan-500/30',
      'innovation': 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30 border-cyan-500/30',
    };
    return colors[normalizedCategory] || 'from-primary/20 to-primary/5 text-primary border-primary/30';
  };

  // Deep linking: Auto-open article from URL query param or sessionStorage
  useEffect(() => {
    if (news.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const urlNewsId = params.get('newsId') || sessionStorage.getItem('pendingNewsId');
    if (urlNewsId) {
      sessionStorage.removeItem('pendingNewsId');
      const art = news.find(n => n.id === urlNewsId);
      if (art) {
        setSelectedArticle(art);
        void trackView(art.id);
        // Clean URL parameter
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        // Fallback: Se o artigo não estiver no array carregado inicialmente (devido a filtros ou paginação),
        // buscamos diretamente no banco de dados para abrir o artigo correto!
        async function fetchSingleArticle(id: string) {
          try {
            const { data, error } = await supabase
              .from('news')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (data && !error) {
              let art = data;
              if (locale !== 'pt') {
                const langOrder = locale === 'fr' ? ['fr', 'en'] : [locale];
                const { data: trans } = await supabase
                  .from('news_translations')
                  .select('*')
                  .eq('news_id', id)
                  .in('language', langOrder);

                if (trans && trans.length > 0) {
                  // Priorizar o idioma ativo, senão inglês se houver
                  const tr = trans.find(t => t.language === locale) || trans[0];
                  art = {
                    ...art,
                    title: tr.title || art.title,
                    excerpt: tr.excerpt || art.excerpt,
                    content: tr.content || art.content,
                  };
                }
              }
              setSelectedArticle(art);
              void trackView(art.id);
            }
          } catch (e) {
            console.error('Error fetching single deep-linked news article:', e);
          }
        }
        fetchSingleArticle(urlNewsId);
        // Clean URL parameter
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [news, locale]);

  function parseInlineFormatting(text: string) {
    if (!text) return '';
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-bold">{part}</strong>;
      }
      return part;
    });
  }

  function renderArticleContent(content: string) {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Parse markdown images: ![alt](url)
      const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        const alt = imageMatch[1];
        const src = imageMatch[2];
        return (
          <div key={idx} className="my-6 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex justify-center shadow-lg">
            <img src={src} alt={alt} className="max-w-full max-h-[500px] object-contain rounded-xl hover:scale-[1.01] transition-transform duration-300" />
          </div>
        );
      }

      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="font-display text-2xl sm:text-3xl font-bold text-white mt-8 mb-4 border-b border-white/5 pb-2">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="font-display text-xl sm:text-2xl font-bold text-white mt-6 mb-3">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="font-display text-lg sm:text-xl font-bold text-white mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="ml-6 list-disc text-on-surface-variant my-1.5 leading-relaxed">
            {parseInlineFormatting(trimmed.substring(2))}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-4" />;
      }
      return <p key={idx} className="text-on-surface-variant leading-relaxed my-3.5 text-base">{parseInlineFormatting(trimmed)}</p>;
    });
  }



  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen">
      
      {/* Header */}
      <header className="mb-12 md:mb-16 flex flex-col items-start max-w-3xl">
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
            {t('news.badge') || 'Knowledge Hub'}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6"
        >
          {t('news.heading') || 'Knowledge Hub'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-sans text-base sm:text-lg text-on-surface-variant max-w-2xl"
        >
          {t('news.subtitle') || 'Stay ahead with the latest insights on AI, automation, SaaS and technology. Exclusive content for community members.'}
        </motion.p>
      </header>

      {/* 1. Featured News Carousel Section */}
      {featuredArticles.length > 0 && !selectedCategory && (
        <div className="relative mb-20 group">
          {featuredArticles.map((article, idx) => {
            if (idx !== carouselIndex) return null;

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-3xl overflow-hidden min-h-[480px] sm:min-h-[520px] flex flex-col justify-end p-6 sm:p-12 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              >
                {/* Background Cover Image */}
                <div className="absolute inset-0 z-0">
                  {article.thumbnail_url ? (
                    <LazyImage
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 font-display text-[10px] font-bold uppercase tracking-wider`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-on-surface-variant/80 font-semibold">
                      {formatDate(article.published_at)}
                    </span>
                    {isAdmin && (
                      <span className="flex items-center gap-1 text-xs text-on-surface-variant/60 font-semibold bg-white/5 px-2 py-0.5 rounded">
                        <Eye className="w-3.5 h-3.5" /> {article.views} views
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                    {article.title}
                  </h2>

                  <p className="font-sans text-sm sm:text-base text-on-surface-variant leading-relaxed line-clamp-3 max-w-2xl">
                    {article.excerpt}
                  </p>

                  {/* Actions Row */}
                  <div className="flex items-center gap-4 pt-4 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        void trackView(article.id);
                      }}
                      className="px-6 py-3 rounded-full bg-[#6366f1] text-white font-display text-xs font-bold tracking-widest uppercase hover:bg-[#5053e3] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
                    >
                      <span>{t('news.readMore') || 'Read More'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleLike(article.id)}
                      className={`px-5 py-3 rounded-full border font-display text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all ${
                        likedArticles.includes(article.id)
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedArticles.includes(article.id) ? 'fill-current text-red-500' : ''}`} />
                      <span>{getLikesText(article.likes_count || 0)}</span>
                    </button>
                  </div>
                </div>

                {/* Left/Right manual sliders */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 hover:border-white/20 transition-all z-20 opacity-0 group-hover:opacity-100 hidden sm:flex"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 hover:border-white/20 transition-all z-20 opacity-0 group-hover:opacity-100 hidden sm:flex"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bottom slide indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                  {featuredArticles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === carouselIndex ? 'w-6 bg-[#6366f1]' : 'w-2 bg-white/25 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* 2. Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-12 flex flex-wrap gap-3 border-b border-white/5 pb-8"
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={`font-display text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-full transition-all ${
            selectedCategory === null
              ? 'bg-primary text-on-primary shadow-[0_0_25px_rgba(192,193,255,0.4)]'
              : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-primary'
          }`}
        >
          {t('news.categories.all') || 'Todas'}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`font-display text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-full transition-all ${
              selectedCategory && selectedCategory.toLowerCase() === category.toLowerCase()
                ? 'bg-primary text-on-primary shadow-[0_0_25px_rgba(192,193,255,0.4)]'
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-primary'
            }`}
          >
            {translateCategory(category)}
          </button>
        ))}
      </motion.div>

      {/* 2.5 Sort Filter Bar */}
      <div className="flex justify-between items-center mb-8">
        <span className="font-sans text-xs text-on-surface-variant font-medium">
          {locale === 'pt' ? `${normalArticles.length} notícias encontradas` : locale === 'fr' ? `${normalArticles.length} articles trouvés` : `${normalArticles.length} articles found`}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-display text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">
            {locale === 'pt' ? 'Ordenar por:' : locale === 'fr' ? 'Trier par:' : 'Sort by:'}
          </span>
          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-display text-[10px] font-bold tracking-wider uppercase text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {sortBy === 'newest'
              ? (locale === 'pt' ? 'Mais Recentes' : locale === 'fr' ? 'Plus Récents' : 'Most Recent')
              : (locale === 'pt' ? 'Mais Antigas' : locale === 'fr' ? 'Plus Anciens' : 'Oldest')}
          </button>
        </div>
      </div>

      {/* 3. News Grid List (Normal articles) */}
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
      ) : normalArticles.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center w-full">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-white mb-3">
            {t('news.noNews') || 'Nenhuma notícia encontrada'}
          </h3>
          <p className="font-sans text-sm text-on-surface-variant">
            {selectedCategory
              ? (locale === 'fr' ? `Actuellement, il n'y a pas d'articles normaux dans la catégorie "${translateCategory(selectedCategory)}".` : locale === 'pt' ? `De momento, não há notícias normais na categoria "${translateCategory(selectedCategory)}".` : `Currently, there are no normal articles in the category "${translateCategory(selectedCategory)}".`)
              : (t('news.noNewsGeneral') || 'Sem novidades disponíveis de momento.')}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {normalArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:shadow-[0_0_40px_rgba(192,193,255,0.15)] hover:border-primary/20 border border-white/5 transition-all flex flex-col h-full"
                onClick={() => {
                  setSelectedArticle(article);
                  void trackView(article.id);
                }}
              >
                {/* Thumbnail */}
                {article.thumbnail_url && (
                  <div className="relative w-full h-48 overflow-hidden flex-shrink-0">
                    <LazyImage
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Category Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(article.category)} font-display text-[10px] font-bold uppercase tracking-wider mb-4 border w-fit`}>
                    <TrendingUp className="w-3 h-3" />
                    {translateCategory(article.category)}
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 break-words">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="font-sans text-sm text-on-surface-variant mb-6 line-clamp-3 flex-1 break-words">
                    {article.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-white/5 pt-4 flex-shrink-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 font-medium bg-white/5 px-2 py-0.5 rounded">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{article.views} {locale === 'fr' ? 'vues' : locale === 'pt' ? 'visualizações' : 'views'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-4 pt-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[#6366f1] group-hover:gap-2.5 transition-all text-xs font-bold uppercase tracking-widest font-display">
                      <span>{t('news.readMore') || 'Read More'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    
                    {/* Heart/Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent opening the article twice
                        toggleLike(article.id);
                      }}
                      className={`p-2 rounded-full border transition-all ${
                        likedArticles.includes(article.id)
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedArticles.includes(article.id) ? 'fill-current text-red-500' : ''}`} />
                    </button>
                  </div>

                </div>
              </motion.article>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-12 mb-6">
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  loadNews(nextPage, true);
                }}
                disabled={loadingMore}
                className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 text-white rounded-full font-display text-xs font-bold tracking-widest uppercase flex items-center gap-2.5 transition-all shadow-lg hover:scale-105 cursor-pointer relative z-10 disabled:opacity-50"
              >
                <span>{loadingMore ? (locale === 'pt' ? 'Carregando...' : 'Loading...') : `+ ${locale === 'pt' ? 'Ver Notícias Anteriores' : locale === 'fr' ? 'Voir les Articles Précédents' : 'Load Previous News'}`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Immersive Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-8 animate__animated animate__fadeIn">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Header / Cover Image */}
            <div className="relative h-48 sm:h-64 flex-shrink-0">
              {selectedArticle.thumbnail_url ? (
                <LazyImage
                  src={selectedArticle.thumbnail_url}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-black to-secondary/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-all shadow-lg hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 font-display text-[10px] font-bold uppercase tracking-wider`}>
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-on-surface-variant/80 font-semibold">
                  {formatDate(selectedArticle.published_at)}
                </span>
                {selectedArticle.author && (
                  <span className="text-xs text-on-surface-variant/60 font-medium">
                    · Por {selectedArticle.author}
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {selectedArticle.title}
              </h1>

              {/* Excerpt panel */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm sm:text-base text-on-surface-variant italic leading-relaxed">
                {selectedArticle.excerpt}
              </div>

              {/* Rich Content markdown renderer */}
              <div className="prose prose-invert max-w-none text-on-surface-variant/90 space-y-4">
                {renderArticleContent(selectedArticle.content)}
              </div>

              {/* Sharing Interface Section */}
              {showShareMenu && (
                <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 animate__animated animate__fadeIn">
                  <h3 className="font-display text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Compartilhar esta notícia
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleWhatsAppShare(selectedArticle)}
                      className="px-4 py-3 bg-[#25d366]/10 border border-[#25d366]/30 hover:bg-[#25d366]/20 text-[#25d366] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider"
                    >
                      <Send className="w-4 h-4" />
                      WhatsApp
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowInstagramGraphic(true)}
                      className="px-4 py-3 bg-[#e1306c]/10 border border-[#e1306c]/30 hover:bg-[#e1306c]/20 text-[#e1306c] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider"
                    >
                      <Image className="w-4 h-4" />
                      Instagram Kit
                    </button>
                    
                    <button
                      onClick={() => handleLinkedInShare(selectedArticle)}
                      className="px-4 py-3 bg-[#0a66c2]/10 border border-[#0a66c2]/30 hover:bg-[#0a66c2]/20 text-[#0a66c2] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider"
                    >
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn
                    </button>

                    <button
                      onClick={() => handleNativeShare(selectedArticle)}
                      className="px-4 py-3 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold uppercase tracking-wider"
                    >
                      <Share2 className="w-4 h-4" />
                      Mais Opções
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleCopyLink(selectedArticle)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Link Copiado!' : 'Copiar Link da Notícia'}
                    </button>
                    
                    <button
                      onClick={() => handleCopyCaption(selectedArticle)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all"
                    >
                      {copiedCaption ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda Pronta'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-white/5 flex items-center justify-between bg-surface-lowest flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => toggleLike(selectedArticle.id)}
                  className={`px-5 py-2.5 rounded-full border font-display text-xs font-bold tracking-wide flex items-center gap-2 transition-all ${
                    likedArticles.includes(selectedArticle.id)
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-4.5 h-4.5 ${likedArticles.includes(selectedArticle.id) ? 'fill-current text-red-500' : ''}`} />
                  <span>{getLikesText(selectedArticle.likes_count || 0)}</span>
                </button>

                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={`px-5 py-2.5 rounded-full border font-display text-xs font-bold tracking-wide flex items-center gap-2 transition-all ${
                    showShareMenu
                      ? 'bg-primary/20 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Share2 className="w-4.5 h-4.5" />
                  Compartilhar
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedArticle(null);
                  setShowShareMenu(false);
                }}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-display text-xs font-bold tracking-wide transition-all"
              >
                {getCloseText()}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Instagram Graphic Modal Overlay */}
      {showInstagramGraphic && selectedArticle && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate__animated animate__fadeIn">
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <div className="flex justify-between items-center w-full px-2">
              <span className="font-display text-xs font-bold tracking-widest uppercase text-primary">
                Instagram Stories Kit
              </span>
              <button
                onClick={() => setShowInstagramGraphic(false)}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 9:16 Story Template Box */}
            <div className="aspect-[9/16] w-full max-w-[320px] rounded-3xl bg-[#08080c] border border-white/10 relative overflow-hidden flex flex-col justify-between p-8 shadow-2xl relative select-none">
              {/* Glow backgrounds */}
              <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-primary/30 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
              <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-secondary/30 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
              
              {/* Story Top Header */}
              <div className="flex justify-between items-start z-10">
                <span className="font-display text-[9px] font-extrabold tracking-[0.2em] uppercase text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  {selectedArticle.category}
                </span>
                <div className="text-right">
                  <span className="font-display text-[8px] font-extrabold tracking-widest text-on-surface-variant uppercase">
                    CodeEngine 1
                  </span>
                </div>
              </div>

              {/* Main Story Content Card */}
              <div className="z-10 flex-1 flex flex-col justify-center gap-4 my-8">
                {selectedArticle.thumbnail_url && (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <LazyImage src={selectedArticle.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="font-display text-lg font-extrabold text-white leading-tight tracking-tight">
                  {selectedArticle.title}
                </h2>
                <p className="font-sans text-[10px] text-on-surface-variant/80 line-clamp-4 leading-relaxed">
                  {selectedArticle.excerpt}
                </p>
              </div>

              {/* Sticker Area Placeholder */}
              <div className="z-10 w-full flex flex-col items-center gap-2 mb-6">
                <div className="px-5 py-3 bg-primary rounded-full text-on-primary font-display text-[8px] font-extrabold tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(192,193,255,0.4)] animate-pulse border border-white/20 select-none">
                  [ ADICIONE O LINK STICKER AQUI ]
                </div>
              </div>

              {/* Footer Brand Logo */}
              <div className="z-10 flex flex-col items-center gap-1 border-t border-white/10 pt-4">
                <span className="font-display text-[8px] font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  codeengine.store
                </span>
              </div>
            </div>

            <div className="text-center space-y-3 max-w-sm mt-2">
              <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
                💡 <strong>Instruções do Stories:</strong> Tire um print desta tela, abra seu Instagram Stories, insira o print e posicione a figurinha de link exatamente sobre a área marcada.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleCopyLink(selectedArticle)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Link Copiado!' : 'Copiar Link do Sticker'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
