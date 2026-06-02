import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Star, Lock, Play, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product as ProductType } from '../types/store';
import { ProductFAQ } from '../components/product/ProductFAQ';
import { ProductBonuses } from '../components/product/ProductBonuses';
import { ProductBenefits } from '../components/product/ProductBenefits';
import { ProductCustomSections } from '../components/product/ProductCustomSections';
import { ProductVideo } from '../components/product/ProductVideo';
import { CouponInput } from '../components/product/CouponInput';
import { CampaignBanner } from '../components/product/CampaignBanner';
import { ProductActionButton } from '../components/ProductActionButton';
import { CourseCurriculum } from '../components/product/CourseCurriculum';
import { parseJsonField, safePrice, safeText } from '../lib/safe-display';
import { parsePageLayoutConfig, isSectionEnabled, type PageLayoutConfig } from '../lib/page-layout';
import { resolveContentLocale } from '../lib/content-locale';
import { useLocale } from '../contexts/LocaleContext';
import { ProductPurchaseProvider, useProductPurchaseOptional } from '../contexts/ProductPurchaseContext';
import { getProductCoverUrl } from '../lib/storage-path';
import { ReferralProgress } from '../components/referral/ReferralProgress';
import { ReferralShareCard } from '../components/referral/ReferralShareCard';
import { useAuthSession } from '../hooks/useAuthSession';
import { useOwnedProducts } from '../hooks/useOwnedProducts';
import { queryCache } from '../lib/queryCache';


interface ProductProps {
  setScreen?: (screen: string, section?: string) => void;
  productId?: string | null;
}

function hasCopy(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const TRANSLATIONS = {
  pt: {
    before: 'Antes:',
    now: 'Agora:'
  },
  en: {
    before: 'Before:',
    now: 'Now:'
  },
  fr: {
    before: 'Avant:',
    now: 'Maintenant:'
  }
};

interface ProductCouponSectionProps {
  productId: string;
  originalPrice: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
}

function ProductCouponSection({ productId, originalPrice, onCouponApplied }: ProductCouponSectionProps) {
  const purchase = useProductPurchaseOptional();
  const ownsProduct = purchase?.ownsProduct ?? false;

  if (ownsProduct) return null;

  return (
    <CouponInput
      productId={productId}
      originalPrice={originalPrice}
      onCouponApplied={onCouponApplied}
    />
  );
}

export function Product({ setScreen, productId }: ProductProps) {
  const { locale, isLoading: localeLoading } = useLocale();
  const currentLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const tDict = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  const [product, setProduct] = useState<ProductType | null>(null);
  const [customCopy, setCustomCopy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [pageLayout, setPageLayout] = useState<PageLayoutConfig | null>(null);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [childRefreshKey, setChildRefreshKey] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const prevLocaleRef = useRef(locale);
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthSession();
  const { isOwned } = useOwnedProducts(user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProduct = useCallback(
    async (silent = false, revalidate = true) => {
      if (!silent) setLoading(true);
      try {
        const fetcher = async () => {
          let data: ProductType | null = null;

          if (productId) {
            const active = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .eq('status', 'active')
              .maybeSingle();

            if (active.error) {
              console.error('Error loading product:', active.error);
            } else if (active.data) {
              data = active.data as ProductType;
            } else {
              const fallback = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
              if (fallback.error) console.error('Error loading product (fallback):', fallback.error);
              else data = (fallback.data as ProductType) ?? null;
            }
          } else {
            const fallback = await supabase
              .from('products')
              .select('*')
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (fallback.error) console.error('Error loading product:', fallback.error);
            else data = (fallback.data as ProductType) ?? null;
          }

          if (!data) return null;

          const contentLang = resolveContentLocale(locale);
          const useShared = Boolean((data as { use_shared_content?: boolean }).use_shared_content);
          const translationLang = useShared ? 'pt' : contentLang;

          const { data: tr } = await supabase
            .from('products_translations')
            .select('*')
            .eq('product_id', data.id)
            .eq('language', translationLang)
            .maybeSingle();
          const { data: trFb } = !tr
            ? await supabase
                .from('products_translations')
                .select('*')
                .eq('product_id', data.id)
                .eq('language', 'pt')
                .maybeSingle()
            : { data: null };
          const t = tr || trFb;
          const localized = t
            ? {
                ...data,
                title: t.title || data.title,
                description: t.description || data.description,
                cover_url: t.cover_url || data.cover_url,
                preview_url: t.preview_url || data.preview_url,
                storage_url: t.storage_url || data.storage_url,
                cta_text: t.cta_text || data.cta_text,
              }
            : data;
          const row = localized as unknown as Record<string, unknown>;
          return {
            product: localized,
            pageLayout: parsePageLayoutConfig(row.page_layout_config),
            customCopy: parseJsonField(t?.custom_copy || row.custom_copy, {})
          };
        };

        const cacheKey = `product-detail-${productId || 'latest'}-${locale}`;
        const cachedData = await queryCache.get(cacheKey, fetcher, { revalidate });

        if (cachedData) {
          setProduct(cachedData.product);
          setPageLayout(cachedData.pageLayout);
          setCustomCopy(cachedData.customCopy);
        } else if (!silent) {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        if (!silent) setProduct(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [productId, locale]
  );

  useEffect(() => {
    if (localeLoading) return;
    setCampaignPrice(null);
    setDiscount(0);
    setAppliedCoupon('');
    setDescriptionExpanded(false);
    prevLocaleRef.current = locale;
    void loadProduct(false);
  }, [productId, localeLoading, loadProduct]);

  useEffect(() => {
    if (localeLoading || !product?.id) return;
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    void loadProduct(true);
  }, [locale, localeLoading, product?.id, loadProduct]);

  useEffect(() => {
    if (!product?.id) return;

    const pid = product.id;
    const bump = () => {
      const cacheKey = `product-detail-${productId || 'latest'}-${locale}`;
      queryCache.invalidate(cacheKey);
      void loadProduct(true, true);
      setChildRefreshKey((k) => k + 1);
    };

    const channel = supabase
      .channel(`product-page-${pid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_faqs', filter: `product_id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_bonuses', filter: `product_id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_benefits', filter: `product_id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_campaigns', filter: `product_id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_custom_sections', filter: `product_id=eq.${pid}` },
        bump
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_videos', filter: `product_id=eq.${pid}` },
        bump
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [product?.id, productId, locale, loadProduct]);

  // Intersection Observer para controlar visibilidade do sticky button
  useEffect(() => {
    const mainCta = mainCtaRef.current;
    if (!mainCta) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Se o botão principal está visível, esconde o sticky
          // Se o botão principal não está visível, mostra o sticky
          setShowStickyButton(!entry.isIntersecting);
        });
      },
      {
        // Threshold 0 significa que detecta assim que qualquer parte entra/sai
        threshold: 0,
        // rootMargin negativo cria uma margem de segurança
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    observer.observe(mainCta);

    return () => {
      observer.disconnect();
    };
  }, []);

  function handleCouponApplied(discountAmount: number, couponCode: string) {
    setDiscount(discountAmount);
    setAppliedCoupon(couponCode);
  }

  function getFinalPrice(): number {
    const basePrice = campaignPrice ?? safePrice(product?.price);
    return Math.max(0, basePrice - discount - referralDiscount);
  }

  const description = safeText(product?.description);
  const listPrice = safePrice(product?.price);
  const layout = pageLayout ?? parsePageLayoutConfig(null);
  const showVideos = isSectionEnabled(layout, 'video');
  const showBenefits = isSectionEnabled(layout, 'benefits');
  const showBonuses = isSectionEnabled(layout, 'bonuses');
  const showCustomSections = isSectionEnabled(layout, 'features') || isSectionEnabled(layout, 'comparison');
  const showFaq = isSectionEnabled(layout, 'faq');
  const showHeroSocialProof = isSectionEnabled(layout, 'hero');
  const ctaLabel = safeText(layout.cta_text || product?.cta_text, 'Comprar Agora');

  if (loading) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen">
        <div className="glass-panel rounded-2xl p-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Produto não encontrado</h2>
          <p className="font-sans text-lg text-on-surface-variant mb-8">
            O produto que você está procurando não existe ou não está mais disponível.
          </p>
          {setScreen && (
            <button
              onClick={() => setScreen('library')}
              className="secondary-btn px-6 py-3 rounded-full font-display text-sm font-semibold tracking-widest uppercase inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Biblioteca
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProductPurchaseProvider productId={product.id}>
    <div className="pt-28 pb-40 md:pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden page-wrapper">
      {/* Campaign Banner */}
      <CampaignBanner productId={product.id} onSpecialPrice={setCampaignPrice} />
      
      {/* Back Button */}
      {setScreen && (
        <button
          onClick={() => setScreen('library')}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 hover:border-primary/30 transition-all text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase">Voltar</span>
        </button>
      )}

      {/* Hero Section */}
      <section className="grid gap-10 md:grid-cols-2 md:gap-16 items-center mb-24 relative">
        {/* Content Left */}
        <div className="flex flex-col gap-8 relative z-10 min-w-0 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel w-fit border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-display text-xs font-semibold tracking-widest uppercase text-primary">
              Produto Premium
            </span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-on-surface break-words">
            {hasCopy(customCopy?.hero_headline)
              ? safeText(customCopy.hero_headline)
              : (product.title || 'Produto').split(' ').slice(0, 2).join(' ')}{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary break-words">
              {hasCopy(customCopy?.hero_subheadline)
                ? safeText(customCopy.hero_subheadline)
                : (product.title || '').split(' ').slice(2).join(' ')}
            </span>
          </h1>
          
          <div className="max-w-lg">
            <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant break-words">
              {descriptionExpanded ? description : `${description.slice(0, 170)}${description.length > 170 ? '...' : ''}`}
            </p>
            {description.length > 170 && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((prev) => !prev)}
                className="mt-2 text-xs font-display tracking-wider uppercase text-primary hover:text-secondary transition-colors"
              >
                {descriptionExpanded ? 'Mostrar menos' : 'Ler descrição completa'}
              </button>
            )}
          </div>
          
          {/* Tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full glass-panel border border-white/10 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          

          
          {/* Conversion */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-baseline gap-2 sm:gap-4 mb-2 flex-wrap">
              {(campaignPrice || discount > 0) ? (
                <div className="flex items-center gap-2 flex-wrap font-mono">
                  <span className="text-lg sm:text-xl md:text-2xl font-semibold text-on-surface-variant/50 line-through">
                    {tDict.before} ${listPrice}
                  </span>
                  <span className="text-lg sm:text-xl md:text-2xl font-semibold text-on-surface-variant/30">|</span>
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">
                    {tDict.now} ${getFinalPrice()}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">
                  $ {getFinalPrice()}
                </span>
              )}
            </div>
            
            {/* Coupon Input */}
            <ProductCouponSection
              productId={product.id}
              originalPrice={campaignPrice ?? listPrice}
              onCouponApplied={handleCouponApplied}
            />
            
            {/* Checkout Button */}
            <div ref={mainCtaRef}>
              <ProductActionButton
                productId={product.id}
                price={getFinalPrice()}
                isFree={product.is_free || false}
                productType={product.product_type || 'file'}
                productTitle={product.title}
                fastpayLink={(product as any).fastpay_link}
                aoaPrice={(product as any).aoa_price}
                couponCode={appliedCoupon}
                onNavigateToLibrary={() => setScreen && setScreen('member', 'biblioteca')}
                onStartLearning={(id, type) => setScreen && setScreen('member', `learn:${type}:${id}`)}
              />
            </div>

            {/* Sistema de Partilha & Desconto Progressivo */}
            {product && !product.is_free && listPrice > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/10 mt-6">
                <div className={isLoggedIn && !isOwned(product.id) ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "w-full"}>
                  {!isOwned(product.id) && (
                    <ReferralProgress
                      productId={product.id}
                      originalPrice={listPrice}
                      onDiscountChange={(discount) => setReferralDiscount(discount)}
                    />
                  )}
                  <ReferralShareCard productId={product.id} compact={isLoggedIn && !isOwned(product.id)} />
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Image Right */}
        <div className="perspective-container relative w-full aspect-square flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full mix-blend-screen z-0 pointer-events-none"></div>
          <div className="relative z-10 w-full max-w-full sm:max-w-[500px] mockup-rotate">
            <img 
              src={getProductCoverUrl(product)}
              alt={product.title}
              className="w-full h-auto rounded-xl shadow-[20px_20px_60px_rgba(0,0,0,0.8),_0_0_40px_rgba(192,193,255,0.2)] border border-white/10"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/500x500?text=Product+Image';
              }}
            />
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 bg-surface/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${
        showStickyButton 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 py-3">
          <div>
            <p className="font-sans text-xs text-on-surface-variant">Final price</p>
            <p className="font-mono text-xl font-bold text-primary">$ {getFinalPrice()}</p>
          </div>
          <ProductActionButton
            productId={product.id}
            price={getFinalPrice()}
            isFree={product.is_free || false}
            productType={product.product_type || 'file'}
            productTitle={product.title}
            fastpayLink={(product as any).fastpay_link}
            aoaPrice={(product as any).aoa_price}
            couponCode={appliedCoupon}
            variant="mobile"
            onNavigateToLibrary={() => setScreen && setScreen('member', 'biblioteca')}
            onStartLearning={(id, type) => setScreen && setScreen('member', `learn:${type}:${id}`)}
          />
        </div>
      </div>

      {/* Preview Section */}
      {(product.preview_url || product.video_url) && (
        <section className="mt-16 sm:mt-24">
          <div className="text-center mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-4">
              Prévia do Conteúdo
            </h2>
            <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Veja uma amostra do que você vai receber
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video Preview */}
            {product.video_url && (
              <div className="glass-panel p-4 sm:p-6 rounded-2xl">
                <div className="aspect-video bg-surface-highest rounded-xl overflow-hidden relative group cursor-pointer">
                  <video
                    src={product.video_url}
                    controls
                    className="w-full h-full object-cover"
                    poster={getProductCoverUrl(product)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-16 h-16 text-primary" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold text-white mt-4">
                  Vídeo Promocional
                </h3>
              </div>
            )}

            {/* File Preview */}
            {product.preview_url && (
              <div className="glass-panel p-4 sm:p-6 rounded-2xl">
                <div className="aspect-video bg-surface-highest rounded-xl overflow-hidden flex items-center justify-center">
                  <Download className="w-16 h-16 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mt-4 mb-2">
                  Preview Gratuito
                </h3>
                <a
                  href={product.preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-btn px-5 py-2.5 rounded-full font-display text-xs font-semibold tracking-widest uppercase flex items-center gap-2 w-fit"
                >
                  Baixar Preview
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {product.product_type === 'course' && (
        <section className="mt-16 sm:mt-24">
          <CourseCurriculum productId={product.id} />
        </section>
      )}

      {/* Video Section - Dynamic from Database */}
      {showVideos && <ProductVideo productId={product.id} refreshKey={childRefreshKey} />}

      {showBenefits && (
        <ProductBenefits
          productId={product.id}
          refreshKey={childRefreshKey}
          title={safeText(customCopy?.benefits_title)}
          subtitle={safeText(customCopy?.benefits_subtitle)}
        />
      )}

      {showBonuses && (
        <ProductBonuses
          productId={product.id}
          refreshKey={childRefreshKey}
          title={safeText(customCopy?.bonuses_title)}
          subtitle={safeText(customCopy?.bonuses_subtitle)}
          productOriginalPrice={listPrice}
          productFinalPrice={getFinalPrice()}
        />
      )}

      {showCustomSections && (
        <ProductCustomSections productId={product.id} refreshKey={childRefreshKey} />
      )}

      {showFaq && (
        <ProductFAQ
          productId={product.id}
          refreshKey={childRefreshKey}
          title={safeText(customCopy?.faq_title)}
        />
      )}
    </div>
    </ProductPurchaseProvider>
  );
}
