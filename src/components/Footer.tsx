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
    <footer className="w-full py-10 px-6 flex flex-col items-center gap-6 bg-surface-lowest border-t border-outline/20 mt-16">
      <div className="font-display text-2xl font-black text-on-surface">
        CodeEngine 1
      </div>
      <div className="flex flex-wrap justify-center gap-6">
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
      <div className="font-sans text-base text-secondary opacity-60 text-center">
        © 2026 CodeEngine 1. {t('footer.tagline')}.
      </div>
    </footer>
  );
}
