import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Bot, Code2, Workflow, Megaphone, Cloud, Zap, DollarSign, LayoutDashboard, Database, Briefcase, CheckCircle, ShieldCheck, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthSession();
  const { locale } = useLocale();
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

  // Filter products by category and subcategory
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSubcategory = selectedSubcategory ? p.subcategory_id === selectedSubcategory : true;
    return matchesCategory && matchesSubcategory;
  });

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
      {/* Header Section */}
      <header className="mb-4 sm:mb-5 flex flex-col items-start max-w-full">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl leading-[1.08] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-2">
          {t('library.heading')}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-xl">
          {t('library.subtitle')}
        </p>
      </header>

      {/* Category Feature Cards Section */}
      {!loading && !error && (
        <div className="mb-12 sm:mb-16">
          <CategorySelector
            dbCategories={categories}
            onCategorySelect={(categoryId) => {
              setSelectedCategory(categoryId);
              // Scroll smoothly to the catalog list
              setTimeout(() => {
                const element = document.getElementById('library-catalog');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          />
        </div>
      )}

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

      {/* Content */}
      {!loading && (
        <div id="library-catalog" className="flex flex-col lg:flex-row gap-6 relative z-10 scroll-mt-24">
          {/* Sidebar */}
          <aside className="lg:w-52 flex-shrink-0">
            <div className="glass-panel rounded-xl p-4 mb-4 lg:mb-0 lg:sticky lg:top-20">
              <h3 className="font-display text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-3 pb-3 border-b border-white/8">
                {t('library.categories')}
              </h3>
              <ul className="flex flex-wrap gap-1.5 sm:flex-col sm:gap-0.5">
                {/* All Categories */}
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-sans text-sm font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> {t('library.all')} ({products.length})
                  </button>
                </li>

                {/* Dynamic Categories */}
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  const count = products.filter((p) => p.category_id === category.id).length;
                  const localizedProd = products.find((p) => p.category_id === category.id);
                  const displayCategoryName = (localizedProd as any)?.category_name || category.name;
                  
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory(category.id);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-sans text-sm transition-all ${
                          selectedCategory === category.id
                            ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                            : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" /> {displayCategoryName} ({count})
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            {/* Subcategories Filter Bar */}
            {subcategories.length > 0 && (
              <div className="rounded-xl p-2.5 mb-5 flex flex-wrap gap-1.5 items-center border border-white/8 bg-surface-container/50 backdrop-blur-sm">
                <span className="font-display text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/50 px-2 py-1">
                  Filtrar:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                  onClick={() => setSelectedSubcategory(null)}
                    className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium uppercase tracking-wider transition-all duration-200 border ${
                      selectedSubcategory === null
                        ? 'bg-primary/15 text-primary border-primary/25'
                        : 'text-on-surface-variant border-transparent hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    Todas
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategory(sub.id)}
                      className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium uppercase tracking-wider transition-all duration-200 border ${
                        selectedSubcategory === sub.id
                          ? 'bg-primary/15 text-primary border-primary/25'
                          : 'text-on-surface-variant border-transparent hover:bg-white/5 hover:text-on-surface'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                      onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
                      onMouseEnter={() => prefetchProduct(product.id, locale)}
                      className="glass-card glass-card-hover rounded-2xl p-2 relative group flex flex-col cursor-pointer"
                    >
                      <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
                      
                      {/* Product Image */}
                      <div className="aspect-[4/3] rounded-xl mb-2 overflow-hidden relative bg-black/40 flex items-center justify-center">
                        <LazyImage
                          src={getProductCoverUrl(product)}
                          alt={product.title}
                          className="max-w-full max-h-full object-contain"
                          fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                        />
                        
                        {/* Favorite Button */}
                        {user && (
                          <div className="absolute top-4 left-4 z-10">
                            <FavoriteButton
                              isFavorite={isFavorite(product.id)}
                              onToggle={() => toggleFavorite(product.id)}
                              size="md"
                            />
                          </div>
                        )}
                        
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                          {isOwned(product.id) && (
                            <span className="bg-green-500/20 border border-green-400/40 text-green-300 px-3 py-1 rounded-full font-display text-[10px] font-semibold tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-green-500/20">
                              <CheckCircle className="w-3 h-3" />
                              {tCommon('product.ownedBadge')}
                            </span>
                          )}
                          {product.is_free && (
                            <span className="bg-green-500/20 border border-green-400/40 text-green-300 px-2 py-0.5 rounded-full font-display text-[10px] font-semibold tracking-widest uppercase">
                              {t('library.free')}
                            </span>
                          )}
                          {product.product_type && product.product_type !== 'file' && (
                            <span className="bg-primary/20 border border-primary/40 text-primary px-2 py-0.5 rounded-full font-display text-[10px] font-semibold tracking-widest uppercase">
                              {product.product_type === 'course' ? t('library.course') : t('library.ebook')}
                            </span>
                          )}
                          {category && (
                            <span className="bg-surface/50 backdrop-blur-md border border-white/20 text-on-surface px-3 py-1 rounded-full font-display text-[10px] font-semibold tracking-widest uppercase shadow-lg shadow-black/50">
                              {(product as any).category_name || category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="px-3 pb-3 flex-grow flex flex-col z-10 relative">
                        {/* Creator Row */}
                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2.5">
                          {product.collaborator ? (
                            <>
                              {product.collaborator.members?.profile_data?.avatar_url ? (
                                <img
                                  src={product.collaborator.members.profile_data.avatar_url}
                                  alt={product.collaborator.display_name}
                                  className="w-4 h-4 rounded-full object-cover border border-white/20"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                  <User className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-[120px]">
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
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                              </div>
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                Oficial CodeEngine
                              </span>
                            </>
                          )}
                        </div>

                        <h2 className="font-display text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2 min-h-[2.75rem] group-hover:text-primary group-active:text-primary transition-colors break-words">
                          {product.title}
                        </h2>
                        <p className="font-sans text-sm sm:text-base text-on-surface-variant/80 line-clamp-2 mb-4 flex-grow break-words">
                          {product.description}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {product.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded-md font-mono text-xs text-on-surface-variant"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price and CTA */}
                        <div className="flex flex-wrap items-center justify-between mt-auto w-full gap-3">
                          <span className="font-mono text-base sm:text-lg font-medium text-primary tracking-tight drop-shadow-[0_0_8px_rgba(192,193,255,0.3)] break-all min-w-0">
                            {product.is_free ? t('library.free') : 
                              isAngola 
                                ? `Kz ${Number(product.aoa_price || product.aoaPrice || Math.round(product.price * 920)).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`
                                : `$ ${product.price}`}
                          </span>
                          {isOwned(product.id) ? (
                            <div className="px-4 py-2 rounded-full font-display text-[10px] font-bold tracking-wider uppercase bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center gap-1.5 transition-all">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {tCommon('product.alreadyOwned')}
                            </div>
                          ) : product.is_free ? (
                            <div className="px-4 py-2 rounded-full font-display text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1 transition-all">
                              Acesso Livre
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <button className="secondary-btn px-4 py-2.5 rounded-full font-display text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 group-hover:bg-white/10 group-hover:border-primary/50 group-active:bg-white/10 group-active:border-primary/50 text-white transition-all shrink-0">
                              {product.cta_text || 'Comprar'}{' '}
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-active:translate-x-0.5 transition-transform" />
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
        </div>
      )}
    </div>
  );
}
