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

  const links = [
    { key: 'privacy',   label: t('footer.privacy') },
    { key: 'terms',     label: t('footer.terms') },
    { key: 'licensing', label: t('footer.licensing') },
    { key: 'support',   label: t('footer.support') },
    { key: 'rewards',   label: 'Recompensas' },
  ];

  return (
    <footer className="w-full py-6 px-6 flex flex-col items-center gap-3 border-t border-white/5">
      <div className="font-display text-sm font-bold text-on-surface/60 tracking-tight">
        CodeEngine 1
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {links.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleNavigation(key)}
            className="font-sans text-[10px] font-medium tracking-wider uppercase text-on-surface-variant/50 hover:text-primary transition-colors duration-200"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="font-sans text-[9px] text-on-surface-variant/30 text-center">
        © 2026 CodeEngine 1. {t('footer.tagline')}.
      </div>
    </footer>
  );
}
