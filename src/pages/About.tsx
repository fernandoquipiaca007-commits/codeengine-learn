import { motion } from 'motion/react';
import { Target, Rocket, Sparkles, Zap, Users, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AboutProps {
  setScreen: (screen: string) => void;
}

export function About({ setScreen }: AboutProps) {
  const { t } = useTranslation('pages');
  
  const values = [
    {
      icon: Target,
      title: t('about.mission'),
      description: t('about.missionDesc')
    },
    {
      icon: Rocket,
      title: t('about.vision'),
      description: t('about.visionDesc')
    },
    {
      icon: Sparkles,
      title: t('about.values'),
      description: t('about.valuesDesc')
    }
  ];

  const features = [
    {
      icon: Zap,
      title: t('about.curatedContent'),
      description: t('about.curatedContentDesc')
    },
    {
      icon: Users,
      title: t('about.premiumCommunity'),
      description: t('about.premiumCommunityDesc')
    },
    {
      icon: Globe,
      title: t('about.globalAccess'),
      description: t('about.globalAccessDesc')
    }
  ];

  return (
    <div className="pt-20 pb-4 px-4 sm:px-6 md:px-12 max-w-[1080px] mx-auto">
      {/* Hero Section */}
      <header className="mb-6 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 mb-2">
            {t('about.heroTitle')}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-white/70 max-w-3xl leading-relaxed">
            {t('about.heroSubtitle')}
          </p>
        </motion.div>
      </header>

      {/* Values Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="font-display text-lg sm:text-xl font-bold text-white mb-4">
          {t('about.whatMovesUs')}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {values.map((value, index) => (
            <div
              key={index}
              className="overlay-elevated rounded-xl p-4 relative group"
            >
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.12)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
              
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-4 h-4 text-primary" />
              </div>
              
              <h3 className="font-display text-sm sm:text-base font-semibold text-white mb-1">
                {value.title}
              </h3>
              
              <p className="font-sans text-xs text-white/70 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6"
      >
        <h2 className="font-display text-lg sm:text-xl font-bold text-white mb-4">
          {t('about.whyChoose')}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="overlay-dark rounded-xl p-4 relative group hover:scale-105 transition-transform duration-300"
            >
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.12)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0"></div>
              
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2.5">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              
              <h3 className="font-display text-sm sm:text-base font-semibold text-white mb-1">
                {feature.title}
              </h3>
              
              <p className="font-sans text-xs text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Manifesto Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <div className="overlay-dark rounded-xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          
          <h2 className="font-display text-lg font-bold text-white mb-3">
            {t('about.manifesto')}
          </h2>
          
          <div className="space-y-2.5 font-sans text-xs sm:text-sm text-white/70 leading-relaxed max-w-3xl">
            <p>{t('about.manifestoP1')}</p>
            <p>{t('about.manifestoP2')}</p>
            <p>{t('about.manifestoP3')}</p>
            <p className="font-semibold text-primary">
              {t('about.manifestoP4')}
            </p>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-center"
      >
        <h2 className="font-display text-lg font-bold text-white mb-2">
          {t('about.readyToStart')}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-white/70 mb-3 max-w-2xl mx-auto">
          {t('about.readyToStartDesc')}
        </p>
        <button
          onClick={() => setScreen('library')}
          className="font-display text-[11px] font-semibold tracking-widest uppercase px-5 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all duration-300"
        >
          {t('about.exploreLibrary')}
        </button>
      </motion.section>
    </div>
  );
}
