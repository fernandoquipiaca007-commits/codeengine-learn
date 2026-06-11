import { motion } from 'motion/react';
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TermsProps {
  setScreen: (screen: string) => void;
}

export function Terms({ setScreen }: TermsProps) {
  const { t } = useTranslation('pages');

  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen overflow-x-hidden">
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              {t('terms.title')}
            </span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            {t('terms.heading')}
          </h1>
          
          <p className="font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            {t('terms.description')}
          </p>
          
          <p className="font-sans text-sm text-on-surface-variant mt-4">
            {t('terms.lastUpdate', { date: '13 de Maio de 2026' })}
          </p>
        </motion.div>
      </header>

      <div className="space-y-12 max-w-4xl">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                {t('terms.allowedUse')}
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                {t('terms.allowedUseDesc')}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 ml-14">
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.allowedItems.access')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.allowedItems.learn')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.allowedItems.apply')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.allowedItems.feedback')}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                {t('terms.prohibitedUse')}
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                {t('terms.prohibitedUseDesc')}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 ml-14">
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.prohibitedItems.redistribute')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.prohibitedItems.share')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.prohibitedItems.reverse')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.prohibitedItems.illegal')}
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • {t('terms.prohibitedItems.copyright')}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 border border-primary/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                {t('terms.questions')}
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-4">
                {t('terms.questionsDesc')}
              </p>
              <button
                onClick={() => setScreen('contact')}
                className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-primary text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
              >
                {t('terms.contactUs')}
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
