import { useTranslation } from 'react-i18next';

interface FooterProps {
  setScreen?: (screen: string) => void;
}

export function Footer({ setScreen }: FooterProps = {}) {
  const { t } = useTranslation();
  
  const handleNavigation = (screen: string) => {
    if (setScreen) {
      setScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full py-8 px-6 flex flex-col items-center gap-4 bg-surface-lowest border-t border-outline/10 mt-16">
      <div className="font-display text-xl font-black text-on-surface/90 tracking-tighter">
        CodeEngine 1
      </div>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        <button 
          onClick={() => handleNavigation('privacy')}
          className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors focus:underline focus:underline-offset-4"
        >
          {t('footer.privacy')}
        </button>
        <button 
          onClick={() => handleNavigation('terms')}
          className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors focus:underline focus:underline-offset-4"
        >
          {t('footer.terms')}
        </button>
        <button 
          onClick={() => handleNavigation('licensing')}
          className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors focus:underline focus:underline-offset-4"
        >
          {t('footer.licensing')}
        </button>
        <button 
          onClick={() => handleNavigation('support')}
          className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors focus:underline focus:underline-offset-4"
        >
          {t('footer.support')}
        </button>
        <button 
          onClick={() => handleNavigation('rewards')}
          className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors focus:underline focus:underline-offset-4"
        >
          Recompensas
        </button>
      </div>
      <div className="font-sans text-xs text-on-surface-variant opacity-40 text-center mt-2">
        © 2026 CodeEngine 1. {t('footer.tagline')}.
      </div>
    </footer>
  );
}
