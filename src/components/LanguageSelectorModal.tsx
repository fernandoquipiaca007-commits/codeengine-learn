import { X, Globe, ChevronRight } from 'lucide-react';
import { AppLocale } from '../lib/locale';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (locale: AppLocale) => void;
  title?: string;
  subtitle?: string;
  availableLanguages?: AppLocale[];
}

export function LanguageSelectorModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Selecione o Idioma',
  subtitle = 'Escolha sua tradução preferida antes de continuar',
  availableLanguages,
}: LanguageSelectorModalProps) {
  if (!isOpen) return null;

  const allLanguages: { code: AppLocale; name: string; nativeName: string; flag: string }[] = [
    { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  ];

  const languages = availableLanguages
    ? allLanguages.filter((l) => availableLanguages.includes(l.code))
    : allLanguages;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Glassmorphic Panel */}
      <div className="relative w-full max-w-md bg-[#121216]/98 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden animate-[scaleIn_0.3s_ease-out]">
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white leading-tight">
                {title}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant mt-1">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lang options */}
        <div className="relative z-10 space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-white/15 bg-white/10 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(192,193,255,0.15)] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
                <div className="text-left">
                  <div className="font-display font-semibold text-white text-sm group-hover:text-primary transition-colors">
                    {lang.name}
                  </div>
                  <div className="font-sans text-xs text-on-surface-variant">
                    {lang.nativeName}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
