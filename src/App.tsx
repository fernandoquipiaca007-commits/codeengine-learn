import { useState, useEffect, lazy, Suspense, memo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavBar } from './components/NavBar';
import { useAuthSession } from './hooks/useAuthSession';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
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
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
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
const AffiliatesDashboard = lazy(() => import('./pages/AffiliatesDashboard').then(m => ({ default: m.AffiliatesDashboard })));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// ─── Page transition variants ─────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -4 },
};

const pageTransition: any = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.22,
};

export const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// ─── Module-level backend URL (shared across all hooks/effects) ───────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

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
  onOnboardingComplete,
  member,
  collabStatus,
}: {
  currentScreen: string;
  currentProductId: string | null;
  memberSection: string;
  navigateToScreen: (screen: string, section?: string) => void;
  navigateToProduct: (id: string, title?: string) => void;
  setIsImmersive: (v: boolean) => void;
  onOnboardingComplete?: () => void;
  member: any;
  collabStatus: string;
}) {
  // Determine user role from member profile or existing approved collaborator status
  const userRole: 'aluno' | 'criador' | null = member?.profile_data?.role ?? null;
  const isCriador = userRole === 'criador' || collabStatus === 'approved';
  const isAluno = !isCriador; // default: treat as student if no role set

  // Route guard: criador cannot access candidacy page, aluno cannot access colaborador panels
  const resolvedScreen = (() => {
    if (isCriador && currentScreen === 'colaborador-candidatura') return 'colaborador';
    if (isAluno && member && (currentScreen === 'colaborador' || currentScreen === 'colaborador-produtos')) return 'member';
    return currentScreen;
  })();

  return (
    <Suspense fallback={<PageLoader />}>
      {currentScreen === 'welcome' && (
        <Welcome setScreen={navigateToScreen} />
      )}
      {resolvedScreen === 'home' && (
        <Home setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {resolvedScreen === 'library' && (
        <Library setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {resolvedScreen === 'product' && (
        <Product setScreen={navigateToScreen} productId={currentProductId} />
      )}
      {resolvedScreen === 'auth' && <Auth setScreen={navigateToScreen} />}
      {resolvedScreen === 'signup' && <Auth setScreen={navigateToScreen} initialMode="signup" />}
      {resolvedScreen === 'reset-password' && <ResetPassword setScreen={navigateToScreen} />}
      {resolvedScreen === 'member' && (
        <Member
          key={memberSection}
          setScreen={navigateToScreen}
          onProductClick={navigateToProduct}
          initialSection={memberSection}
          onLearnViewChange={setIsImmersive}
        />
      )}
      {resolvedScreen === 'about' && <About setScreen={navigateToScreen} />}
      {resolvedScreen === 'releases' && (
        <Releases setScreen={navigateToScreen} onProductClick={navigateToProduct} />
      )}
      {resolvedScreen === 'contact' && <Contact setScreen={navigateToScreen} />}
      {resolvedScreen === 'favorites' && <Favorites setScreen={navigateToScreen} />}
      {resolvedScreen === 'news' && <News setScreen={navigateToScreen} />}
      {resolvedScreen === 'settings' && <Settings setScreen={navigateToScreen} />}
      {resolvedScreen === 'privacy' && <Privacy setScreen={navigateToScreen} />}
      {resolvedScreen === 'terms' && <Terms setScreen={navigateToScreen} />}
      {resolvedScreen === 'licensing' && <Licensing setScreen={navigateToScreen} />}
      {resolvedScreen === 'support' && <Support setScreen={navigateToScreen} />}
      {resolvedScreen === 'success' && <Success setScreen={navigateToScreen} />}
      {resolvedScreen === 'cancel' && <Cancel setScreen={navigateToScreen} />}
      {resolvedScreen === 'rewards' && <Rewards setScreen={navigateToScreen} />}
      {resolvedScreen === 'colaborador-candidatura' && (
        <CollaboratorApply
          setScreen={navigateToScreen}
          onCandidacyApproved={() => navigateToScreen('colaborador')}
        />
      )}
      {resolvedScreen === 'colaborador' && (
        <CollaboratorDashboard
          setScreen={navigateToScreen}
          onGoToProducts={() => navigateToScreen('colaborador-produtos')}
        />
      )}
      {resolvedScreen === 'colaborador-produtos' && (
        <CollaboratorProducts
          setScreen={navigateToScreen}
          setIsImmersive={setIsImmersive}
        />
      )}
      {resolvedScreen === 'afiliados' && (
        <AffiliatesDashboard
          setScreen={navigateToScreen}
        />
      )}
      {resolvedScreen === 'onboarding' && (
        <Onboarding onComplete={onOnboardingComplete || (() => navigateToScreen('home'))} />
      )}
    </Suspense>
  );
});

// Screens that should NOT be persisted (always reset to home on refresh)
const NON_PERSISTENT_SCREENS = new Set([
  'auth', 'signup', 'reset-password', 'success', 'cancel', 'onboarding'
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
  if (hasSpecialRoute) return 'welcome';
  const stored = sessionStorage.getItem('ce_last_screen');
  const valid = ['welcome','home','library','member','about','releases','contact',
    'favorites','news','settings','privacy','terms','licensing','support',
    'rewards','product', 'colaborador-candidatura', 'colaborador', 'colaborador-produtos', 'afiliados'];
  return (stored && valid.includes(stored)) ? stored : 'welcome';
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
  const { user, session, loading: authLoading } = useAuthSession();
  const [member, setMember] = useState<any>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [collabStatus, setCollabStatus] = useState<string>('not_applied');
  const [loadingCollabStatus, setLoadingCollabStatus] = useState(true);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const handleOnboardingComplete = () => {
    setMember((prev: any) => prev ? { ...prev, onboarding_completed: true } : { onboarding_completed: true });
    navigateToScreen('home');
  };

  const navigateToProduct = (productId: string, productTitle?: string) => {
    setCurrentProductId(productId);
    setScreen('product');
    // Push state to browser history
    const slug = productTitle ? slugify(productTitle) : productId;
    const state = { screen: 'product', productId, section: 'inicio' };
    window.history.pushState(state, '', `/product/${slug}`);
  };

  const navigateToScreen = (screen: string, section?: string) => {
    const sect = section || 'inicio';
    if (screen !== 'product') {
      setCurrentProductId(null);
    }

    if (screen === 'member') {
      setMemberSection(sect);
      setScreen(screen);
    } else {
      setMemberSection('inicio');
      setScreen(screen);
    }

    // Push state to browser history
    const state = { screen, productId: null, section: sect };
    let path = '/';
    if (screen !== 'welcome' && screen !== 'home') {
      if (screen === 'news') {
        path = '/news';
      } else {
        path = `/?screen=${screen}`;
        if (screen === 'member' && sect !== 'inicio') {
          path += `&section=${sect}`;
        }
      }
    }
    window.history.pushState(state, '', path);
  };

  // Listen to popstate event for browser back/forward navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state) {
        if (state.screen === 'product') {
          setCurrentProductId(state.productId || null);
          setScreen('product');
        } else {
          setCurrentProductId(null);
          if (state.screen === 'member') {
            setMemberSection(state.section || 'inicio');
            setScreen('member');
          } else {
            setMemberSection('inicio');
            setScreen(state.screen || 'welcome');
          }
        }
      } else {
        setCurrentProductId(null);
        setMemberSection('inicio');
        setScreen('welcome');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Real-time Traffic Tracking (Page Views & Active Users)
  useEffect(() => {
    let sessionId = sessionStorage.getItem('ce_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('ce_session_id', sessionId);
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
    const path = currentScreen === 'product' && currentProductId
      ? `/product/${currentProductId}`
      : `/${currentScreen}`;

    const sendPing = () => {
      fetch(`${backendUrl}/api/analytics/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, sessionId }),
      }).catch((err) => console.warn('[tracking] failed to send ping:', err));
    };

    sendPing();

    const interval = setInterval(sendPing, 30 * 1000);
    return () => clearInterval(interval);
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
      const slug = pathname.split('/product/')[1]?.split(/[?#/]/)[0];
      if (slug) {
        if (slug.length === 36 && slug.includes('-')) {
          // If it is a direct UUID, use it directly
          setCurrentProductId(slug);
          setScreen('product');
          window.history.replaceState({ screen: 'product', productId: slug, section: 'inicio' }, '', `/product/${slug}`);
        } else {
          // Fetch products from database to match slug to ID
          supabase.from('products').select('id, title').then(({ data }) => {
            const found = data?.find(p => slugify(p.title) === slug);
            if (found) {
              setCurrentProductId(found.id);
              setScreen('product');
              window.history.replaceState({ screen: 'product', productId: found.id, section: 'inicio' }, '', `/product/${slug}`);
            } else {
              // Fallback
              setScreen('home');
            }
          });
        }
        return;
      }
    }

    // Handle /news/ABC direct link (e.g. from web push)
    if (pathname.startsWith('/news/')) {
      const newsId = pathname.split('/news/')[1]?.split(/[?#/]/)[0];
      if (newsId) {
        sessionStorage.setItem('pendingNewsId', newsId);
        setScreen('news');
        window.history.replaceState({ screen: 'news', productId: null, section: 'inicio' }, '', `/news/${newsId}`);
        return;
      }
    } else if (pathname === '/news' || pathname === '/news/') {
      setScreen('news');
      window.history.replaceState({ screen: 'news', productId: null, section: 'inicio' }, '', `/news`);
      return;
    }

    // Handle /convite/:inviteCode or /invite/:inviteCode direct links
    if (pathname.startsWith('/convite/') || pathname.startsWith('/invite/')) {
      const parts = pathname.split('/');
      const inviteCode = parts[parts.length - 1]?.split(/[?#/]/)[0];
      if (inviteCode) {
        const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
        if (inviteCode.length === 36) {
          localStorage.setItem('ce_founder_ref', JSON.stringify({ userId: inviteCode, expiry }));
        } else {
          supabase
            .from('members')
            .select('auth_id')
            .eq('referral_code', inviteCode)
            .maybeSingle()
            .then(({ data }) => {
              if (data?.auth_id) {
                localStorage.setItem('ce_founder_ref', JSON.stringify({ userId: data.auth_id, expiry }));
              }
            });
        }
        // Redirect to welcome screen cleanly
        setScreen('welcome');
        window.history.replaceState({ screen: 'welcome', productId: null, section: 'inicio' }, '', '/');
        return;
      }
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

    // Save founder invitation link if present (?invite=AUTH_USER_ID or ?invite=REFERRAL_CODE)
    // This is separate from ?ref= which is for product affiliate tracking
    const invite = params.get('invite');
    if (invite) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (invite.length === 36) {
        localStorage.setItem('ce_founder_ref', JSON.stringify({ userId: invite, expiry }));
      } else {
        // Query supabase to resolve referral_code to auth_id
        supabase
          .from('members')
          .select('auth_id')
          .eq('referral_code', invite)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.auth_id) {
              localStorage.setItem('ce_founder_ref', JSON.stringify({ userId: data.auth_id, expiry }));
            }
          });
      }
      // Clean the invite param from URL to avoid leaking auth IDs in browser history
      params.delete('invite');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
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

    // Handle affiliate pathnames
    if (pathname === '/afiliados' || pathname === '/afiliados/' || pathname === '/afiliado' || pathname === '/afiliado/') {
      setScreen('afiliados');
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
    let active = true;
    async function loadMember() {
      if (user?.id) {
        setLoadingMember(true);
        try {
          const { data: mem } = await supabase
            .from('members')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();
          
          if (!active) return;
          
          let currentMem = mem;
          // Handle purchase flow flags if pendingCheckout exists
          const hasPendingCheckout = sessionStorage.getItem('pendingCheckout') !== null;
          if (hasPendingCheckout && mem && (!mem.onboarding_deferred || !mem.purchase_flow_started)) {
            const { data: updatedMem } = await supabase
              .from('members')
              .update({
                onboarding_deferred: true,
                purchase_flow_started: true
              })
              .eq('auth_id', user.id)
              .select()
              .single();
            if (updatedMem && active) currentMem = updatedMem;
          }
          setMember(currentMem);

          // Fetch collaborator status — needed to identify pre-existing creators
          // Uses module-level BACKEND_URL (fixes TS2304 scope bug)
          try {
            const resStatus = await fetch(`${BACKEND_URL}/api/collaborators/status`, {
              headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const dataStatus = await resStatus.json();
            if (active) {
              setCollabStatus(dataStatus.success ? dataStatus.status : 'not_applied');
            }
          } catch {
            // Non-fatal: fall back to role-only check
            if (active) setCollabStatus('not_applied');
          } finally {
            if (active) setLoadingCollabStatus(false);
          }

          lastFetchedUserIdRef.current = user.id;
          setLoadingMember(false);
        } catch (err) {
          console.error('[App] Error loading member:', err);
          if (active) {
            setMember(null);
            lastFetchedUserIdRef.current = user.id;
            setLoadingMember(false);
            setLoadingCollabStatus(false);
          }
        }
      } else {
        if (active) {
          setMember(null);
          setCollabStatus('not_applied');
          setLoadingCollabStatus(false);
          lastFetchedUserIdRef.current = null;
          setLoadingMember(false);
        }
      }
    }
    if (!authLoading) {
      void loadMember();
    } else {
      setLoadingMember(true);
    }
    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

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
          const oauthRole = sessionStorage.getItem('ce_oauth_registration_role') || 'aluno';
          sessionStorage.removeItem('ce_oauth_registration_role');

          // Welcome API call — passes selected role in the request body for server persistence
          fetch(`${BACKEND_URL}/api/auth/welcome`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              Authorization: `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ role: oauthRole })
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

          // Check role in DB before redirecting — use async IIFE since callback can't be async
          void (async () => {
            try {
              let { data: memData } = await supabase
                .from('members')
                .select('id, profile_data')
                .eq('auth_id', session.user.id)
                .maybeSingle();
              
              let role = memData?.profile_data?.role;
              
              if (oauthRole === 'criador' && role !== 'criador') {
                if (memData) {
                  const updatedProfile = { ...(memData.profile_data || {}), role: 'criador' };
                  await supabase
                    .from('members')
                    .update({ profile_data: updatedProfile })
                    .eq('id', memData.id);
                  role = 'criador';
                } else {
                  // Retry if trigger/welcome hasn't created the member row yet
                  await new Promise(resolve => setTimeout(resolve, 800));
                  const { data: retryMem } = await supabase
                    .from('members')
                    .select('id, profile_data')
                    .eq('auth_id', session.user.id)
                    .maybeSingle();
                  if (retryMem) {
                    const updatedProfile = { ...(retryMem.profile_data || {}), role: 'criador' };
                    await supabase
                      .from('members')
                      .update({ profile_data: updatedProfile })
                      .eq('id', retryMem.id);
                    role = 'criador';
                  }
                }
              } else if (!role && oauthRole) {
                if (memData) {
                  const updatedProfile = { ...(memData.profile_data || {}), role: oauthRole };
                  await supabase
                    .from('members')
                    .update({ profile_data: updatedProfile })
                    .eq('id', memData.id);
                  role = oauthRole;
                } else {
                  // Retry if trigger/welcome hasn't created the member row yet
                  await new Promise(resolve => setTimeout(resolve, 800));
                  const { data: retryMem } = await supabase
                    .from('members')
                    .select('id, profile_data')
                    .eq('auth_id', session.user.id)
                    .maybeSingle();
                  if (retryMem) {
                    const updatedProfile = { ...(retryMem.profile_data || {}), role: oauthRole };
                    await supabase
                      .from('members')
                      .update({ profile_data: updatedProfile })
                      .eq('id', retryMem.id);
                    role = oauthRole;
                  }
                }
              }
              
              navigateToScreen(role === 'criador' ? 'colaborador' : 'member');
            } catch (err) {
              console.error('[OAuth redirect] Error determining role:', err);
              navigateToScreen('member');
            }
          })();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigateToScreen, navigateToProduct]);

  // Onboarding mandatory redirection lock
  // Guards: wait for BOTH loadingMember AND loadingCollabStatus to resolve
  // This prevents the flash where onboarding shows before collabStatus is known
  useEffect(() => {
    if (authLoading || loadingMember || loadingCollabStatus) return;
    if (user && lastFetchedUserIdRef.current === user.id) {
      const userRole = member?.profile_data?.role;
      // Criadores não passam pelo onboarding (novos ou já aprovados)
      const isCriadorUser = userRole === 'criador' || collabStatus === 'approved';
      if (isCriadorUser) return;
      const isCompleted = member ? member.onboarding_completed === true : false;
      if (!isCompleted) {
        const isPurchase = sessionStorage.getItem('pendingCheckout') !== null;
        if (!isPurchase && currentScreen !== 'onboarding') {
          setScreen('onboarding');
        }
      }
    }
  }, [user, member, authLoading, loadingMember, loadingCollabStatus, currentScreen, collabStatus]);

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
      {!isImmersive && !['auth', 'signup', 'onboarding'].includes(currentScreen) && (
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

      <main className="flex-grow flex flex-col pt-0">
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
              onOnboardingComplete={handleOnboardingComplete}
              member={member}
              collabStatus={collabStatus}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {!isImmersive && !['welcome', 'member','colaborador','colaborador-candidatura','colaborador-produtos','afiliados','settings', 'onboarding'].includes(currentScreen) && (
        <Footer setScreen={navigateToScreen} />
      )}
      <PwaInstallBanner />
      <PushPermissionPrompt />
    </div>
  );
}
