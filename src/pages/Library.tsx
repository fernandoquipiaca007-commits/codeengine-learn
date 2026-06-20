import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Bot, Code2, Workflow, Megaphone, Cloud, Zap, DollarSign, LayoutDashboard, Database, Briefcase, CheckCircle, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';
import { useOwnedProducts } from '../hooks/useOwnedProducts';
import { FavoriteButton } from '../components/FavoriteButton';
import { fetchLocalizedProducts, LocalizedProduct } from '../hooks/useLocalizedProduct';
import { useLocale } from '../contexts/LocaleContext';
import { usePoints } from '../hooks/usePoints';
import { canViewProduct } from '../lib/product-visibility';
import { getProductCoverUrl } from '../lib/storage-path';
import { useTranslation } from 'react-i18next';
import { useAuthSession } from '../hooks/useAuthSession';
import { LazyImage } from '../components/ui/LazyImage';
import { queryCache } from '../lib/queryCache';
import { prefetchProduct } from '../lib/prefetch';
import { formatProductPrice } from '../lib/safe-display';


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
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showSubcategoriesDropdown, setShowSubcategoriesDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
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
      setSelectedSubcategory(null);
    }
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
    <div className="pt-28 pb-32 px-4 sm:px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen overflow-x-hidden page-wrapper">
      {/* Header Section */}
      <header className="mb-12 sm:mb-16 md:mb-24 flex flex-col items-start max-w-full">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
          {t('library.heading')}
        </h1>
        <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl">
          {t('library.subtitle')}
        </p>
      </header>

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
        <div className="relative z-10 animate__animated animate__fadeIn">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8 z-20">
            {/* Categories Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCategoriesDropdown(!showCategoriesDropdown);
                  setShowSubcategoriesDropdown(false);
                }}
                className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface/80 border border-white/10 text-xs font-semibold text-white hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
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
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-surface-high border border-white/15 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 animate-in fade-in slide-in-from-top-1 duration-200 max-h-[250px] overflow-y-auto">
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
                  className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface/80 border border-white/10 text-xs font-semibold text-white hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]"
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
                    <div className="absolute left-0 mt-2 w-64 rounded-xl bg-surface-high border border-white/15 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 animate-in fade-in slide-in-from-top-1 duration-200 max-h-[250px] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      <div className="aspect-[4/3] rounded-xl mb-4 overflow-hidden relative bg-surface-highest">
                        <LazyImage
                          src={getProductCoverUrl(product)}
                          alt={product.title}
                          className="object-cover w-full h-full"
                          fallback={`https://placehold.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                        
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
                      <div className="px-4 pb-6 flex-grow flex flex-col z-10 relative">
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto w-full gap-3">
                          <span className="font-mono text-base sm:text-lg font-medium text-primary tracking-tight drop-shadow-[0_0_8px_rgba(192,193,255,0.3)] min-w-0 sm:text-left text-center block sm:inline">
                            {product.is_free ? t('library.free') : formatProductPrice(product.price, product.aoa_price)}
                          </span>
                          {isOwned(product.id) ? (
                            <div className="w-full sm:w-auto px-4 py-2 rounded-full font-display text-[10px] font-bold tracking-wider uppercase bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center justify-center gap-1.5 transition-all text-center">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {tCommon('product.alreadyOwned')}
                            </div>
                          ) : product.is_free ? (
                            <div className="w-full sm:w-auto px-4 py-2 rounded-full font-display text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1 transition-all text-center">
                              Acesso Livre
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <button className="w-full sm:w-auto secondary-btn px-4 py-2.5 rounded-full font-display text-[10px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 group-hover:bg-white/10 group-hover:border-primary/50 group-active:bg-white/10 group-active:border-primary/50 text-white transition-all text-center break-words whitespace-normal leading-tight">
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
      )}
    </div>
  );
}
