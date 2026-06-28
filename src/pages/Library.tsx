import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Bot, Code2, Workflow, Megaphone, Cloud, Zap, DollarSign, LayoutDashboard, Database, Briefcase, CheckCircle, ShieldCheck, User, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';
import { useOwnedProducts } from '../hooks/useOwnedProducts';
import { FavoriteButton } from '../components/FavoriteButton';
import { fetchLocalizedProducts, LocalizedProduct } from '../hooks/useLocalizedProduct';
import { useLocale } from '../contexts/LocaleContext';
import { usePoints } from '../hooks/usePoints';
import { useUserCountry } from '../contexts/UserCountryContext';
import { canViewProduct } from '../lib/product-visibility';
import { getProductCoverUrl } from '../lib/storage-path';
import { useTranslation } from 'react-i18next';
import { useAuthSession } from '../hooks/useAuthSession';
import { LazyImage } from '../components/ui/LazyImage';
import { queryCache } from '../lib/queryCache';
import { prefetchProduct } from '../lib/prefetch';
import { CategorySelector } from '../components/ui/category-feature-selector';

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  display_order: number;
}

export function Library({ setScreen, onProductClick }: { 
  setScreen: (s: string) => void;
  onProductClick?: (productId: string) => void;
}) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation();
  const { isAngola } = useUserCountry();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showSubcategoriesDropdown, setShowSubcategoriesDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthSession();
  const { locale } = useLocale();
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    async function loadOnboarding() {
      if (user?.id) {
        const { data } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setOnboardingData(data);
      } else {
        setOnboardingData(null);
      }
    }
    void loadOnboarding();
  }, [user?.id]);
  const { balance } = usePoints();
  const memberLevel = balance?.level ?? 'starter';

  // Get favorites and owned products hooks
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);
  const { isOwned } = useOwnedProducts(user?.id);

  const loadData = useCallback(
    async (revalidate = true) => {
      setLoading(true);
      setError(null);

      try {
        const fetcher = async () => {
          // Load categories
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

          if (categoriesError) throw categoriesError;

          const localized = await fetchLocalizedProducts(locale, 'active');
          const visible = (localized as any[]).filter((p) =>
            canViewProduct(p as any, memberLevel, Boolean(user))
          );
          
          return {
            categories: categoriesData || [],
            products: visible,
          };
        };

        const cacheKey = `library-data-${locale}-${memberLevel}-${Boolean(user)}`;
        const cachedData = await queryCache.get(cacheKey, fetcher, { revalidate });

        if (cachedData) {
          setCategories(cachedData.categories);
          setProducts(cachedData.products);
        }
      } catch (err) {
        console.error('[Library] Critical error loading data:', err);
        const detail = err && typeof err === 'object'
          ? (err as any).message || (err as any).details || (err as any).hint || JSON.stringify(err)
          : String(err);
        setError(`Erro ao carregar dados: ${detail}`);
      } finally {
        setLoading(false);
      }
    },
    [locale, memberLevel, user?.id]
  );

  const [categoryAds, setCategoryAds] = useState<any[]>([]);

  useEffect(() => {
    async function loadCategoryAds() {
      try {
        const { data } = await supabase
          .from('ad_campaigns')
          .select('*, product:products(*)')
          .eq('status', 'active')
          .eq('placement', 'category_boost');
        setCategoryAds(data || []);
      } catch (err) {
        console.error('Error loading category ads:', err);
      }
    }
    loadCategoryAds();
  }, []);

  // Load products and categories (re-fetch when locale changes)
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load subcategories when selectedCategory changes
  useEffect(() => {
    async function loadSubcategories() {
      if (!selectedCategory) {
        setSubcategories([]);
        setSelectedSubcategory(null);
        return;
      }
      try {
        const fetcher = async () => {
          const { data, error } = await supabase
            .from('subcategories')
            .select('*')
            .eq('category_id', selectedCategory)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return data || [];
        };

        const cacheKey = `subcategories-${selectedCategory}`;
        const cachedData = await queryCache.get(cacheKey, fetcher);
        setSubcategories(cachedData);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setSubcategories([]);
      }
    }
    setSelectedSubcategory(null);
    void loadSubcategories();
  }, [selectedCategory]);

  // Setup realtime subscription for products with queryCache SWR invalidation
  useEffect(() => {
    const bump = () => {
      const cacheKey = `library-data-${locale}-${memberLevel}-${Boolean(user)}`;
      queryCache.invalidate(cacheKey);
      void loadData(true);
    };

    const channel = supabase
      .channel('products-realtime-caching')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        bump
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [locale, memberLevel, user?.id, loadData]);

  const getRecommendationScore = (p: any, onboarding: any) => {
    let score = 0;
    
    if (onboarding) {
      const interests = onboarding.interests || [];
      const contentPrefs = onboarding.content_preferences || [];
      const productTags = p.tags || [];
      const productType = p.product_type || '';

      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const normInterests = interests.map(normalize);
      const normTags = productTags.map(normalize);
      
      const hasInterestMatch = normInterests.some(i => normTags.some(t => t.includes(i) || i.includes(t) || (t === 'ai' && i.includes('artificial')) || (t === 'ia' && i.includes('artificial'))));
      if (hasInterestMatch) {
        score += 5;
      }

      const typeNorm = productType.toLowerCase();
      const hasContentMatch = contentPrefs.some((pref: string) => {
        const pNorm = pref.toLowerCase();
        if (pNorm.includes('ebook') && (typeNorm === 'ebook' || typeNorm === 'file')) return true;
        if (pNorm.includes('cours') && typeNorm === 'course') return true;
        if (pNorm.includes('tool') && normTags.some(t => t.includes('tool') || t.includes('utilitario') || t.includes('ferramenta'))) return true;
        if (pNorm.includes('template') && normTags.some(t => t.includes('template') || t.includes('modelo'))) return true;
        if (pNorm.includes('news') && normTags.some(t => t.includes('noticia') || t.includes('artigo') || t.includes('news'))) return true;
        if (pNorm.includes('guide') && normTags.some(t => t.includes('guia') || t.includes('guide') || t.includes('tutorial'))) return true;
        if (pNorm.includes('software') && (typeNorm === 'software' || normTags.some(t => t.includes('software') || t.includes('app') || t.includes('programa')))) return true;
        if (pNorm.includes('saas') && (typeNorm === 'saas' || normTags.some(t => t.includes('saas') || t.includes('web')))) return true;
        return false;
      });
      if (hasContentMatch) {
        score += 3;
      }
    }

    if (p.is_featured || p.featured_pick) {
      score += 2;
    }

    if (p.is_bestseller) {
      score += 2;
    }

    if (p.codeengine_recommended || p.editor_choice || p.featured_pick) {
      score += 4;
    }

    return score;
  };

  // Filter category ads matching current selected category/subcategory
  const matchedCategoryAds = categoryAds
    .filter(ad => {
      if (!ad.product || ad.product.status !== 'active') return false;
      const matchesCategory = selectedCategory ? ad.product.category_id === selectedCategory : true;
      const matchesSubcategory = selectedSubcategory ? ad.product.subcategory_id === selectedSubcategory : true;
      return matchesCategory && matchesSubcategory;
    })
    .map(ad => ({
      ...ad.product,
      isSponsored: true,
      campaignId: ad.id,
      adScore: parseFloat(ad.base_bid || '1.00') * (ad.quality_score || 1.0)
    }))
    .sort((a, b) => b.adScore - a.adScore);

  // Filter and sort organic products by category, subcategory and recommendation score
  const organicFiltered = products
    .filter((p) => {
      const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
      const matchesSubcategory = selectedSubcategory ? p.subcategory_id === selectedSubcategory : true;
      return matchesCategory && matchesSubcategory;
    })
    .sort((a, b) => {
      const scoreA = getRecommendationScore(a, onboardingData);
      const scoreB = getRecommendationScore(b, onboardingData);
      return scoreB - scoreA;
    });

  // Combine: sponsored ads first (up to max 2), then organic, avoiding duplicates
  const sponsoredIds = new Set(matchedCategoryAds.map(a => a.id));
  const organicWithoutDupes = organicFiltered.filter(p => !sponsoredIds.has(p.id));
  const filteredProducts = [...matchedCategoryAds.slice(0, 2), ...organicWithoutDupes];

  // Track category ads impressions when visible products change
  useEffect(() => {
    filteredProducts.forEach(prod => {
      if ((prod as any).isSponsored && (prod as any).campaignId) {
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/ads/track/impression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: (prod as any).campaignId })
        }).catch(() => {});
      }
    });
  }, [filteredProducts]);

  // Get category icon
  function getCategoryIcon(categoryName: string) {
    const name = categoryName.toLowerCase();
    if (name.includes('ia') || name.includes('ai')) return Bot;
    if (name.includes('programação') || name.includes('code')) return Code2;
    if (name.includes('automação')) return Workflow;
    if (name.includes('marketing')) return Megaphone;
    if (name.includes('saas') || name.includes('cloud')) return Cloud;
    if (name.includes('produtividade')) return Zap;
    if (name.includes('monetização')) return DollarSign;
    if (name.includes('template')) return LayoutDashboard;
    if (name.includes('sistema') || name.includes('database')) return Database;
    if (name.includes('negócio') || name.includes('business')) return Briefcase;
    return Code2;
  }

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 page-wrapper max-w-7xl mx-auto min-h-screen overflow-x-hidden">
      
      {/* Error Message */}
      {error && (
        <div className="mb-8 glass-panel rounded-xl p-6 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400 font-sans text-sm">
            ⚠️ {t('library.errorLoading')} {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Two-level Navigation Content */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          {selectedCategory === null ? (
            <motion.div
              key="category-landing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full"
            >
              <CategorySelector
                dbCategories={categories}
                onCategorySelect={(categoryId) => {
                  setSelectedCategory(categoryId);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="library-catalog-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full flex flex-col gap-6"
            >
              {/* Back button & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 text-xs font-bold text-white hover:text-primary hover:bg-white/10 hover:border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg backdrop-blur-md"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para Categorias
                </button>

                {/* Dropdown Filters (matching main branch style and behavior) */}
                <div className="flex flex-wrap items-center gap-3 z-20">
                  {/* Categories Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoriesDropdown(!showCategoriesDropdown);
                        setShowSubcategoriesDropdown(false);
                      }}
                      className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#050508]/80 border border-white/10 text-xs font-semibold text-white hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        <span>
                          {selectedCategory 
                            ? (products.find((p) => p.category_id === selectedCategory)?.category_name || categories.find(c => c.id === selectedCategory)?.name || 'Categoria') 
                            : 'Todas as Categorias'}
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCategoriesDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowCategoriesDropdown(false)} 
                        />
                        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0a0a0f] border border-white/15 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 max-h-[250px] overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(null);
                              setShowCategoriesDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors ${
                              selectedCategory === null ? 'text-primary bg-primary/10' : 'text-on-surface-variant'
                            }`}
                          >
                            Todas as Categorias ({products.length})
                          </button>
                          {categories.map((category) => {
                            const count = products.filter((p) => p.category_id === category.id).length;
                            const localizedProd = products.find((p) => p.category_id === category.id);
                            const displayCategoryName = (localizedProd as any)?.category_name || category.name;
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(category.id);
                                  setShowCategoriesDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                                  selectedCategory === category.id ? 'text-primary bg-primary/10' : 'text-on-surface-variant'
                                }`}
                              >
                                {displayCategoryName} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Subcategories Dropdown */}
                  {selectedCategory && subcategories.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubcategoriesDropdown(!showSubcategoriesDropdown);
                          setShowCategoriesDropdown(false);
                        }}
                        className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#050508]/80 border border-white/10 text-xs font-semibold text-white hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                      >
                        <span className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-primary" />
                          <span>
                            {selectedSubcategory 
                              ? subcategories.find(s => s.id === selectedSubcategory)?.name 
                              : 'Todos os Nichos'}
                          </span>
                        </span>
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showSubcategoriesDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showSubcategoriesDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setShowSubcategoriesDropdown(false)} 
                          />
                          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0a0a0f] border border-white/15 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 max-h-[250px] overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubcategory(null);
                                setShowSubcategoriesDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors ${
                                selectedSubcategory === null ? 'text-primary bg-primary/10' : 'text-on-surface-variant'
                              }`}
                            >
                              Todos os Nichos
                            </button>
                            {subcategories.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubcategory(sub.id);
                                  setShowSubcategoriesDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                                  selectedSubcategory === sub.id ? 'text-primary bg-primary/10' : 'text-on-surface-variant'
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Catalog content grid */}
              <div id="library-catalog" className="w-full relative z-10 scroll-mt-24">

                  {filteredProducts.length === 0 ? (
                    <div className="glass-panel rounded-xl p-12 text-center">
                      <p className="font-sans text-lg text-on-surface-variant">
                        {selectedCategory
                          ? t('library.noProducts')
                          : t('library.noProductsGeneral')}
                      </p>
                      <p className="font-sans text-sm text-on-surface-variant/60 mt-2">
                        {t('library.comingSoon')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => {
                        const category = categories.find((c) => c.id === product.category_id);
                        
                        return (
                          <article
                            key={product.id}
                            onClick={() => {
                              if ((product as any).isSponsored && (product as any).campaignId) {
                                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/ads/track/click`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ campaignId: (product as any).campaignId })
                                }).catch(() => {});
                              }
                              onProductClick ? onProductClick(product.id) : setScreen('product');
                            }}
                            onMouseEnter={() => prefetchProduct(product.id, locale)}
                            className="glass-card glass-card-hover rounded-xl p-3 relative group flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-primary/20 bg-surface/50 border border-white/5 min-h-[300px] h-full text-left"
                          >
                            <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
                            
                            {/* Product Image */}
                            <div className="h-[135px] w-full rounded-lg mb-2 overflow-hidden relative bg-black/40 flex items-center justify-center shrink-0">
                              <LazyImage
                                src={getProductCoverUrl(product)}
                                alt={product.title}
                                className="max-w-full max-h-full object-contain"
                                fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                              />
                              
                              {/* Favorite Button */}
                              {user && (
                                <div className="absolute top-2 left-2 z-10">
                                  <FavoriteButton
                                    isFavorite={isFavorite(product.id)}
                                    onToggle={(e) => {
                                      e?.stopPropagation();
                                      toggleFavorite(product.id);
                                    }}
                                    size="sm"
                                  />
                                </div>
                              )}
                              
                              <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                                {product.isSponsored && (
                                  <span className="bg-primary text-black border border-primary/20 px-2 py-0.5 rounded-full font-display text-[8px] font-black tracking-widest uppercase shadow shadow-primary/20">
                                    Patrocinado
                                  </span>
                                )}
                                {isOwned(product.id) && (
                                  <span className="bg-green-500/20 border border-green-400/40 text-green-300 px-2 py-0.5 rounded-full font-display text-[8px] font-semibold tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-green-500/20">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    {tCommon('product.ownedBadge')}
                                  </span>
                                )}
                                {product.is_free && (
                                  <span className="bg-green-500/20 border border-green-400/40 text-green-300 px-2 py-0.5 rounded-full font-display text-[8px] font-semibold tracking-widest uppercase">
                                    {t('library.free')}
                                  </span>
                                )}
                                {product.product_type && product.product_type !== 'file' && (
                                  <span className="bg-primary/20 border border-primary/40 text-primary px-2 py-0.5 rounded-full font-display text-[8px] font-semibold tracking-widest uppercase">
                                    {product.product_type === 'course' ? t('library.course') : t('library.ebook')}
                                  </span>
                                )}
                                {category && (
                                  <span className="bg-surface/50 backdrop-blur-md border border-white/20 text-on-surface px-2 py-0.5 rounded-full font-display text-[8px] font-semibold tracking-widest uppercase shadow">
                                    {(product as any).category_name || category.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="px-1 pb-1 flex-grow flex flex-col z-10 relative">
                              {/* Creator Row */}
                              <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1.5">
                                {product.collaborator ? (
                                  <>
                                    {product.collaborator.members?.profile_data?.avatar_url ? (
                                      <img
                                        src={product.collaborator.members.profile_data.avatar_url}
                                        alt={product.collaborator.display_name}
                                        className="w-3.5 h-3.5 rounded-full object-cover border border-white/20"
                                      />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                        <User className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                    <span className="text-[9px] font-bold text-white tracking-wide truncate max-w-[120px]">
                                      {product.collaborator.display_name}
                                    </span>
                                    {product.collaborator.plan === 'course_creator' && (
                                      <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full p-0.5" title="Membro Pro">
                                        <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                      <ShieldCheck className="w-2 h-2 text-primary" />
                                    </div>
                                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                                      Oficial CodeEngine
                                    </span>
                                  </>
                                )}
                              </div>

                              <h2 className="font-display text-sm sm:text-base font-bold text-white mb-1.5 line-clamp-2 min-h-[2.25rem] group-hover:text-primary group-active:text-primary transition-colors break-words leading-snug">
                                {product.title}
                              </h2>
                              <p className="font-sans text-xs text-on-surface-variant/80 line-clamp-2 mb-3 flex-grow break-words leading-normal">
                                {product.description}
                              </p>

                              {/* Tags */}
                              {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {product.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-on-surface-variant"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Price and CTA */}
                              <div className="flex items-center justify-between mt-auto w-full gap-2.5 pt-2 border-t border-white/5">
                                <span className="font-mono text-sm sm:text-base font-semibold text-primary tracking-tight drop-shadow-[0_0_8px_rgba(192,193,255,0.3)] break-all min-w-0">
                                  {product.is_free ? t('library.free') : 
                                    isAngola 
                                      ? `Kz ${Number(product.aoa_price || product.aoaPrice || Math.round(product.price * 920)).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`
                                      : `$ ${product.price}`}
                                </span>
                                {isOwned(product.id) ? (
                                  <div className="px-3 py-1.5 rounded-full font-display text-[9px] font-bold tracking-wider uppercase bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center gap-1.5 transition-all">
                                    <CheckCircle className="w-3 h-3" />
                                    {tCommon('product.alreadyOwned')}
                                  </div>
                                ) : product.is_free ? (
                                  <div className="px-3 py-1.5 rounded-full font-display text-[9px] font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1 transition-all">
                                    Acesso Livre
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <button className="secondary-btn px-3 py-1.5 rounded-full font-display text-[9px] font-semibold tracking-wider uppercase flex items-center gap-1 group-hover:bg-white/10 group-hover:border-primary/50 group-active:bg-white/10 group-active:border-primary/50 text-white transition-all shrink-0">
                                    {product.cta_text || 'Comprar'}{' '}
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 group-active:translate-x-0.5 transition-transform" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
