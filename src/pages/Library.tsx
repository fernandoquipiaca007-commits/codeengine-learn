import { useState, useEffect } from 'react';
import { ArrowRight, Bot, Code2, Workflow, Megaphone, Cloud, Zap, DollarSign, LayoutDashboard, Database, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/store';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteButton } from '../components/FavoriteButton';
import { fetchLocalizedProducts } from '../hooks/useLocalizedProduct';
import { useLocale } from '../contexts/LocaleContext';
import { getProductCoverUrl } from '../lib/storage-path';
import { useTranslation } from 'react-i18next';

export function Library({ setScreen, onProductClick }: { 
  setScreen: (s: string) => void;
  onProductClick?: (productId: string) => void;
}) {
  const { t } = useTranslation('pages');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { locale } = useLocale();

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

  // Load products and categories
  useEffect(() => {
    loadData();
  }, []);

  // Setup realtime subscription for products
  useEffect(() => {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          console.log('New product:', payload.new);
          if ((payload.new as Product).status === 'active') {
            setProducts((prev) => [payload.new as Product, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Updated product:', payload.new);
          const updatedProduct = payload.new as Product;
          if (updatedProduct.status === 'active') {
            setProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
          } else {
            // Remove if no longer active
            setProducts((prev) => prev.filter((p) => p.id !== updatedProduct.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Deleted product:', payload.old);
          setProducts((prev) => prev.filter((p) => p.id !== (payload.old as Product).id));
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const localized = await fetchLocalizedProducts(locale, 'active');
      setProducts(localized as Product[]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

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
    <div className="pt-28 pb-32 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden page-wrapper">
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
        <div className="flex flex-col lg:flex-row gap-10 relative z-10">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass-panel rounded-xl p-6 mb-6 lg:mb-0 lg:sticky lg:top-28">
              <h3 className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-4 pb-4 border-b border-white/10">
                {t('library.categories')}
              </h3>
              <ul className="flex flex-wrap gap-2 sm:flex-col sm:gap-1">
                {/* All Categories */}
                <li>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-sans text-base font-semibold transition-all ${
                      selectedCategory === null
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" /> {t('library.all')} ({products.length})
                  </button>
                </li>

                {/* Dynamic Categories */}
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  const count = products.filter((p) => p.category_id === category.id).length;
                  
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory(category.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-sans text-base transition-all ${
                          selectedCategory === category.id
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(192,193,255,0.1)] font-semibold'
                            : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                        }`}
                      >
                        <Icon className="w-5 h-5" /> {category.name} ({count})
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
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
                      className="glass-card glass-card-hover rounded-2xl p-2 relative group flex flex-col cursor-pointer"
                    >
                      <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
                      
                      {/* Product Image */}
                      <div className="aspect-[4/3] rounded-xl mb-4 overflow-hidden relative bg-surface-highest">
                        <img
                          src={getProductCoverUrl(product)}
                          alt={product.title}
                          className="object-cover w-full h-full opacity-80 group-hover:scale-110 transition-transform duration-1000 ease-out"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`;
                          }}
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
                              {category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="px-4 pb-6 flex-grow flex flex-col z-10 relative">
                        <h2 className="font-display text-2xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </h2>
                        <p className="font-sans text-base text-on-surface-variant/80 line-clamp-2 mb-6 flex-grow">
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
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-mono text-xl font-medium text-primary tracking-tight drop-shadow-[0_0_8px_rgba(192,193,255,0.3)]">
                            {product.is_free ? t('library.free') : `R$ ${product.price.toFixed(2)}`}
                          </span>
                          <button className="secondary-btn px-5 py-2.5 rounded-full font-display text-xs font-semibold tracking-widest uppercase flex items-center gap-2 group-hover:bg-white/10 group-hover:border-primary/50">
                            {product.cta_text}{' '}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
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
