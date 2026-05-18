import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Background3D } from './components/Background3D';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Product } from './pages/Product';
import { Auth } from './pages/Auth';
import { Member } from './pages/Member';
import { About } from './pages/About';
import { Releases } from './pages/Releases';
import { Contact } from './pages/Contact';
import { Favorites } from './pages/Favorites';
import { News } from './pages/News';
import { Settings } from './pages/Settings';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Licensing } from './pages/Licensing';
import { Support } from './pages/Support';
import { Success } from './pages/Success';
import { Cancel } from './pages/Cancel';
import { Rewards } from './pages/Rewards';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { UpdatePrompt } from './components/UpdatePrompt';
import { PushPermissionPrompt } from './components/PushPermissionPrompt';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition: any = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

export default function App() {
  const [currentScreen, setScreen] = useState('home');
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [memberSection, setMemberSection] = useState<string>('inicio');
  const [showSearch, setShowSearch] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    const pathname = window.location.pathname;

    // Save referral code if present (works with any URL)
    const ref = params.get('ref');
    if (ref) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('ce_referral_code', JSON.stringify({ code: ref, expiry }));
    }

    // Handle ?screen=success or ?screen=cancel
    if (screen === 'success' || screen === 'cancel') {
      setScreen(screen);
      // Remove o parâmetro da URL para não prender o utilizador no refresh
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Handle ?screen=product&id=XYZ (referral link to specific product)
    if (screen === 'product') {
      const productId = params.get('id');
      if (productId) {
        navigateToProduct(productId);
        // Clean URL but keep in history
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
    }

    // Handle any ?screen= parameter
    if (screen && screen !== 'product') {
      setScreen(screen);
      window.history.replaceState({}, '', '/');
    }
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

  return (
    <div className="relative min-h-screen flex flex-col text-on-surface overflow-x-hidden max-w-[100vw]">
      <Background3D />
      <NavBar
        currentScreen={currentScreen}
        setScreen={navigateToScreen}
        onSearchClick={() => setShowSearch(true)}
      />

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

      <main className="flex-grow flex flex-col pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen === 'product' ? `product-${currentProductId ?? 'default'}` : currentScreen}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="flex-grow flex flex-col"
          >
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
            {currentScreen === 'member' && (
              <Member
                key={memberSection}
                setScreen={navigateToScreen}
                onProductClick={navigateToProduct}
                initialSection={memberSection}
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
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer setScreen={navigateToScreen} />
      <PwaInstallBanner />
      <UpdatePrompt />
      <PushPermissionPrompt />
    </div>
  );
}
