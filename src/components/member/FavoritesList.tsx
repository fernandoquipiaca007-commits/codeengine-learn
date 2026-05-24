import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/store';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoritesListProps {
  memberId: string;
  onViewProduct: (productId: string) => void;
}

export function FavoritesList({ memberId, onViewProduct }: FavoritesListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get favorites hook
  const { favorites, loading: favLoading, toggleFavorite } = useFavorites(user?.id);

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Load products when favorites change
  useEffect(() => {
    if (favorites.length > 0) {
      loadProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favorites]);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites)
        .eq('status', 'active');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFavorite(productId: string) {
    setRemovingId(productId);
    try {
      await toggleFavorite(productId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading || favLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Meus Favoritos
        </h2>
        <p className="font-sans text-base text-on-surface-variant">
          {products.length} {products.length === 1 ? 'produto favoritado' : 'produtos favoritados'}
        </p>
      </div>

      {/* Favorites List */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-12 text-center border border-white/10"
        >
          <Heart className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            Nenhum favorito ainda
          </h3>
          <p className="font-sans text-base text-on-surface-variant mb-6">
            Adicione produtos aos favoritos para acessá-los rapidamente aqui.
          </p>
          <button
            onClick={() => onViewProduct('')}
            className="secondary-btn px-6 py-3 rounded-lg font-display text-sm font-semibold tracking-widest uppercase inline-flex items-center gap-2"
          >
            Explorar Produtos
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all group relative"
            >
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFavorite(product.id)}
                disabled={removingId === product.id}
                className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 hover:border-red-400/50 transition-all opacity-0 group-hover:opacity-100"
                title="Remover dos favoritos"
              >
                {removingId === product.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              {/* Product Image */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-highest mb-4 relative cursor-pointer" onClick={() => onViewProduct(product.id)}>
                <img
                  src={product.cover_url}
                  alt={product.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Product';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>

                {/* Favorite Badge */}
                <div className="absolute top-3 left-3 bg-surface/80 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 flex items-center gap-2">
                  <Heart className="w-3 h-3 text-red-400 fill-current" />
                  <span className="font-display text-[10px] font-semibold tracking-widest uppercase text-white">
                    Favorito
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 cursor-pointer" onClick={() => onViewProduct(product.id)}>
                  {product.title}
                </h3>

                <p className="font-sans text-sm text-on-surface-variant line-clamp-2">
                  {product.description}
                </p>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded-md font-mono text-xs text-on-surface-variant"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="font-mono text-lg font-medium text-primary tracking-tight drop-shadow-[0_0_8px_rgba(192,193,255,0.3)]">
                    $ {product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onViewProduct(product.id)}
                    className="secondary-btn px-4 py-2 rounded-full font-display text-xs font-semibold tracking-widest uppercase flex items-center gap-2 hover:bg-white/10 transition-all"
                  >
                    Ver Detalhes
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
