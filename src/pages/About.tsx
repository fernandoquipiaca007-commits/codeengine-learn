import { motion } from 'motion/react';
import { Sparkles, Target, Rocket, Users, Zap, Globe } from 'lucide-react';
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

  const stats = [
    { number: '10K+', label: t('about.stats.activeMembers') },
    { number: '500+', label: t('about.stats.premiumContent') },
    { number: '98%', label: t('about.stats.satisfaction') },
    { number: '24/7', label: t('about.stats.support') }
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
    <div className="pt-24 pb-12 px-4 sm:px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <header className="mb-10 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="animate__animated animate__fadeInDown font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            {t('about.heroTitle')}
          </h1>
          <p className="animate__animated animate__fadeInUp font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            {t('about.heroSubtitle')}
          </p>
        </motion.div>
      </header>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-16"
      >
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
              },
            },
          }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-panel rounded-2xl p-8 text-center relative group hover:scale-105 transition-transform duration-300 animate__animated animate__slideInUp"
            >
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="font-display text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-white mb-2">
                {stat.number}
              </div>
              <div className="font-sans text-sm text-on-surface-variant uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-16"
      >
        <h2 className="animate__animated animate__slideInLeft font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-16">
          {t('about.whatMovesUs')}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="glass-card glass-card-hover rounded-2xl p-8 relative group"
            >
              <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-semibold text-white mb-4">
                {value.title}
              </h3>
              
              <p className="font-sans text-on-surface-variant leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-16"
      >
        <h2 className="animate__animated animate__slideInRight font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-16">
          {t('about.whyChoose')}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-panel rounded-2xl p-8 relative group hover:scale-105 transition-transform duration-300"
            >
              <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0"></div>
              
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="font-display text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Manifesto Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mb-16"
      >
        <div className="glass-panel rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(192,193,255,0.2)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          
          <h2 className="font-display text-4xl font-bold text-white mb-8">
            {t('about.manifesto')}
          </h2>
          
          <div className="space-y-6 font-sans text-lg text-on-surface-variant leading-relaxed max-w-3xl">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center"
      >
        <h2 className="font-display text-4xl font-bold text-white mb-6">
          {t('about.readyToStart')}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant mb-8 max-w-2xl mx-auto">
          {t('about.readyToStartDesc')}
        </p>
        <button
          onClick={() => setScreen('library')}
          className="font-display text-sm font-semibold tracking-widest uppercase px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all duration-300"
        >
          {t('about.exploreLibrary')}
        </button>
      </motion.section>
    </div>
  );
}
