import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { downloadProduct } from '../../lib/download-file';
import { useLocale } from '../../contexts/LocaleContext';
import { useTranslation } from 'react-i18next';
import { getProductCoverUrl, getProductFilePath } from '../../lib/storage-path';

interface ProductDownload {
  id: string;
  title: string;
  cover_url: string;
  cover_storage_path: string | null;
  storage_url: string;
  file_storage_path: string | null;
  purchase_date: string;
  last_download?: string;
  download_count: number;
}

interface DownloadListProps {
  memberId: string;
}

export function DownloadList({ memberId }: DownloadListProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('member');
  const [products, setProducts] = useState<ProductDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadPurchasedProducts();
  }, [memberId]);

  async function loadPurchasedProducts() {
    setLoading(true);
    try {
      // Get all completed purchases with product details
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          purchase_date,
          product_id,
          products (
            id,
            title,
            cover_url,
            cover_storage_path,
            storage_url,
            file_storage_path
          )
        `)
        .eq('member_id', memberId)
        .in('payment_status', ['completed', 'pending'])
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Get download stats for each product
      const productsWithStats = await Promise.all(
        (purchases || [])
          .filter((purchase: any) => {
            const prod = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
            return prod?.id;
          })
          .map(async (purchase: any) => {
            const product = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
            const { data: downloads } = await supabase
              .from('downloads')
              .select('download_timestamp')
              .eq('member_id', memberId)
              .eq('product_id', product.id)
              .order('download_timestamp', { ascending: false });

            return {
              id: product.id,
              title: product.title,
              cover_url: product.cover_url,
              cover_storage_path: product.cover_storage_path,
              storage_url: product.storage_url,
              file_storage_path: product.file_storage_path,
              purchase_date: purchase.purchase_date,
              last_download: downloads?.[0]?.download_timestamp,
              download_count: downloads?.length || 0,
            };
          })
      );

      setProducts(productsWithStats);
    } catch (error) {
      console.error('Error loading purchased products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(productId: string) {
    setDownloadingId(productId);
    try {
      await downloadProduct(productId, locale);
      await loadPurchasedProducts();
    } catch (error) {
      console.error('Error downloading product:', error);
      alert(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function getTimeSinceDownload(dateString?: string) {
    if (!dateString) return null;

    const now = new Date();
    const downloadDate = new Date(dateString);
    const diffMs = now.getTime() - downloadDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Há menos de 1 hora';
    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }

  if (loading) {
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
          Meus Downloads
        </h2>
        <p className="font-sans text-base text-on-surface-variant">
          {products.length} {products.length === 1 ? 'produto disponível' : 'produtos disponíveis'} para download
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4 border border-primary/30 bg-primary/5"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm text-on-surface">
              <span className="font-semibold">Acesso vitalício:</span> Você pode baixar seus produtos quantas vezes quiser, sem limite de tempo.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Products List */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-12 text-center border border-white/10"
        >
          <Download className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            Nenhum produto disponível
          </h3>
          <p className="font-sans text-base text-on-surface-variant">
            Você ainda não comprou nenhum produto. Explore nossa biblioteca!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-all group"
            >
              {/* Product Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-surface-highest mb-4 relative">
                <img
                  src={getProductCoverUrl(product)}
                  alt={product.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/400x225?text=Produto';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
              </div>

              {/* Info */}
              <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                {product.title}
              </h3>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-sans text-on-surface-variant">Comprado em:</span>
                  <span className="font-mono text-on-surface">{formatDate(product.purchase_date)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-sans text-on-surface-variant">Downloads:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-mono text-on-surface">{product.download_count}x</span>
                  </div>
                </div>

                {product.last_download && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-sans text-on-surface-variant">Último download:</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-on-surface-variant" />
                      <span className="font-sans text-on-surface-variant text-xs">
                        {getTimeSinceDownload(product.last_download)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(product.id)}
                disabled={downloadingId === product.id}
                className="w-full bg-primary text-on-primary font-display text-sm font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,193,255,0.3)] hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {downloadingId === product.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    Baixar Produto
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
