import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { useUserCountry } from '../contexts/UserCountryContext';

export function CountryRequiredModal() {
  const { country, setUserCountry } = useUserCountry();
  const { t } = useTranslation('pages');
  const [selectedCountry, setSelectedCountry] = useState('AO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show if user's country is not set (null or empty string)
  const isVisible = !country || country.trim() === '';

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await setUserCountry(selectedCountry);
    } catch (err) {
      console.error('[CountryRequiredModal] Error saving country:', err);
      setError(t('countryModal.errorSave') || 'Erro ao guardar o país. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = [
    { code: 'AO', name: t('auth:countries.AO') || 'Angola', flag: '🇦🇴' },
    { code: 'PT', name: t('auth:countries.PT') || 'Portugal', flag: '🇵🇹' },
    { code: 'BR', name: t('auth:countries.BR') || 'Brasil', flag: '🇧🇷' },
    { code: 'FR', name: t('auth:countries.FR') || 'França', flag: '🇫🇷' },
    { code: 'US', name: t('auth:countries.US') || 'Estados Unidos', flag: '🇺🇸' },
    { code: 'OTHER', name: t('auth:countries.OTHER') || 'Outro', flag: '🌐' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop with blur - non-clickable */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Glassmorphic Panel */}
      <div className="relative w-full max-w-md bg-[#121216]/90 backdrop-blur-2xl rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-[scaleIn_0.3s_ease-out] z-10">
        {/* Glow Accents */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
            <Globe className="w-8 h-8" />
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-3">
            {t('countryModal.title') || 'Selecione o seu País'}
          </h2>

          <p className="font-sans text-sm text-on-surface-variant mb-6 leading-relaxed">
            {t('countryModal.description') || 'Para aceder às funcionalidades de monetização, precisamos saber em que país está registado.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#121216]/90 text-white font-sans text-sm outline-none focus:border-primary focus:bg-white/10 transition-all cursor-pointer appearance-none"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#121216] text-white">
                    {c.flag} &nbsp; {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedCountry}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-display text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common:saving') || 'A guardar...'}
                </>
              ) : (
                t('countryModal.confirm') || 'Confirmar País'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
