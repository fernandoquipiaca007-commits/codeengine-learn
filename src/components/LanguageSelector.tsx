import { Globe } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { AppLocale } from '../lib/locale';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

const LANGUAGES = [
  { code: 'pt' as AppLocale, name: 'PT', flag: '🇧🇷' },
  { code: 'en' as AppLocale, name: 'EN', flag: '🇺🇸' },
  { code: 'fr' as AppLocale, name: 'FR', flag: '🇫🇷' },
];

export function LanguageSelector({ variant = 'dropdown', className = '' }: LanguageSelectorProps) {
  const { locale, setLocale, isLoading } = useLocale();

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            disabled={isLoading}
            className={`
              px-2.5 py-1.5 rounded-lg font-sans text-xs font-medium transition-all
              ${locale === lang.code
                ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(192,193,255,0.3)]'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="mr-1.5">{lang.flag}</span>
            {lang.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container border border-white/10">
        <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as AppLocale)}
          disabled={isLoading}
          className="bg-transparent text-on-surface font-sans text-xs font-semibold focus:outline-none cursor-pointer pr-1"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-surface text-on-surface text-sm">
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
