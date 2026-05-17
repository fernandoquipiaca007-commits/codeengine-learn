import { motion } from 'motion/react';
import { Award, Users, Building, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LicensingProps {
  setScreen: (screen: string) => void;
}

export function Licensing({ setScreen }: LicensingProps) {
  const { t } = useTranslation('pages');
  
  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden">
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              {t('licensing.badge')}
            </span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            {t('licensing.heading')}
          </h1>
          
          <p className="font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            {t('licensing.subtitle')}
          </p>
        </motion.div>
      </header>

      <div className="grid md:grid-cols-2 gap-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-4">
            {t('licensing.personalLicense')}
          </h2>
          <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-6">
            {t('licensing.personalDesc')}
          </p>
          <ul className="space-y-3 mb-6">
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.personalFeatures.unlimited')}</span>
            </li>
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.personalFeatures.updates')}</span>
            </li>
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.personalFeatures.support')}</span>
            </li>
          </ul>
          <div className="font-display text-3xl font-bold text-white">
            {t('licensing.personalPrice')}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 border border-primary/30">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-4">
            {t('licensing.commercialLicense')}
          </h2>
          <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-6">
            {t('licensing.commercialDesc')}
          </p>
          <ul className="space-y-3 mb-6">
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.commercialFeatures.commercial')}</span>
            </li>
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.commercialFeatures.multiple')}</span>
            </li>
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.commercialFeatures.priority')}</span>
            </li>
            <li className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{t('licensing.commercialFeatures.consulting')}</span>
            </li>
          </ul>
          <button
            onClick={() => setScreen('contact')}
            className="w-full font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-primary text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
          >
            {t('licensing.requestQuote')}
          </button>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 glass-panel rounded-2xl p-4 sm:p-6 md:p-8 max-w-4xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
              {t('licensing.questionsTitle')}
            </h2>
            <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-4">
              {t('licensing.questionsDesc')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setScreen('contact')}
                className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-primary text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
              >
                {t('licensing.contactUs')}
              </button>
              <a
                href={`https://wa.me/244957459336?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre licenciamento.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full glass-panel border border-white/10 text-on-surface hover:text-primary hover:border-primary/30 transition-all"
              >
                {t('licensing.whatsapp')}
              </a>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
