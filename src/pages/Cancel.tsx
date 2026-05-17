import { XCircle, ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CancelProps {
  setScreen?: (screen: string) => void;
}

export function Cancel({ setScreen }: CancelProps) {
  const { t } = useTranslation('pages');

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 max-w-[800px] mx-auto">
      {/* Cancel Icon */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/20 border-2 border-yellow-500 mb-6">
          <XCircle className="w-12 h-12 text-yellow-500" />
        </div>
        
        <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-4">
          {t('cancel.heading')}
        </h1>
        
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {t('cancel.description')}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 mb-12">
        {/* What Happened */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
              {t('cancel.whatHappened')}
            </h3>
            <p className="font-sans text-sm text-on-surface-variant">
              {t('cancel.whatHappenedDesc')}
            </p>
          </div>
        </div>

        {/* Try Again */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
              {t('cancel.tryAgain')}
            </h3>
            <p className="font-sans text-sm text-on-surface-variant">
              {t('cancel.tryAgainDesc')}
            </p>
          </div>
        </div>

        {/* Need Help */}
        <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
              {t('cancel.needHelp')}
            </h3>
            <p className="font-sans text-sm text-on-surface-variant mb-3">
              {t('cancel.needHelpDesc')}
            </p>
            <a
              href="mailto:support@codeengine.learn"
              className="font-display text-sm font-semibold text-primary hover:text-secondary transition-colors"
            >
              support@codeengine.learn
            </a>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => setScreen && setScreen('library')}
          className="bg-primary text-on-primary font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t('cancel.viewProducts')}
        </button>
        
        <button
          onClick={() => setScreen && setScreen('home')}
          className="glass-panel border border-white/10 text-on-surface font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-surface-high transition-all"
        >
          {t('cancel.goHome')}
        </button>
      </div>

      {/* Common Issues */}
      <div className="mt-16 glass-panel p-8 rounded-2xl">
        <h2 className="font-display text-2xl font-bold text-on-surface mb-6 text-center">
          {t('cancel.commonIssues')}
        </h2>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-display font-semibold text-on-surface mb-2">
              {t('cancel.cardDeclined')}
            </h4>
            <p className="font-sans text-sm text-on-surface-variant">
              {t('cancel.cardDeclinedDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-on-surface mb-2">
              {t('cancel.securityConcern')}
            </h4>
            <p className="font-sans text-sm text-on-surface-variant">
              {t('cancel.securityConcernDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-on-surface mb-2">
              {t('cancel.productQuestions')}
            </h4>
            <p className="font-sans text-sm text-on-surface-variant">
              {t('cancel.productQuestionsDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
