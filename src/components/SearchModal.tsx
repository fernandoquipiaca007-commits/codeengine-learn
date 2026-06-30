import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_url: string;
  category_id: string;
  created_at: string;
  isSponsored?: boolean;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string, productId?: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadRecentSearches();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const debounce = setTimeout(() => {
        searchProducts(query);
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
    }
  }, [query]);

  function loadRecentSearches() {
    const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  }

  function saveRecentSearch(searchQuery: string) {
    const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    const updated = [searchQuery, ...recent.filter((q: string) => q !== searchQuery)].slice(0, 10);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }

  async function searchProducts(searchQuery: string) {
    setLoading(true);
    try {
      // 1. Fetch active search boost campaigns
      const { data: ads } = await supabase
        .from('ad_campaigns')
        .select('*, product:products(*)')
        .eq('status', 'active')
        .eq('placement', 'search_boost');

      // Filter matched ads and calculate scores
      const matchedAds = (ads || [])
        .filter((ad: any) => {
          if (!ad.product || ad.product.status !== 'active') return false;
          const matchTitle = ad.product.title?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchDesc = ad.product.description?.toLowerCase().includes(searchQuery.toLowerCase());
          return matchTitle || matchDesc;
        })
        .map((ad: any) => {
          const bid = parseFloat(ad.base_bid || '1.00');
          const score = bid * (ad.quality_score || 1.0);
          return {
            ...ad.product,
            isSponsored: true,
            campaignId: ad.id,
            adScore: score
          };
        })
        .sort((a: any, b: any) => b.adScore - a.adScore);

      // 2. Fetch organic results
      const { data: organic, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Filter organic results to remove duplicates
      const sponsoredIds = new Set(matchedAds.map((a: any) => a.id));
      const organicFiltered = (organic || []).filter((p: any) => !sponsoredIds.has(p.id));

      // Combine results: sponsored at the top
      const combined = [...matchedAds, ...organicFiltered].slice(0, 10);
      setResults(combined);

      // Track impressions (fire-and-forget)
      combined.forEach(prod => {
        if (prod.isSponsored && prod.campaignId) {
          fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud'}/api/ads/track/impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: prod.campaignId })
          }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('Error searching products:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectProduct(product: Product) {
    saveRecentSearch(query);
    if ((product as any).isSponsored && (product as any).campaignId) {
      // Track click (fire-and-forget)
      fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud'}/api/ads/track/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: (product as any).campaignId })
      }).catch(() => {});
    }
    onNavigate('product', product.id);
    onClose();
  }

  function handleRecentSearch(searchQuery: string) {
    setQuery(searchQuery);
    searchProducts(searchQuery);
  }

  function clearRecentSearches() {
    localStorage.removeItem('recent_searches');
    setRecentSearches([]);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center p-0 sm:pt-20 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative h-screen w-full max-w-2xl overlay-premium rounded-none shadow-[0_0_60px_rgba(192,193,255,0.3)] overflow-hidden sm:h-auto sm:rounded-2xl"
        >
          {/* Search Input */}
          <div className="p-4 sm:p-6 border-b border-white/15 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6 text-primary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="flex-1 bg-transparent text-white font-sans text-base sm:text-lg placeholder-on-surface-variant focus:outline-none"
              />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[calc(100vh-92px)] overflow-y-auto sm:max-h-[500px]">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="font-sans text-sm text-on-surface-variant">{t('search.searching')}</p>
              </div>
            ) : query.length >= 2 && results.length > 0 ? (
              <div className="p-4 space-y-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group text-left"
                  >
                    <img
                      src={product.cover_url}
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-semibold text-white group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                        <span>{product.title}</span>
                        {product.isSponsored && (
                          <span className="inline-flex items-center px-1.5 py-0.25 rounded text-[8px] font-semibold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider flex-shrink-0">
                            Patrocinado
                          </span>
                        )}
                      </h3>
                      <p className="font-sans text-xs text-on-surface-variant truncate mt-1">
                        {product.description}
                      </p>
                      <p className="font-display text-sm font-bold text-primary mt-1">
                        $ {product.price}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : query.length >= 2 && results.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {t('search.noResults')}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant">
                  {t('search.tryOtherKeywords')}
                </p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-on-surface-variant" />
                    <h3 className="font-display text-sm font-semibold text-white">
                      {t('search.recentSearches')}
                    </h3>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="font-sans text-xs text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {t('actions.clear')}
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearch(search)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all group text-left"
                    >
                      <Clock className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <span className="font-sans text-sm text-on-surface group-hover:text-primary transition-colors">
                        {search}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {t('search.startSearching')}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant">
                  {t('search.minCharacters')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
