import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { UpdatePrompt } from './components/UpdatePrompt';
import { PushPermissionPrompt } from './components/PushPermissionPrompt';
import { useLocale } from './contexts/LocaleContext';
import { supabase } from './lib/supabase';

// ─── Lazy-loaded heavy components ─────────────────────────────────────────────
// Background3D uses Three.js (~500KB) — load async so it doesn't block paint
const Background3D = lazy(() =>
  import('./components/Background3D').then((m) => ({ default: m.Background3D }))
);

// ─── Lazy-loaded pages (code splitting) ───────────────────────────────────────
// Each page is loaded on demand — not bundled into the initial JS payload.
// This reduces the initial bundle size by ~70%.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const Product = lazy(() => import('./pages/Product').then(m => ({ default: m.Product })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Member = lazy(() => import('./pages/Member').then(m => ({ default: m.Member })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Releases = lazy(() => import('./pages/Releases').then(m => ({ default: m.Releases })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Licensing = lazy(() => import('./pages/Licensing').then(m => ({ default: m.Licensing })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const Success = lazy(() => import('./pages/Success').then(m => ({ default: m.Success })));
const Cancel = lazy(() => import('./pages/Cancel').then(m => ({ default: m.Cancel })));
const Rewards = lazy(() => import('./pages/Rewards').then(m => ({ default: m.Rewards })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const CollaboratorApply = lazy(() => import('./pages/CollaboratorApply').then(m => ({ default: m.CollaboratorApply })));
const CollaboratorDashboard = lazy(() => import('./pages/CollaboratorDashboard').then(m => ({ default: m.CollaboratorDashboard })));
const CollaboratorProducts = lazy(() => import('./pages/CollaboratorProducts').then(m => ({ default: m.CollaboratorProducts })));

// ─── Page transition variants ─────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition: any = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// ─── Page loader skeleton ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
        role="status"
        aria-label="Loading page..."
      />
    </div>
  );
}

// ─── Memoized page renderer (avoids re-renders when only other state changes) ─
const PageContent = memo(function PageContent({
  currentScreen,
  currentProductId,
  memberSection,
  navigateToScreen,
  navigateToProduct,
  setIsImmersive,
}: {
  currentScreen: string;
  currentProductId: string | null;
  memberSection: string;
  navigateToScreen: (screen: string, section?: string) => void;
  navigateToProduct: (id: string) => void;
  setIsImmersive: (v: boolean) => void;
}) {
  return (
    <Suspense fallback={<PageLoader />}>
      {currentScreen === 'home' && (
        <Home setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {currentScreen === 'library' && (
        <Library setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {currentScreen === 'product' && (
        <Product setScreen={navigateToScreen} productId={currentProductId} />
      )}
      {currentScreen === 'auth' && <Auth setScreen={navigateToScreen} />}
      {currentScreen === 'signup' && <Auth setScreen={navigateToScreen} initialMode="signup" />}
      {currentScreen === 'reset-password' && <ResetPassword setScreen={navigateToScreen} />}
      {currentScreen === 'member' && (
        <Member
          key={memberSection}
          setScreen={navigateToScreen}
          onProductClick={navigateToProduct}
          initialSection={memberSection}
          onLearnViewChange={setIsImmersive}
        />
      )}
      {currentScreen === 'about' && <About setScreen={navigateToScreen} />}
      {currentScreen === 'releases' && (
        <Releases setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {currentScreen === 'contact' && <Contact setScreen={navigateToScreen} />}
      {currentScreen === 'favorites' && <Favorites setScreen={navigateToScreen} />}
      {currentScreen === 'news' && <News setScreen={navigateToScreen} />}
      {currentScreen === 'settings' && <Settings setScreen={navigateToScreen} />}
      {currentScreen === 'privacy' && <Privacy setScreen={navigateToScreen} />}
      {currentScreen === 'terms' && <Terms setScreen={navigateToScreen} />}
      {currentScreen === 'licensing' && <Licensing setScreen={navigateToScreen} />}
      {currentScreen === 'support' && <Support setScreen={navigateToScreen} />}
      {currentScreen === 'success' && <Success setScreen={navigateToScreen} />}
      {currentScreen === 'cancel' && <Cancel setScreen={navigateToScreen} />}
      {currentScreen === 'rewards' && <Rewards setScreen={navigateToScreen} />}
      {currentScreen === 'colaborador-candidatura' && (
        <CollaboratorApply
          setScreen={navigateToScreen}
          onCandidacyApproved={() => navigateToScreen('colaborador')}
        />
      )}
      {currentScreen === 'colaborador' && (
        <CollaboratorDashboard
          setScreen={navigateToScreen}
          onGoToProducts={() => navigateToScreen('colaborador-produtos')}
        />
      )}
      {currentScreen === 'colaborador-produtos' && (
        <CollaboratorProducts
          setScreen={navigateToScreen}
        />
      )}
    </Suspense>
  );
});

// Screens that should NOT be persisted (always reset to home on refresh)
const NON_PERSISTENT_SCREENS = new Set([
  'auth', 'signup', 'reset-password', 'success', 'cancel',
]);

// Read initial screen from sessionStorage (only when there are no URL params)
function getInitialScreen(): string {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  // If special URL params are present, let the useEffect handle routing
  const hasSpecialRoute =
    params.has('screen') ||
    pathname !== '/' ||
    hash.includes('access_token=') ||
    hash.includes('type=recovery');
  if (hasSpecialRoute) return 'home';
  const stored = sessionStorage.getItem('ce_last_screen');
  const valid = ['home','library','member','about','releases','contact',
    'favorites','news','settings','privacy','terms','licensing','support',
    'rewards','product', 'colaborador-candidatura', 'colaborador', 'colaborador-produtos'];
  return (stored && valid.includes(stored)) ? stored : 'home';
}

function getInitialProductId(): string | null {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;
  const hasSpecialRoute = params.has('screen') || pathname !== '/';
  if (hasSpecialRoute) return null;
  const screen = sessionStorage.getItem('ce_last_screen');
  if (screen !== 'product') return null;
  return sessionStorage.getItem('ce_last_product_id') || null;
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const { locale } = useLocale();
  const [currentScreen, setScreen] = useState(getInitialScreen);
  const [currentProductId, setCurrentProductId] = useState<string | null>(getInitialProductId);
  const [memberSection, setMemberSection] = useState<string>('inicio');
  const [showSearch, setShowSearch] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  const navigateToProduct = (productId: string) => {
    setCurrentProductId(productId);
    setScreen('product');
  };

  const navigateToScreen = (screen: string, section?: string) => {
    if (screen !== 'product') {
      setCurrentProductId(null);
    }

    if (screen === 'member') {
      setMemberSection(section || 'inicio');
      setScreen(screen);
    } else {
      setMemberSection('inicio');
      setScreen(screen);
    }
  };

  // Persist current screen to sessionStorage so it survives page refreshes
  useEffect(() => {
    if (!NON_PERSISTENT_SCREENS.has(currentScreen)) {
      sessionStorage.setItem('ce_last_screen', currentScreen);
      if (currentScreen === 'product' && currentProductId) {
        sessionStorage.setItem('ce_last_product_id', currentProductId);
      } else {
        sessionStorage.removeItem('ce_last_product_id');
      }
    }
  }, [currentScreen, currentProductId]);

  useEffect(() => {
    // Listen for PWA installation prompt globally
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    const handleAppInstalled = () => {
      (window as any).deferredPwaPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'));
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    // Handle /product/XYZ direct link (e.g. from web push)
    if (pathname.startsWith('/product/')) {
      const productId = pathname.split('/product/')[1]?.split(/[?#/]/)[0];
      if (productId) {
        navigateToProduct(productId);
        window.history.replaceState({}, '', '/');
        return;
      }
    }

    // Handle /news/ABC direct link (e.g. from web push)
    if (pathname.startsWith('/news/')) {
      const newsId = pathname.split('/news/')[1]?.split(/[?#/]/)[0];
      if (newsId) {
        sessionStorage.setItem('pendingNewsId', newsId);
        setScreen('news');
        window.history.replaceState({}, '', '/');
        return;
      }
    } else if (pathname === '/news' || pathname === '/news/') {
      setScreen('news');
      window.history.replaceState({}, '', '/');
      return;
    }

    // Detect recovery sessions or reset password routes
    if (
      hash.includes('type=recovery') ||
      pathname === '/reset-password' ||
      pathname === '/reset-password/'
    ) {
      setScreen('reset-password');
      return;
    }

    // Save referral code if present (works with any URL)
    const ref = params.get('ref');
    if (ref) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('ce_referral_code', JSON.stringify({ code: ref, expiry }));
    }

    // Handle ?screen=success or ?screen=cancel
    if (screen === 'success' || screen === 'cancel') {
      setScreen(screen);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Handle ?screen=product&id=XYZ (referral link to specific product)
    if (screen === 'product') {
      const productId = params.get('id');
      if (productId) {
        navigateToProduct(productId);
        window.history.replaceState({}, '', '/');
        return;
      }
    }

    // Handle /success?session_id=... (old Stripe redirect flow)
    if (pathname === '/success' || pathname === '/success/') {
      setScreen('success');
      return;
    }

    // Handle /cancel
    if (pathname === '/cancel' || pathname === '/cancel/') {
      setScreen('cancel');
      window.history.replaceState({}, '', '/');
      return;
    }

    // Handle collaborator pathnames
    if (pathname === '/colaborador' || pathname === '/colaborador/') {
      setScreen('colaborador');
      window.history.replaceState({}, '', '/');
      return;
    }
    if (pathname === '/colaborador/candidatura' || pathname === '/colaborador/candidatura/') {
      setScreen('colaborador-candidatura');
      window.history.replaceState({}, '', '/');
      return;
    }
    if (pathname === '/colaborador/produtos' || pathname === '/colaborador/produtos/') {
      setScreen('colaborador-produtos');
      window.history.replaceState({}, '', '/');
      return;
    }

    // Handle any ?screen= parameter
    if (screen && screen !== 'product') {
      const targetScreen = screen === 'noticias' ? 'news' : screen;
      if (targetScreen === 'news') {
        const newsId = params.get('newsId');
        if (newsId) {
          sessionStorage.setItem('pendingNewsId', newsId);
        }
      }
      setScreen(targetScreen);
      window.history.replaceState({}, '', '/');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Handle pending product from sessionStorage (page load)
    const pending = sessionStorage.getItem('pendingProductId');
    if (pending) {
      sessionStorage.removeItem('pendingProductId');
      navigateToProduct(pending);
    }

    // Listen for post-login product redirect
    const handler = (e: Event) => {
      const productId = (e as CustomEvent).detail;
      if (productId) navigateToProduct(productId);
    };
    window.addEventListener('navigate-product', handler);
    return () => window.removeEventListener('navigate-product', handler);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Clear hash if returning from OAuth redirect
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, '', '/');
        }

        const wasAuthenticating = sessionStorage.getItem('ce_google_signing_in') === 'true';

        if (wasAuthenticating) {
          sessionStorage.removeItem('ce_google_signing_in');

          // Welcome API call (fire-and-forget)
          fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/auth/welcome`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              Authorization: `Bearer ${session.access_token}` 
            },
          }).catch(() => {});

          const rawCheckout = sessionStorage.getItem('pendingCheckout');
          if (rawCheckout) {
            try {
              const intent = JSON.parse(rawCheckout) as { productId: string };
              if (intent.productId) {
                sessionStorage.removeItem('pendingCheckout');
                setTimeout(() => {
                  navigateToProduct(intent.productId);
                }, 100);
                return;
              }
            } catch {}
          }

          const pendingProduct = sessionStorage.getItem('pendingProductId');
          if (pendingProduct) {
            sessionStorage.removeItem('pendingProductId');
            setTimeout(() => {
              navigateToProduct(pendingProduct);
            }, 100);
            return;
          }

          navigateToScreen('member');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigateToScreen, navigateToProduct]);

  return (
    <div className="relative min-h-screen flex flex-col text-on-surface overflow-x-hidden max-w-[100vw]">
      {/* Background3D is lazy-loaded: Three.js ~500KB deferred after initial paint */}
      <Suspense fallback={
        <div className="fixed inset-0 z-[-10] bg-background">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] opacity-50" />
        </div>
      }>
        <Background3D isImmersive={isImmersive} />
      </Suspense>
      {!isImmersive && (
        <NavBar
          currentScreen={currentScreen}
          setScreen={navigateToScreen}
          onSearchClick={() => setShowSearch(true)}
        />
      )}

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(screen, productId) => {
          if (screen === 'product' && productId) {
            navigateToProduct(productId);
          } else {
            navigateToScreen(screen);
          }
          setShowSearch(false);
        }}
      />

      <main className={`flex-grow flex flex-col ${isImmersive ? 'pt-0' : 'pt-8'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={
              currentScreen === 'product'
                ? `product-${currentProductId ?? 'default'}-${locale}`
                : `${currentScreen}-${locale}`
            }
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="flex-grow flex flex-col"
          >
            <PageContent
              currentScreen={currentScreen}
              currentProductId={currentProductId}
              memberSection={memberSection}
              navigateToScreen={navigateToScreen}
              navigateToProduct={navigateToProduct}
              setIsImmersive={setIsImmersive}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {!isImmersive && <Footer setScreen={navigateToScreen} />}
      <PwaInstallBanner />
      <UpdatePrompt />
      <PushPermissionPrompt />
    </div>
  );
}
