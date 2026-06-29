import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, Lock, Play, Download, ArrowLeft, Languages, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
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
import { useUserCountry } from '../contexts/UserCountryContext';
import { ReferralProgress } from '../components/referral/ReferralProgress';
import { ReferralShareCard } from '../components/referral/ReferralShareCard';
import { useAuthSession } from '../hooks/useAuthSession';
import { useOwnedProducts } from '../hooks/useOwnedProducts';
import { queryCache } from '../lib/queryCache';
import { LazyImage } from '../components/ui/LazyImage';
import { ScrollTiedBackground } from '../components/ui/ScrollTiedBackground';


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

const SECTION_TITLES = {
  pt: {
    title: 'Adquira o seu exemplar',
    subtitle: 'Escolha o melhor método de pagamento e comece a ler/assistir agora mesmo.'
  },
  en: {
    title: 'Get Your Copy',
    subtitle: 'Choose the best payment method and start reading/watching right away.'
  },
  fr: {
    title: 'Obtenez votre exemplaire',
    subtitle: 'Choisissez le meilleur mode de paiement et commencez à lire/regarder dès maintenant.'
  }
};

const ALERT_TRANSLATIONS = {
  pt: {
    availableIn: "Este documento está disponível em:",
    languages: {
      pt: "Português 🇵🇹",
      en: "Inglês 🇬🇧",
      fr: "Francês 🇫🇷"
    },
    observationTitle: "Aviso importante"
  },
  en: {
    availableIn: "This document is available in:",
    languages: {
      pt: "Portuguese 🇵🇹",
      en: "English 🇬🇧",
      fr: "French 🇫🇷"
    },
    observationTitle: "Important Notice"
  },
  fr: {
    availableIn: "Ce document est disponible en :",
    languages: {
      pt: "Portugais 🇵🇹",
      en: "Anglais 🇬🇧",
      fr: "Français 🇫🇷"
    },
    observationTitle: "Avis important"
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
  const { isAngola } = useUserCountry();
  const { t } = useTranslation(['pages', 'common'], { lng: locale });
  const currentLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const tDict = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  
  const params = new URLSearchParams(window.location.search);
  const isPreviewMode = params.get('preview') === 'true';

  const [product, setProduct] = useState<ProductType | null>(null);
  const [customCopy, setCustomCopy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);
  const [campaignEndDate, setCampaignEndDate] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!campaignEndDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const difference = new Date(campaignEndDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [campaignEndDate]);

  const [pageLayout, setPageLayout] = useState<PageLayoutConfig | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isCtaVisible, setIsCtaVisible] = useState(false);
  const showStickyButton = !isHeroVisible && !isCtaVisible;
  const [childRefreshKey, setChildRefreshKey] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [collaboratorInfo, setCollaboratorInfo] = useState<any>(null);
  const prevLocaleRef = useRef(locale);
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const promoVideoRef = useRef<HTMLVideoElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
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
      console.log('[ProductPage] loadProduct starting execution:', { productId, locale, silent, revalidate });
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
              console.error('[ProductPage] Error loading active product:', active.error);
            } else if (active.data) {
              data = active.data as ProductType;
            } else {
              const fallback = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
              if (fallback.error) console.error('[ProductPage] Error loading product (fallback):', fallback.error);
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
            if (fallback.error) console.error('[ProductPage] Error loading latest product:', fallback.error);
            else data = (fallback.data as ProductType) ?? null;
          }

          console.log('[ProductPage] base product loaded from DB:', data);
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

          console.log('[ProductPage] resolved translations:', {
            contentLang,
            translationLang,
            useShared,
            translation_record: tr,
            fallback_record: trFb
          });

          const localized = t
            ? {
                ...data,
                title: t.title || data.title,
                description: t.description || data.description,
                cover_url: t.cover_url || data.cover_url,
                cover_storage_path: t.cover_url || data.cover_storage_path,
                preview_url: t.preview_url || data.preview_url,
                storage_url: t.storage_url || data.storage_url,
                file_storage_path: t.storage_url || data.file_storage_path,
                cta_text: t.cta_text || data.cta_text,
                language: translationLang,
                updated_at: t.cover_url ? t.updated_at : data.updated_at,
              }
            : {
                ...data,
                language: 'pt',
              };

          console.log('[ProductPage] localized product mapped properties:', {
            id: localized.id,
            title: localized.title,
            cover_url: localized.cover_url,
            cover_storage_path: localized.cover_storage_path,
            cta_text: localized.cta_text
          });

          const { data: allTranslations } = await supabase
            .from('products_translations')
            .select('language, storage_url')
            .eq('product_id', data.id);

          const availLangs = new Set<string>();
          if (data.storage_url || data.file_storage_path) {
            availLangs.add('pt');
          }
          if (allTranslations) {
            allTranslations.forEach(trItem => {
              if (trItem.storage_url && trItem.storage_url.trim() !== '') {
                availLangs.add(trItem.language);
              }
            });
          }

          const trCustomCopy = parseJsonField(t?.custom_copy, {});
          const baseCustomCopy = parseJsonField((data as any).custom_copy, {});
          const mergedCustomCopy = {
            ...baseCustomCopy,
            ...trCustomCopy
          };

          // Fetch collaborator details if present
          let collaboratorInfo = null;
          if ((localized as any).collaborator_id) {
            try {
              const { data: collab } = await supabase
                .from('collaborators')
                .select('id, display_name, member_id, bio, specialty')
                .eq('id', (localized as any).collaborator_id)
                .maybeSingle();
              
              if (collab) {
                const { data: mem } = await supabase
                  .from('members')
                  .select('profile_data')
                  .eq('id', collab.member_id)
                  .maybeSingle();
                
                collaboratorInfo = {
                  id: collab.id,
                  display_name: collab.display_name,
                  bio: collab.bio,
                  specialty: collab.specialty,
                  avatar_url: mem?.profile_data?.avatar_url || null,
                  cover_url: mem?.profile_data?.cover_url || mem?.profile_data?.banner_url || null,
                };
              }
            } catch (err) {
              console.error('[ProductPage] Error fetching collaboratorInfo:', err);
            }
          }

          const row = localized as unknown as Record<string, unknown>;
          return {
            product: localized,
            pageLayout: parsePageLayoutConfig(row.page_layout_config),
            customCopy: mergedCustomCopy,
            availableLanguages: Array.from(availLangs),
            collaboratorInfo
          };
        };

        const cacheKey = `product-detail-${productId || 'latest'}-${locale}`;
        const cachedData = await queryCache.get(cacheKey, fetcher, { revalidate });

        if (cachedData) {
          console.log('[ProductPage] applying product from cache or fetch:', cachedData.product.id);
          setProduct(cachedData.product);
          setPageLayout(cachedData.pageLayout);
          setCustomCopy(cachedData.customCopy);
          setAvailableLanguages(cachedData.availableLanguages || []);
          setCollaboratorInfo(cachedData.collaboratorInfo || null);
        } else if (!silent) {
          console.log('[ProductPage] no product found, setting to null');
          setProduct(null);
        }
      } catch (error) {
        console.error('[ProductPage] Error in loadProduct hook callback:', error);
        if (!silent) setProduct(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [productId, locale]
  );

  useEffect(() => {
    if (localeLoading) return;
    const cacheKey = `product-detail-${productId || 'latest'}-${locale}`;
    const unsubscribeCache = queryCache.subscribe(cacheKey, (data) => {
      if (data) {
        console.log('[ProductPage] queryCache subscription update:', data.product.id);
        setProduct(data.product);
        setPageLayout(data.pageLayout);
        setCustomCopy(data.customCopy);
      }
    });
    return () => {
      unsubscribeCache();
    };
  }, [productId, locale, localeLoading]);

  useEffect(() => {
    if (localeLoading) return;
    setCampaignPrice(null);
    setDiscount(0);
    setAppliedCoupon('');
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
      queryCache.invalidate(`product-campaigns-${pid}`);
      queryCache.invalidate(`course-curriculum-${pid}`);
      queryCache.invalidate(`product-benefits-${pid}`);
      queryCache.invalidate(`product-bonuses-campaign-${pid}`);
      queryCache.invalidate(`product-bonuses-${pid}`);
      queryCache.invalidate(`product-custom-sections-${pid}`);
      queryCache.invalidate(`product-faqs-${pid}`);
      queryCache.invalidate(`product-videos-${pid}`);
      queryCache.invalidate(`localized-product-${pid}-${locale}`);
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

  // Intersection Observer para controlar a visibilidade da seção Hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsHeroVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    observer.observe(hero);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Intersection Observer para controlar a visibilidade da seção CTA inferior
  useEffect(() => {
    const mainCta = mainCtaRef.current;
    if (!mainCta) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsCtaVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    observer.observe(mainCta);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Intersection Observer para play/pause automático do vídeo promocional
  useEffect(() => {
    const video = promoVideoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => {
              console.log('[PromoVideo] Autoplay blocked or failed:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [product?.video_url]);

  // GSAP animations for 3D Ebook cover and ScrollTrigger scroll effects
  useEffect(() => {
    if (loading || !product) return;

    // 1. Intro Animation: 3D Entrance for Ebook Cover
    const introTween = gsap.fromTo(coverRef.current,
      {
        opacity: 0,
        y: 40,
        rotationY: -45,
        rotationX: 15,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        rotationY: -15, // Sleek initial angle
        rotationX: 10,
        scale: 1,
        duration: 1.4,
        ease: 'power3.out'
      }
    );

    // 2. Scroll-Linked Animation (ScrollTrigger)
    const ctx = gsap.context(() => {
      // The book cover floats down and rotates dynamically as you scroll!
      gsap.to(coverRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom+=600 top',
          scrub: 1.2, // Smooth follow scrub
          invalidateOnRefresh: true,
        },
        y: 280, // Moves down alongside scroll content
        rotationY: 15, // Rotates to expose other side
        rotationX: 0,
        scale: 0.85,
        ease: 'none'
      });

      // Staggered reveal for benefits cards
      gsap.fromTo('.benefit-card', 
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: '.benefit-card',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power2.out'
        }
      );

      // Staggered reveal for bonus cards
      gsap.fromTo('.bonus-card', 
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '.bonus-card',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power2.out'
        }
      );

      // Smooth reveal for FAQ items
      gsap.fromTo('.faq-item', 
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: '.faq-item',
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power1.out'
        }
      );
    });

    return () => {
      introTween.kill();
      ctx.revert();
    };
  }, [loading, product]);

  function handleCouponApplied(discountAmount: number, couponCode: string) {
    setDiscount(discountAmount);
    setAppliedCoupon(couponCode);
  }

  function getFinalPrice(): number {
    const basePrice = campaignPrice ?? safePrice(product?.price);
    return Math.max(0, basePrice - discount - referralDiscount);
  }

  function getFinalAoaPrice(): number {
    if (!product) return 0;
    const originalAoa = Number((product as any).aoa_price || Math.round(product.price * 920));
    if (originalAoa <= 0) return 0;
    
    const listPrice = safePrice(product?.price);
    if (listPrice <= 0) return originalAoa;
    
    const discountRatio = getFinalPrice() / listPrice;
    return Math.max(0, Math.round(originalAoa * discountRatio));
  }

  function translateDbText(text?: string | null): string {
    if (!text) return '';
    if (locale === 'pt') return text;

    const translations: Record<string, { en: string; fr: string }> = {
      "O que você vai dominar": {
        en: "What you will master",
        fr: "Ce que vous allez maîtriser"
      },
      "Um arsenal completo para elevar sua engenharia de software.": {
        en: "A complete arsenal to elevate your software engineering.",
        fr: "Un arsenal complet pour élever votre ingénierie logicielle."
      },
      "Bônus Exclusivos": {
        en: "Exclusive Bonuses",
        fr: "Bonus Exclusifs"
      },
      "Complementos premium incluídos gratuitamente nesta oferta.": {
        en: "Premium add-ons included for free in this offer.",
        fr: "Compléments premium inclus gratuitement dans cette offre."
      },
      "Perguntas Frequentes": {
        en: "Frequently Asked Questions",
        fr: "Questions Fréquentes"
      },
      "Comprar Agora": {
        en: "Buy Now",
        fr: "Acheter Maintenant"
      },
      "Pagamento 100% seguro": {
        en: "100% secure payment",
        fr: "Paiement 100% sécurisé"
      },
      "Quero Começar Agora": {
        en: "Get Instant Access",
        fr: "Obtenir un Accès Immédiat"
      },
      "Ler agora": {
        en: "Read Now",
        fr: "Lire maintenant"
      },
      "Ler Agora": {
        en: "Read Now",
        fr: "Lire maintenant"
      }
    };

    const trimmed = text.trim();
    const match = translations[trimmed];
    if (match) {
      return match[locale as 'en' | 'fr'] || text;
    }

    return text;
  }

  const description = safeText(product?.description);
  
  const renderPersuasiveDescription = (descText: string) => {
    if (!descText) return null;

    // Split into paragraphs by double newlines or single newlines that separate distinct blocks
    const blocks = descText.split(/\n\n+/).filter(Boolean);

    return (
      <div className="flex flex-col gap-4 text-on-surface-variant leading-relaxed">
        {blocks.map((block, i) => {
          // Check if this block is a list of bullet points
          const lines = block.split('\n').filter(Boolean);
          const isBulletList = lines.every(line => line.trim().startsWith('•') || line.trim().startsWith('-'));

          if (isBulletList) {
            return (
              <ul key={i} className="flex flex-col gap-2 my-1.5 pl-2">
                {lines.map((line, j) => {
                  const content = line.replace(/^[•-]\s*/, '');
                  return (
                    <li key={j} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 border border-primary/20">
                        <Star className="w-2.5 h-2.5 text-primary animate-pulse" />
                      </span>
                      <span className="font-sans text-on-surface-variant font-medium">{content}</span>
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Otherwise render as a normal paragraph
          return (
            <p key={i} className="font-sans text-sm sm:text-base font-normal whitespace-pre-line text-on-surface-variant/90 leading-relaxed">
              {block}
            </p>
          );
        })}
      </div>
    );
  };

  const listPrice = safePrice(product?.price);
  const layout = pageLayout ?? parsePageLayoutConfig(null);
  const showVideos = isSectionEnabled(layout, 'video');
  const showBenefits = isSectionEnabled(layout, 'benefits');
  const showBonuses = isSectionEnabled(layout, 'bonuses');
  const showCustomSections = isSectionEnabled(layout, 'features') || isSectionEnabled(layout, 'comparison');
  const showFaq = isSectionEnabled(layout, 'faq');
  const showHeroSocialProof = isSectionEnabled(layout, 'hero');
  const ctaLabel = product?.cta_text ? safeText(product.cta_text) : (translateDbText(layout.cta_text) || t('common:actions.buyNow'));

  if (loading) {
    return (
      <div className="pt-24 pb-12 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 pb-12 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen">
        <div className="glass-panel rounded-2xl p-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">{t('product.productNotFound')}</h2>
          <p className="font-sans text-lg text-on-surface-variant mb-8">
            {t('product.productNotFoundDesc')}
          </p>
          {setScreen && (
            <button
              onClick={() => setScreen('library')}
              className="secondary-btn px-6 py-3 rounded-full font-display text-sm font-semibold tracking-widest uppercase inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('product.backToLibrary')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const themeConfig = (product as any).theme_video_config || {};
  const hasTheme = !!product.theme_video_path;
  const isLight = !!themeConfig.isLight;

  return (
    <ProductPurchaseProvider productId={product.id}>
      {hasTheme && (
        <ScrollTiedBackground 
          videoPath={product.theme_video_path} 
          videoOpacity={themeConfig.videoOpacity}
          overlayOpacity={themeConfig.overlayOpacity}
          backgroundStyle={themeConfig.backgroundStyle}
        />
      )}
      <div 
        style={hasTheme ? {
          '--glass-opacity': themeConfig.sectionOpacity ?? 0.1,
          '--glass-blur': `${themeConfig.blurAmount ?? 8}px`
        } as React.CSSProperties : {}}
        className={`pt-24 pb-20 md:pb-16 px-4 sm:px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen overflow-x-hidden page-wrapper relative z-10 ${
          isLight ? 'light-theme-page' : ''
        }`}
      >
      {isPreviewMode && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 p-4 text-sm text-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="font-semibold block">Modo de Pré-visualização</strong>
              <span className="text-orange-300/90 text-xs">Este produto ainda não está ativo ou aprovado. Esta página de rascunho é visível apenas para você (criador).</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded bg-orange-500/20 text-orange-300 text-xs font-semibold uppercase tracking-wider border border-orange-500/30 self-start sm:self-auto">
            Rascunho
          </div>
        </div>
      )}
      {/* Campaign Banner */}
      <CampaignBanner productId={product.id} onSpecialPrice={setCampaignPrice} onCampaignActive={setCampaignEndDate} />
      
      {/* Back Button */}
      {setScreen && (
        <button
          onClick={() => setScreen('library')}
          className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-white/10 hover:border-primary/30 transition-all text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase">{t('product.back')}</span>
        </button>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-12 items-center mb-16 relative">
        {/* Content Left */}
        <div className="flex flex-col gap-5 relative z-10 min-w-0 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel w-fit border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-display text-xs font-semibold tracking-widest uppercase text-primary">
                {t('product.premiumBadge')}
              </span>
            </div>

            {(product as any).collaborator_id && collaboratorInfo ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-white font-display">
                {collaboratorInfo.avatar_url ? (
                  <img
                    src={collaboratorInfo.avatar_url}
                    alt={collaboratorInfo.display_name}
                    className="w-4.5 h-4.5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <span className="text-[10px]">👤</span>
                )}
                <span className="text-white">{collaboratorInfo.display_name}</span>
                {collaboratorInfo.plan === 'course_creator' && (
                  <span className="inline-flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full p-0.5" title="Membro Pro">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant font-display">
                <span className="text-[10px]">⚙️</span>
                Oficial CodeEngine
              </div>
            )}
          </div>
          
          <h1 className={`${
            (product.title || '').length > 45 
              ? 'text-2xl sm:text-3xl md:text-4xl lg:text-[36px]' 
              : 'text-3xl sm:text-4xl md:text-[44px]'
          } font-display leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 break-words`}>
            {hasCopy(customCopy?.hero_headline) ? (
              <>
                {safeText(customCopy.hero_headline)}{' '}
                {hasCopy(customCopy?.hero_subheadline) && (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {safeText(customCopy.hero_subheadline)}
                  </span>
                )}
              </>
            ) : (
              product.title || 'Produto'
            )}
          </h1>
          
          <div className="max-w-xl">
            {renderPersuasiveDescription(description)}
          </div>

          {/* Promo Video */}
          {product.video_url && (
            <div className="mt-4 w-full max-w-lg aspect-video bg-surface-highest rounded-2xl overflow-hidden relative group border border-white/10 shadow-lg">
              <video
                ref={promoVideoRef}
                src={product.video_url}
                controls
                preload="none"
                playsInline
                muted
                loop
                className="w-full h-full object-cover"
                poster={getProductCoverUrl(product, locale)}
              />
            </div>
          )}
          
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
        </div>
        
        {/* Image Right */}
        <div className="relative w-full flex items-center justify-center min-h-[300px] md:min-h-[400px]" style={{ perspective: '1200px' }}>
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full mix-blend-screen z-0 pointer-events-none"></div>
          <div ref={coverRef} className="relative z-10 w-full max-w-full sm:max-w-[350px] will-change-transform">
            <LazyImage
              src={getProductCoverUrl(product, locale)}
              alt={product.title}
              className="w-full h-auto rounded-xl shadow-[20px_20px_60px_rgba(0,0,0,0.8),_0_0_40px_rgba(192,193,255,0.2)] border border-white/10"
              fallback={`https://placehold.co/600x600/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
            />
          </div>
        </div>
      </section>

      {/* Creator Profile Section */}
      {collaboratorInfo && (
        <section className="mb-16 glass-panel rounded-3xl overflow-hidden border border-white/10 relative group">
          {/* Creator Cover Banner */}
          <div className="h-32 sm:h-40 w-full relative overflow-hidden bg-gradient-to-r from-primary/30 to-secondary/30">
            {collaboratorInfo.cover_url ? (
              <img 
                src={collaboratorInfo.cover_url} 
                alt="Creator Profile Cover" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/45 via-surface-high/60 to-surface-lowest"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest to-transparent"></div>
          </div>
          
          {/* Creator Profile Info */}
          <div className="px-6 pb-6 relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center -mt-10 sm:-mt-12">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-surface-lowest bg-surface-high shadow-xl flex-shrink-0 relative z-10">
              {collaboratorInfo.avatar_url ? (
                <img 
                  src={collaboratorInfo.avatar_url} 
                  alt={collaboratorInfo.display_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl font-display">
                  {collaboratorInfo.display_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Name / Specialty / Bio */}
            <div className="space-y-1 relative z-10 pt-2 sm:pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {collaboratorInfo.display_name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-semibold text-primary uppercase tracking-wider font-display">
                  Criador Parceiro
                </span>
              </div>
              
              {collaboratorInfo.specialty && (
                <p className="text-xs font-semibold text-primary/80 uppercase tracking-widest font-display">
                  {collaboratorInfo.specialty}
                </p>
              )}
              
              {collaboratorInfo.bio && (
                <p className="text-sm text-on-surface-variant font-sans max-w-2xl leading-relaxed pt-1">
                  {collaboratorInfo.bio}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky CTA */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 bg-surface/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${
        showStickyButton 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 py-3">
          <div>
            <p className="font-sans text-xs text-on-surface-variant">{t('product.finalPrice')}</p>
            {isAngola ? (
              <>
                <p className="font-mono text-base font-bold text-amber-500">
                  Kz {Number(getFinalAoaPrice()).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[9px] text-on-surface-variant/80">
                  ou $ {getFinalPrice()} USD {discount > 0 && `(Desconto de $${discount.toFixed(2)} USD aplicado)`}
                </p>
              </>
            ) : (
              <p className="font-mono text-xl font-bold text-primary">$ {getFinalPrice()}</p>
            )}
          </div>
          <ProductActionButton
            productId={product.id}
            price={getFinalPrice()}
            originalPrice={listPrice}
            isFree={product.is_free || false}
            productType={product.product_type || 'file'}
            productTitle={product.title}
            fastpayLink={(product as any).fastpay_link}
            aoaPrice={(product as any).aoa_price}
            couponCode={appliedCoupon}
            variant="mobile"
            ctaText={ctaLabel}
            onNavigateToLibrary={() => setScreen && setScreen('member', 'biblioteca')}
            onStartLearning={(id, type) => setScreen && setScreen('member', `learn:${type}:${id}`)}
            onRequireAuth={() => setScreen && setScreen('signup')}
            preferAoa={isAngola}
          />
        </div>
      </div>

      {/* Preview Section */}
      {product.preview_url && (
        <section className="mt-16 sm:mt-24">
          <div className="text-center mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-4">
              {t('product.contentPreview')}
            </h2>
            <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              {t('product.sampleDesc')}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            {/* File Preview */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {t('product.freePreview')}
              </h3>
              <a
                href={product.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-btn px-5 py-2.5 rounded-full font-display text-xs font-semibold tracking-widest uppercase flex items-center gap-2 w-fit mt-2"
              >
                {t('product.downloadPreview')}
                <Download className="w-4 h-4" />
              </a>
            </div>
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
          title={translateDbText(customCopy?.benefits_title)}
          subtitle={translateDbText(customCopy?.benefits_subtitle)}
        />
      )}

      {showBonuses && (
        <ProductBonuses
          productId={product.id}
          refreshKey={childRefreshKey}
          title={translateDbText(customCopy?.bonuses_title)}
          subtitle={translateDbText(customCopy?.bonuses_subtitle)}
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
          title={translateDbText(customCopy?.faq_title)}
        />
      )}

      {/* Seção de Compra - Realocada para o Final */}
      <section className="mt-16 pt-12 border-t border-white/10 max-w-2xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {SECTION_TITLES[currentLang]?.title || SECTION_TITLES.pt.title}
            </h2>
            <p className="font-sans text-sm text-on-surface-variant max-w-md mx-auto">
              {SECTION_TITLES[currentLang]?.subtitle || SECTION_TITLES.pt.subtitle}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-1.5 w-full">
              {isAngola ? (
                <>
                  <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold text-amber-500 tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse">
                    Kz {Number(getFinalAoaPrice()).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}
                  </span>
                  <span className="font-sans text-xs text-on-surface-variant">
                    Equivalente a $ {getFinalPrice()} USD
                  </span>
                  {discount > 0 && (
                    <span className="text-xs text-green-400 font-sans block mt-1 font-bold animate-pulse">
                      Desconto de ${discount.toFixed(2)} USD aplicado ao preço em dólar
                    </span>
                  )}
                </>
              ) : (
                <div className="flex justify-center items-baseline gap-2 sm:gap-3 mb-1 flex-wrap">
                  {(campaignPrice || discount > 0) ? (
                    <div className="flex items-center justify-center gap-2 flex-wrap font-mono">
                      <span className="text-base sm:text-lg md:text-xl font-semibold text-on-surface-variant/50 line-through">
                        {tDict.before} ${listPrice}
                      </span>
                      <span className="text-base sm:text-lg md:text-xl font-semibold text-on-surface-variant/30">|</span>
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">
                        {tDict.now} ${getFinalPrice()}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">
                      $ {getFinalPrice()}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Campaign Countdown Timer */}
            {timeLeft && (
              <div className="flex flex-col items-center justify-center p-3 bg-red-500/10 border border-red-500/25 rounded-xl mb-1 animate-pulse">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                    A Oferta Especial Termina Em:
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-extrabold text-white">
                  {timeLeft.days > 0 && (
                    <>
                      <span className="bg-red-950/45 px-1.5 py-0.5 rounded border border-red-900/30 text-xs">{timeLeft.days}d</span>
                      <span>:</span>
                    </>
                  )}
                  <span className="bg-red-950/45 px-1.5 py-0.5 rounded border border-red-900/30 text-xs">{String(timeLeft.hours).padStart(2, '0')}h</span>
                  <span>:</span>
                  <span className="bg-red-950/45 px-1.5 py-0.5 rounded border border-red-900/30 text-xs">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  <span>:</span>
                  <span className="bg-red-950/45 px-1.5 py-0.5 rounded border border-red-500/40 text-xs text-red-400 font-bold">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            )}

            {/* Coupon Input */}
            <ProductCouponSection
              productId={product.id}
              originalPrice={campaignPrice ?? listPrice}
              onCouponApplied={handleCouponApplied}
            />
            
            {/* Translation & Observation Alert */}
            {(availableLanguages.length > 0 || (customCopy?.purchase_note && customCopy.purchase_note.trim() !== '')) && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col gap-3 text-left">
                {/* Languages list */}
                {availableLanguages.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Languages className="w-5.5 h-5.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-white/50 block uppercase tracking-wider mb-0.5">
                        {ALERT_TRANSLATIONS[currentLang]?.availableIn || ALERT_TRANSLATIONS.pt.availableIn}
                      </span>
                      <span className="text-sm font-medium text-white/90">
                        {availableLanguages
                          .map(lang => (ALERT_TRANSLATIONS[currentLang]?.languages as any)?.[lang] || lang)
                          .join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Observation / Note */}
                {customCopy?.purchase_note && customCopy.purchase_note.trim() !== '' && (
                  <div className={`flex items-start gap-2.5 ${availableLanguages.length > 0 ? 'pt-2.5 border-t border-white/5' : ''}`}>
                    <AlertTriangle className="w-5.5 h-5.5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider mb-0.5">
                        {ALERT_TRANSLATIONS[currentLang]?.observationTitle || ALERT_TRANSLATIONS.pt.observationTitle}
                      </span>
                      <p className="text-sm font-normal text-amber-200/90 leading-relaxed">
                        {customCopy.purchase_note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Button */}
            <div ref={mainCtaRef} className="w-full">
              <ProductActionButton
                productId={product.id}
                price={getFinalPrice()}
                originalPrice={listPrice}
                isFree={product.is_free || false}
                productType={product.product_type || 'file'}
                productTitle={product.title}
                fastpayLink={(product as any).fastpay_link}
                aoaPrice={(product as any).aoa_price}
                couponCode={appliedCoupon}
                ctaText={ctaLabel}
                onNavigateToLibrary={() => setScreen && setScreen('member', 'biblioteca')}
                onStartLearning={(id, type) => setScreen && setScreen('member', `learn:${type}:${id}`)}
                onRequireAuth={() => setScreen && setScreen('signup')}
                preferAoa={isAngola}
              />
            </div>

            {/* Sistema de Partilha & Desconto Progressivo */}
            {product && !product.is_free && listPrice > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/10 mt-6 w-full">
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
      </section>
    </div>
    </ProductPurchaseProvider>
  );
}
