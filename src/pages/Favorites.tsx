import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Trash2, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/store';

interface FavoritesProps {
  setScreen: (screen: string) => void;
}

interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
  product: Product;
}

export function Favorites({ setScreen }: FavoritesProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setScreen('auth');
      return;
    }
    setUser(session.user);
    loadFavorites(session.user.id);
  }

  async function loadFavorites(userId: string) {
    try {
      // Note: This assumes favorites table exists
      // You'll need to create it first
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          created_at,
          product:products(*)
        `)
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      } else {
        const mapped = (data || []).map((fav: any) => {
          const product = Array.isArray(fav.product) ? fav.product[0] : fav.product;
          return {
            ...fav,
            product
          };
        }).filter(fav => fav.product);
        setFavorites(mapped as any);
      }
    } catch (error) {
      console.error('Error:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(favoriteId: string) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="pt-24 pb-12 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen">
      {/* Hero Section */}
      <header className="mb-10 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              Meus Favoritos
            </span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            Conteúdos Salvos
          </h1>
          
          <p className="font-sans text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            Seus conteúdos favoritos em um só lugar. Salve, organize e acesse quando quiser.
          </p>
        </motion.div>
      </header>

      {/* Stats Bar */}
      {!loading && favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="font-display text-sm font-semibold text-white">
                  {favorites.length} {favorites.length === 1 ? 'Favorito' : 'Favoritos'}
                </p>
                <p className="font-sans text-xs text-on-surface-variant">
                  Conteúdos salvos para depois
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setScreen('library')}
              className="font-display text-xs font-semibold tracking-widest uppercase text-primary hover:text-white transition-colors"
            >
              Explorar Mais
            </button>
          </div>
        </motion.div>
      )}

      {/* Favorites Grid */}
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
      ) : favorites.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {favorites.map((favorite, index) => (
            <motion.article
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden relative group"
            >
              <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
              
              {/* Remove Button */}
              <button
                onClick={() => removeFavorite(favorite.id)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-xl flex items-center justify-center hover:bg-red-500/30 transition-all group/btn"
              >
                <Trash2 className="w-5 h-5 text-red-400 group-hover/btn:scale-110 transition-transform" />
              </button>
              
              {/* Cover Image */}
              <div 
                onClick={() => setScreen('product')}
                className="relative w-full h-64 overflow-hidden cursor-pointer"
              >
                <img
                  src={favorite.product.cover_url}
                  alt={favorite.product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Date Added */}
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                  <span className="font-sans text-xs text-on-surface-variant">
                    Salvo em {formatDate(favorite.created_at)}
                  </span>
                </div>
                
                {/* Title */}
                <h3 
                  onClick={() => setScreen('product')}
                  className="font-display text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
                >
                  {favorite.product.title}
                </h3>
                
                {/* Description */}
                <p className="font-sans text-sm text-on-surface-variant mb-4 line-clamp-2">
                  {favorite.product.description}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl font-bold text-primary">
                    $ {favorite.product.price}
                  </div>
                  
                  <button 
                    onClick={() => setScreen('product')}
                    className="flex items-center gap-2 font-display text-xs font-semibold tracking-widest uppercase text-primary group-hover:gap-3 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-primary" />
          </div>
          <h3 className="font-display text-3xl font-semibold text-white mb-4">
            Nenhum Favorito Ainda
          </h3>
          <p className="font-sans text-lg text-on-surface-variant mb-8 max-w-md mx-auto">
            Comece a salvar seus conteúdos favoritos para acessá-los facilmente depois.
          </p>
          <button
            onClick={() => setScreen('library')}
            className="font-display text-sm font-semibold tracking-widest uppercase px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all duration-300 inline-flex items-center gap-3"
          >
            Explorar Biblioteca
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Tips Section */}
      {favorites.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-24"
        >
          <div className="glass-panel rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(192,193,255,0.2)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                💡 Dica Pro
              </h2>
              <p className="font-sans text-lg text-on-surface-variant">
                Seus favoritos são sincronizados automaticamente em todos os seus dispositivos. 
                Salve agora, acesse de qualquer lugar!
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
