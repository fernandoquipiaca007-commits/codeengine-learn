import React, { useCallback, useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  User, 
  ShoppingBag, 
  Award, 
  Zap, 
  BookOpen, 
  CheckCircle,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getProductCoverUrl } from '../lib/storage-path';
import { fetchLocalizedProducts, LocalizedProduct } from '../hooks/useLocalizedProduct';
import { useUserCountry } from '../contexts/UserCountryContext';
import { useLocale } from '../contexts/LocaleContext';
import { prefetchProduct } from '../lib/prefetch';
import { LazyImage } from '../components/ui/LazyImage';
import { CircularGallery } from '../components/ui/circular-gallery';

/* -----------------------------------------------------------------------------
 * LOCALIZED TEXT DICTIONARY
 * -------------------------------------------------------------------------- */

const LOCALIZED_TEXT = {
  pt: {
    hero: {
      slide0: {
        title: "Transforme Conhecimento em Negócio Digital",
        description: "Cursos e e-books estruturados para impulsionar a sua carreira. Aprenda as habilidades mais valorizadas do mercado e comece a faturar hoje.",
      },
      slide1: {
        title: "Aprenda com Projetos Práticos",
        description: "Acesse aulas completas com código de suporte e arquivos para download. Damos a você a teoria e a prática exatas para construir sistemas de produção.",
      },
      slide2: {
        title: "Venda e Multiplique Seus Ganhos",
        description: "Seja um criador publicando os seus próprios produtos ou junte-se ao nosso programa de afiliados para divulgar produtos e receber comissões automáticas.",
      },
      ctaExplore: "Explorar Produtos",
      ctaGetStarted: "Criar Conta",
      ctaCourses: "Ver Biblioteca",
      ctaLearnMore: "Saber Mais",
      ctaApply: "Fazer Candidatura",
      ctaAffiliates: "Painel de Afiliados",
    },
    sections: {
      featured: "Destaques",
      featuredDesc: "Scroll para rodar a galeria 3D",
      mostSold: "Mais Vendidos",
      newReleases: "Lançamentos",
      recommended: "Recomendados pela CodeEngine",
      recentlyRead: "Continuar a Ler",
      soldCount: "{{count}} vendidos",
      viewProduct: "Ver Detalhes",
      loading: "A carregar produtos...",
      noProducts: "Nenhum produto disponível no momento.",
    },
    promos: {
      creatorTitle: "Parceria de Criador",
      creatorDesc: "Publique seus e-books e cursos na CodeEngine. Tenha hospedagem de vídeo integrada, controle de membros e pagamentos locais via FaciPay e Stripe.",
      creatorBtn: "Seja Criador",
      affiliateTitle: "Recompensas de Afiliado",
      affiliateDesc: "Promova e-books e cursos na plataforma. Obtenha links exclusivos e ganhe comissões automáticas por cada venda com saques simplificados.",
      affiliateBtn: "Seja Afiliado",
    }
  },
  en: {
    hero: {
      slide0: {
        title: "Transform Knowledge into Digital Business",
        description: "E-books and courses designed to boost your career. Learn high-value skills and start monetizing your expertise today.",
      },
      slide1: {
        title: "Learn with Hands-On Projects",
        description: "Get complete codebases and supportive assets for all lessons. We deliver production-grade implementation blueprints.",
      },
      slide2: {
        title: "Publish or Promote & Earn",
        description: "Be a creator and publish your digital assets or join our affiliate network to promote top-selling products and earn automated payouts.",
      },
      ctaExplore: "Explore Products",
      ctaGetStarted: "Sign Up",
      ctaCourses: "View Library",
      ctaLearnMore: "Learn More",
      ctaApply: "Apply Now",
      ctaAffiliates: "Affiliate Dashboard",
    },
    sections: {
      featured: "Featured",
      featuredDesc: "Scroll to rotate the 3D gallery",
      mostSold: "Most Sold",
      newReleases: "New Releases",
      recommended: "Recommended by CodeEngine",
      recentlyRead: "Continue Reading",
      soldCount: "{{count}} sold",
      viewProduct: "View Details",
      loading: "Loading products...",
      noProducts: "No products available at the moment.",
    },
    promos: {
      creatorTitle: "Creator Partnership",
      creatorDesc: "Publish your e-books and courses on CodeEngine. Profit from video hosting, members access systems, and automated Stripe/FaciPay checkouts.",
      creatorBtn: "Become Creator",
      affiliateTitle: "Affiliate Program",
      affiliateDesc: "Promote digital products on the marketplace. Retrieve dedicated referral links and collect recurring commissions with ease.",
      affiliateBtn: "Become Affiliate",
    }
  },
  fr: {
    hero: {
      slide0: {
        title: "Transformez le Savoir en Entreprise",
        description: "E-books et cours exclusifs conçus pour dynamiser votre carrière. Maîtrisez les compétences clés et commencez à générer des profits.",
      },
      slide1: {
        title: "Projets Pratiques Réels",
        description: "Accédez à des codes complets et supports téléchargeables. Nous couvrons la théorie et la mise en œuvre de systèmes de production.",
      },
      slide2: {
        title: "Vendez ou Parrainez & Gagnez",
        description: "Publiez vos propres créations ou rejoignez notre réseau d'affiliation pour promouvoir des produits et récolter des commissions.",
      },
      ctaExplore: "Explorer",
      ctaGetStarted: "S'inscrire",
      ctaCourses: "Bibliothèque",
      ctaLearnMore: "Savoir Plus",
      ctaApply: "Postuler",
      ctaAffiliates: "Tableau d'Affiliation",
    },
    sections: {
      featured: "En Vedette",
      featuredDesc: "Faites défiler pour faire pivoter la galerie 3D",
      mostSold: "Les Plus Vendus",
      newReleases: "Nouveautés",
      recommended: "Recommandés par CodeEngine",
      recentlyRead: "Continuer la Lecture",
      soldCount: "{{count}} vendus",
      viewProduct: "Détails",
      loading: "Chargement des produits...",
      noProducts: "Aucun produit disponible pour le moment.",
    },
    promos: {
      creatorTitle: "Partenariat Créateur",
      creatorDesc: "Publiez vos formations et livres sur CodeEngine. Profitez de l'hébergement vidéo intégré et de paiements sécurisés via Stripe et FaciPay.",
      creatorBtn: "Devenir Créateur",
      affiliateTitle: "Programme d'Affiliation",
      affiliateDesc: "Faites la promotion des produits. Récupérez vos liens de parrainage et accumulez des commissions automatiques facilement.",
      affiliateBtn: "Devenir Affilié",
    }
  }
};

/* -----------------------------------------------------------------------------
 * MAIN HOME COMPONENT
 * -------------------------------------------------------------------------- */

const getRecentlyReadProducts = (allProducts: LocalizedProduct[]) => {
  const readIds: { id: string; updatedAt: number }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ebook_progress_') || key.startsWith('course_progress_'))) {
        const id = key.replace('ebook_progress_', '').replace('course_progress_', '');
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            readIds.push({ id, updatedAt: data.updatedAt || 0 });
          } catch {
            readIds.push({ id, updatedAt: 0 });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading localStorage for history', e);
  }
  
  readIds.sort((a, b) => b.updatedAt - a.updatedAt);
  
  return readIds
    .map(entry => allProducts.find(p => p.id === entry.id))
    .filter((p): p is LocalizedProduct => !!p);
};

interface HomeProps {
  setScreen: (s: string) => void;
  onProductClick?: (productId: string) => void;
}

export function Home({ setScreen, onProductClick }: HomeProps) {
  const { locale } = useLocale();
  const { isAngola } = useUserCountry();
  const [products, setProducts] = useState<LocalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check for CircularGallery radius
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto transition language selector helper
  const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const text = LOCALIZED_TEXT[activeLang];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchLocalizedProducts(locale, 'active');
        setProducts(data);
      } catch (err) {
        console.error('Error loading home products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [locale]);

  // Autoplay hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 8500);
    return () => clearInterval(timer);
  }, []);

  // Consistent simulated sales count based on product ID
  const getMockSales = (prodId: string) => {
    let hash = 0;
    for (let i = 0; i < prodId.length; i++) {
      hash = prodId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const sales = Math.abs(hash % 4500) + 800;
    
    let displaySales = "";
    if (sales >= 1000) {
      displaySales = `${(sales / 1000).toFixed(1)}K`;
    } else {
      displaySales = String(sales);
    }
    
    return text.sections.soldCount.replace('{{count}}', displaySales);
  };

  const [recentlyRead, setRecentlyRead] = useState<LocalizedProduct[]>([]);

  useEffect(() => {
    if (products.length > 0) {
      const history = getRecentlyReadProducts(products);
      setRecentlyRead(history);
    }
  }, [products]);

  // Split products: top 4 for "Most Sold", next 4 for "New Releases", next 4 for "Recommended"
  const mostSoldProducts = products.slice(0, 4);
  const newReleasesProducts = products.length >= 8 ? products.slice(4, 8) : products.slice(0, 4);
  const recommendedProducts = products.filter(p => (p as any).is_featured).length > 0
    ? products.filter(p => (p as any).is_featured).slice(0, 4)
    : products.length >= 12 
      ? products.slice(8, 12) 
      : products.slice(0, 4);

  // Take first 8 products for circular gallery (or fallback to whatever is available)
  const circularGalleryItems = products.slice(0, 8);

  const formatPrice = (p: LocalizedProduct) => {
    if (p.is_free) return activeLang === 'pt' ? 'Livre' : activeLang === 'fr' ? 'Gratuit' : 'Free';
    
    if (isAngola) {
      const priceVal = p.aoa_price || (p as any).aoaPrice || Math.round(p.price * 920);
      return `Kz ${Number(priceVal).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`;
    }
    
    return `$${p.price}`;
  };

  return (
    <div className="relative w-full min-h-screen bg-transparent text-on-surface pt-20 pb-16 flex flex-col items-center">
      
      {/* Homepage container with premium spacing guidelines to let cards breathe */}
      <div className="w-full max-w-[1200px] px-6 flex flex-col gap-14 sm:gap-18 z-10 relative">

        {/* ─── Hero Carousel / Slider Section ─── */}
        <section className="relative w-full glass-card rounded-3xl p-6 md:p-8 border border-white/8 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[320px] md:min-h-[390px]">
          {/* Internal slider glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-primary/3 to-transparent z-0 pointer-events-none" />

          {/* Slides */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow">
            
            {/* Left Side: Slide Copy */}
            <div className="lg:col-span-7 flex flex-col justify-center items-start text-left gap-4 max-w-xl">
              {activeSlide === 0 && (
                <>
                  <h1 className="font-display font-black tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] text-white">
                    {text.hero.slide0.title}
                  </h1>
                  <p className="font-sans text-xs sm:text-sm text-on-surface-variant/80">
                    {text.hero.slide0.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setScreen('library')}
                      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] px-6 text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {text.hero.ctaExplore}
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                    {!isLoggedIn && (
                      <button
                        onClick={() => setScreen('auth')}
                        className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 text-xs font-semibold text-white transition-all cursor-pointer"
                      >
                        {text.hero.ctaGetStarted}
                      </button>
                    )}
                  </div>
                </>
              )}

              {activeSlide === 1 && (
                <>
                  <h1 className="font-display font-black tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] text-white">
                    {text.hero.slide1.title}
                  </h1>
                  <p className="font-sans text-xs sm:text-sm text-on-surface-variant/80">
                    {text.hero.slide1.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setScreen('library')}
                      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] px-6 text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {text.hero.ctaCourses}
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                    <button
                      onClick={() => setScreen('about')}
                      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      {text.hero.ctaLearnMore}
                    </button>
                  </div>
                </>
              )}

              {activeSlide === 2 && (
                <>
                  <h1 className="font-display font-black tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] text-white">
                    {text.hero.slide2.title}
                  </h1>
                  <p className="font-sans text-xs sm:text-sm text-on-surface-variant/80">
                    {text.hero.slide2.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setScreen('colaborador-candidatura')}
                      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] px-6 text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {text.hero.ctaApply}
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                    <button
                      onClick={() => setScreen('afiliados')}
                      className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      {text.hero.ctaAffiliates}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Side: Visual Mockup Showcase */}
            <div className="lg:col-span-5 flex items-center justify-center select-none w-full">
              {activeSlide === 0 && (
                <div className="glass-card p-4 rounded-xl border border-white/10 w-full max-w-[280px] sm:max-w-[320px] shadow-2xl relative overflow-hidden text-left bg-[#101015]/90">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/80" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                      <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-primary/60">Live Analytics</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase font-mono">Receita Total</div>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">{isAngola ? 'Kz 1.840.000' : '$2,450.00'}</div>
                      </div>
                      <div className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-semibold">+18.2%</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-[8px] text-muted-foreground uppercase font-mono">Vendas</div>
                        <div className="text-sm font-bold text-white mt-0.5">142</div>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-[8px] text-muted-foreground uppercase font-mono">Conversão</div>
                        <div className="text-sm font-bold text-white mt-0.5">5.8%</div>
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-muted-foreground/70 uppercase pt-1 border-t border-white/5">Transações Recentes</div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] bg-white/2 p-1.5 rounded">
                        <span className="text-white truncate">E-book E-commerce</span>
                        <span className="text-primary font-bold">{isAngola ? 'Kz 2.900' : '$3.99'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] bg-white/2 p-1.5 rounded">
                        <span className="text-white truncate">Curso SaaS Fullstack</span>
                        <span className="text-primary font-bold">{isAngola ? 'Kz 8.000' : '$9.99'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide === 1 && (
                <div className="glass-card p-4 rounded-xl border border-white/10 w-full max-w-[280px] sm:max-w-[320px] shadow-2xl relative overflow-hidden aspect-[16/10] flex flex-col justify-between text-left bg-[#101015]/90">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-primary/5 to-transparent z-0 pointer-events-none" />
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[8px] bg-primary/20 border border-primary/30 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Aulas em Vídeo</span>
                    <span className="text-[9px] font-mono text-white/50">Módulo 1</span>
                  </div>
                  <div className="flex flex-col items-center justify-center my-auto z-10 gap-2">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                      <Play className="w-4.5 h-4.5 text-black fill-current ml-0.5" />
                    </div>
                    <div className="text-xs font-semibold text-white">1. Introdução à Arquitetura SaaS</div>
                    <div className="text-[9px] text-muted-foreground">Progresso: 45% completo</div>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full z-10 overflow-hidden">
                    <div className="bg-primary h-full w-[45%]" />
                  </div>
                </div>
              )}

              {activeSlide === 2 && (
                <div className="glass-card p-4 rounded-xl border border-white/10 w-full max-w-[280px] sm:max-w-[320px] shadow-2xl relative overflow-hidden text-left bg-[#101015]/90">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <span className="text-xs font-semibold text-white">Programa de Afiliados</span>
                    <span className="text-[8px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded font-mono">Ativo</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase">Comissões Acumuladas</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">{isAngola ? 'Kz 320.000' : '$450.00'}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[8px] text-muted-foreground font-mono uppercase">Links com Alta Conversão</div>
                      <div className="p-2 bg-black/40 rounded border border-white/5 flex items-center justify-between text-[9px]">
                        <span className="text-primary truncate font-mono max-w-[200px]">codeengine.co/?ref=aff_18a...</span>
                        <span className="text-[8px] bg-white/10 text-white px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/20">Copiar</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dots Indicator & Navigation Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
            {/* Dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    activeSlide === idx ? "bg-white w-6" : "bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </section>


        {/* ─── Featured Products 3D Carousel Section ─── */}
        {circularGalleryItems.length >= 3 && (
          <section className="w-full flex flex-col items-center justify-center py-6 my-4 overflow-visible relative min-h-[380px] sm:min-h-[420px]">
            <div className="text-center mb-6 z-10">
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {text.sections.featured}
              </h2>
            </div>
            <div className="w-full h-[330px] sm:h-[375px] relative mt-2 overflow-visible">
              <CircularGallery
                items={circularGalleryItems}
                radius={isMobile ? 280 : 420}
                isAngola={isAngola}
                activeLang={activeLang}
                onProductClick={onProductClick}
              />
            </div>
          </section>
        )}


        {/* ─── "Continuar a Ler" (History / Recently Read) Section ─── */}
        {recentlyRead.length > 0 && (
          <section className="flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center w-full">
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {text.sections.recentlyRead}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyRead.map((product) => (
                <article
                  key={product.id}
                  onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
                  onMouseEnter={() => prefetchProduct(product.id, locale)}
                  className="glass-card glass-card-hover rounded-2xl p-2.5 relative group flex flex-col cursor-pointer overflow-hidden text-left bg-surface/50 border border-white/5 hover:border-primary/20"
                >
                  <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
                  
                  {/* Product Image */}
                  <div className="aspect-[4/3] rounded-xl mb-3 overflow-hidden relative bg-black/40 flex items-center justify-center">
                    <LazyImage
                      src={getProductCoverUrl(product)}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain"
                      fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                    />
                    
                    {/* Continue Reading / Playing badge */}
                    <span className="absolute top-2.5 left-2.5 bg-primary border border-primary/20 text-black px-2.5 py-0.5 rounded-full font-display text-[9px] font-black tracking-widest uppercase shadow animate-pulse">
                      {product.product_type === 'course' ? 'Assistir' : 'Ler'}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow flex flex-col z-10 relative">
                    <h3 className="font-display text-sm sm:text-base font-bold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="font-sans text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-normal">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary group-hover:text-white flex items-center gap-1 font-display">
                        {product.product_type === 'course' ? 'Continuar Curso' : 'Continuar Ebook'}
                        <Play className="w-3 h-3 fill-current" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}


        {/* ─── "Most Sold" (Mais Vendidos) Section ─── */}
        <section className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {text.sections.mostSold}
            </h2>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll left">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll right">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-2 h-[260px] animate-pulse flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-xl bg-white/5 w-full" />
                  <div className="h-4 bg-white/10 rounded w-2/3 my-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-6 bg-white/5 rounded w-1/3 mt-2" />
                </div>
              ))}
            </div>
          ) : mostSoldProducts.length === 0 ? (
            <div className="p-8 text-center glass-card border border-white/5 rounded-2xl text-muted-foreground text-xs font-medium">
              {text.sections.noProducts}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mostSoldProducts.map((product, idx) => {
                return (
                  <article
                    key={product.id}
                    onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
                    onMouseEnter={() => prefetchProduct(product.id, locale)}
                    className="glass-card glass-card-hover rounded-2xl p-2.5 relative group flex flex-col cursor-pointer overflow-hidden text-left bg-surface/50 border border-white/5 hover:border-primary/20"
                  >
                    {/* Glowing background card element */}
                    <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                    {/* Product Image */}
                    <div className="aspect-[4/3] rounded-xl mb-3 overflow-hidden relative bg-black/40 flex items-center justify-center">
                      <LazyImage
                        src={getProductCoverUrl(product)}
                        alt={product.title}
                        className="max-w-full max-h-full object-contain"
                        fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                      />
                      
                      {/* Product Type Badge */}
                      {product.product_type && (
                        <span className="absolute top-2.5 right-2.5 bg-surface/80 backdrop-blur-md border border-white/10 text-white px-2 py-0.5 rounded-full font-display text-[9px] font-bold tracking-widest uppercase shadow">
                          {product.product_type === 'course' ? 'Curso' : 'Ebook'}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow flex flex-col z-10 relative">
                      <h3 className="font-display text-sm sm:text-base font-bold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      
                      {/* Stats & Mock sales count */}
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wide mt-1">
                        {getMockSales(product.id)}
                      </span>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                        <span className="font-mono text-sm font-semibold text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.2)]">
                          {formatPrice(product)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-display">
                          {text.sections.viewProduct}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>


        {/* ─── "Recommended" (Recomendados pela CodeEngine) Section ─── */}
        <section className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {text.sections.recommended}
            </h2>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll left">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll right">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-2 h-[260px] animate-pulse flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-xl bg-white/5 w-full" />
                  <div className="h-4 bg-white/10 rounded w-2/3 my-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-6 bg-white/5 rounded w-1/3 mt-2" />
                </div>
              ))}
            </div>
          ) : recommendedProducts.length === 0 ? (
            <div className="p-8 text-center glass-card border border-white/5 rounded-2xl text-muted-foreground text-xs font-medium">
              {text.sections.noProducts}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedProducts.map((product) => (
                <article
                  key={product.id}
                  onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
                  onMouseEnter={() => prefetchProduct(product.id, locale)}
                  className="glass-card glass-card-hover rounded-2xl p-2.5 relative group flex flex-col cursor-pointer overflow-hidden text-left bg-surface/50 border border-white/5 hover:border-primary/20"
                >
                  <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
                  
                  {/* Product Image */}
                  <div className="aspect-[4/3] rounded-xl mb-3 overflow-hidden relative bg-black/40 flex items-center justify-center">
                    <LazyImage
                      src={getProductCoverUrl(product)}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain"
                      fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                    />
                    
                    {product.product_type && (
                      <span className="absolute top-2.5 right-2.5 bg-surface/80 backdrop-blur-md border border-white/10 text-white px-2 py-0.5 rounded-full font-display text-[9px] font-bold tracking-widest uppercase shadow">
                        {product.product_type === 'course' ? 'Curso' : 'Ebook'}
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow flex flex-col z-10 relative">
                    <h3 className="font-display text-sm sm:text-base font-bold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wide mt-1">
                      {getMockSales(product.id)}
                    </span>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                      <span className="font-mono text-sm font-semibold text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.2)]">
                        {formatPrice(product)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-display">
                        {text.sections.viewProduct}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>


        {/* ─── "New Releases" (Lançamentos) Section ─── */}
        <section className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              {text.sections.newReleases}
            </h2>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll left">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/3 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 active:scale-95 transition-all" aria-label="Scroll right">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-2 h-[260px] animate-pulse flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-xl bg-white/5 w-full" />
                  <div className="h-4 bg-white/10 rounded w-2/3 my-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-6 bg-white/5 rounded w-1/3 mt-2" />
                </div>
              ))}
            </div>
          ) : newReleasesProducts.length === 0 ? (
            <div className="p-8 text-center glass-card border border-white/5 rounded-2xl text-muted-foreground text-xs font-medium">
              {text.sections.noProducts}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newReleasesProducts.map((product) => {
                return (
                  <article
                    key={product.id}
                    onClick={() => onProductClick ? onProductClick(product.id) : setScreen('product')}
                    onMouseEnter={() => prefetchProduct(product.id, locale)}
                    className="glass-card glass-card-hover rounded-2xl p-2.5 relative group flex flex-col cursor-pointer overflow-hidden text-left bg-surface/50 border border-white/5 hover:border-primary/20"
                  >
                    <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                    {/* Product Image */}
                    <div className="aspect-[4/3] rounded-xl mb-3 overflow-hidden relative bg-black/40 flex items-center justify-center">
                      <LazyImage
                        src={getProductCoverUrl(product)}
                        alt={product.title}
                        className="max-w-full max-h-full object-contain"
                        fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                      />
                      
                      {/* Product Type Badge */}
                      {product.product_type && (
                        <span className="absolute top-2.5 right-2.5 bg-surface/80 backdrop-blur-md border border-white/10 text-white px-2 py-0.5 rounded-full font-display text-[9px] font-bold tracking-widest uppercase shadow">
                          {product.product_type === 'course' ? 'Curso' : 'Ebook'}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow flex flex-col z-10 relative">
                      <h3 className="font-display text-sm sm:text-base font-bold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      
                      {/* Description clip */}
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1 min-h-[2rem]">
                        {product.description}
                      </p>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                        <span className="font-mono text-sm font-semibold text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.2)]">
                          {formatPrice(product)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-display">
                          {text.sections.viewProduct}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>


        {/* ─── Two Promo Cards Section ─── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
          
          {/* Card 1: Creator Partnership */}
          <div 
            onClick={() => setScreen('colaborador-candidatura')}
            className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20"
            style={{
              aspectRatio: '1/1',
            }}
          >
            {/* Background Image with object-contain to prevent cropping */}
            <img 
              src="/colaborador.jpg" 
              alt="Creator" 
              className="absolute inset-0 w-full h-full object-contain z-0 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent z-10" />

            <div className="flex flex-col gap-3 relative z-20">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white tracking-tight">
                {text.promos.creatorTitle}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-lg">
                {text.promos.creatorDesc}
              </p>
            </div>
            <button
              className="relative inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] px-6 text-xs font-bold transition-all z-20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {text.promos.creatorBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Affiliate Rewards */}
          <div 
            onClick={() => setScreen('afiliados')}
            className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20"
            style={{
              aspectRatio: '1/1',
            }}
          >
            {/* Background Image with object-contain to prevent cropping */}
            <img 
              src="/Afiliado.jpg" 
              alt="Affiliate" 
              className="absolute inset-0 w-full h-full object-contain z-0 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent z-10" />

            <div className="flex flex-col gap-3 relative z-20">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white tracking-tight">
                {text.promos.affiliateTitle}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed max-w-lg">
                {text.promos.affiliateDesc}
              </p>
            </div>
            <button
              className="relative inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-6 text-xs font-bold text-white transition-all z-20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {text.promos.affiliateBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </section>

      </div>
    </div>
  );
}
