// ============================================
// Rewards — Points & Rewards Explainer Page
// ============================================

import { motion } from 'motion/react';
import {
  Star, Gift, Share2, ShoppingCart, BookOpen,
  TrendingUp, Zap, Crown, Award, ArrowRight,
  Ticket, Sparkles, Trophy, Medal, Gem
} from 'lucide-react';

interface RewardsProps {
  setScreen?: (screen: string) => void;
}

const LEVELS = [
  { name: 'Starter', icon: Star, threshold: 0, multiplier: '1x', color: 'from-gray-500 to-gray-600', border: 'border-gray-500/30', iconColor: 'text-gray-400' },
  { name: 'Bronze', icon: Award, threshold: 100, multiplier: '1.2x', color: 'from-amber-700 to-amber-800', border: 'border-amber-700/30', iconColor: 'text-amber-600' },
  { name: 'Silver', icon: Medal, threshold: 500, multiplier: '1.5x', color: 'from-slate-400 to-slate-500', border: 'border-slate-400/30', iconColor: 'text-slate-300' },
  { name: 'Gold', icon: Crown, threshold: 2000, multiplier: '2x', color: 'from-yellow-500 to-yellow-600', border: 'border-yellow-500/30', iconColor: 'text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
  { name: 'Platinum', icon: Gem, threshold: 5000, multiplier: '3x', color: 'from-purple-500 to-purple-600', border: 'border-purple-500/30', iconColor: 'text-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.3)]' },
];

const EARN_METHODS = [
  { icon: ShoppingCart, title: 'Compre Produtos', desc: 'Ganhe 10 pontos por cada compra realizada na plataforma.', points: '+10 pts' },
  { icon: Share2, title: 'Partilhe Links', desc: 'Ganhe 5 pontos cada vez que alguém comprar através do seu link de referência.', points: '+5 pts' },
  { icon: BookOpen, title: 'Complete Conteúdos', desc: 'Ganhe 3 pontos ao completar cursos, módulos ou leituras.', points: '+3 pts' },
  { icon: TrendingUp, title: 'Suba de Nível', desc: 'Pontos bónus automáticos ao atingir cada novo nível.', points: 'Bónus' },
];

const REWARD_TYPES = [
  { icon: Ticket, title: 'Cupons de Desconto', desc: 'Receba cupons reais que pode usar no checkout. Os descontos variam de 5% a 30% dependendo do seu nível.' },
  { icon: Zap, title: 'Acesso Antecipado', desc: 'Seja o primeiro a aceder a novos produtos e conteúdos antes do lançamento público.' },
  { icon: Sparkles, title: 'Pontos Bónus', desc: 'Receba pontos extra para acelerar a sua progressão e desbloquear mais recompensas.' },
  { icon: Crown, title: 'Ofertas Exclusivas', desc: 'Acesso a promoções e produtos especiais reservados apenas para membros de nível superior.' },
];

export function Rewards({ setScreen }: RewardsProps) {
  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-16 max-w-[1100px] mx-auto min-h-screen">

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-primary/30 mb-6 animate__animated animate__fadeInDown">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-primary">
            Programa de Recompensas
          </span>
        </div>
        <h1 className="animate__animated animate__slideInDown font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-on-surface tracking-[-0.04em] mb-6">
          Ganhe Pontos,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Desbloqueie Recompensas
          </span>
        </h1>
        <p className="animate__animated animate__fadeInUp font-sans text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
          Cada ação na plataforma vale pontos. Compre, partilhe, aprenda — e receba descontos reais,
          acesso exclusivo e muito mais.
        </p>
      </motion.section>

      {/* How to Earn Points */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h2 className="animate__animated animate__fadeInDown font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Como Ganhar Pontos
          </h2>
          <p className="animate__animated animate__fadeInUp text-on-surface-variant text-sm sm:text-base max-w-lg mx-auto">
            Existem várias formas de acumular pontos na plataforma
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {EARN_METHODS.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <m.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-base font-semibold text-on-surface">{m.title}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 font-mono text-xs font-bold">
                      {m.points}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{m.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Level System */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Sistema de Níveis
          </h2>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-lg mx-auto">
            Suba de nível para desbloquear multiplicadores de pontos e recompensas melhores
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {LEVELS.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className={`glass-panel rounded-xl p-5 border ${level.border} relative overflow-hidden`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 sm:p-2.5 rounded-full bg-white/5 border border-white/10 ${level.iconColor} shadow-[0_0_15px_rgba(255,255,255,0.02)] flex-shrink-0 flex items-center justify-center`}>
                  <level.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-bold text-on-surface">{level.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white font-mono text-xs font-bold`}>
                      {level.multiplier}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {level.threshold === 0 ? 'Nível inicial' : `A partir de ${level.threshold.toLocaleString()} pontos`}
                  </p>
                </div>
                {i < LEVELS.length - 1 && (
                  <div className="hidden sm:flex items-center gap-2 text-on-surface-variant/40">
                    <ArrowRight className="w-5 h-5" />
                    <span className="font-mono text-xs">{LEVELS[i + 1].threshold.toLocaleString()} pts</span>
                  </div>
                )}
              </div>
              {/* Background glow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${level.color} opacity-[0.03] pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Reward Types */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h2 className="animate__animated animate__fadeInDown font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Tipos de Recompensas
          </h2>
          <p className="animate__animated animate__fadeInUp text-on-surface-variant text-sm sm:text-base max-w-lg mx-auto">
            Desbloqueia recompensas reais que pode utilizar na plataforma
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {REWARD_TYPES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="glass-panel rounded-2xl p-6 border border-white/10"
            >
              <div className="p-3 rounded-xl bg-secondary/10 w-fit mb-4">
                <r.icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-display text-base font-semibold text-on-surface mb-2">{r.title}</h3>
              <p className="text-sm text-on-surface-variant">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How to Use */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Como Utilizar
          </h2>
        </div>
        <div className="glass-panel rounded-2xl p-8 border border-primary/20">
          <div className="space-y-6">
            {[
              { step: 1, title: 'Acumule Pontos', desc: 'Compre produtos, partilhe links e complete conteúdos para ganhar pontos.' },
              { step: 2, title: 'Suba de Nível', desc: 'Os seus pontos determinam o seu nível. Níveis mais altos dão multiplicadores maiores.' },
              { step: 3, title: 'Desbloqueie Recompensas', desc: 'Vá à sua área de membro e clique em "Liberar Recompensa" nas recompensas disponíveis.' },
              { step: 4, title: 'Use o Cupom', desc: 'Copie o código do cupom gerado e cole no campo de desconto ao comprar qualquer produto.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-primary text-lg">
                  {s.step}
                </div>
                <div>
                  <h4 className="font-display font-semibold text-on-surface mb-1">{s.title}</h4>
                  <p className="text-sm text-on-surface-variant">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-primary/20">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Pronto para Começar?
          </h2>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            Aceda à sua área de membro para ver os seus pontos, nível e recompensas disponíveis.
          </p>
          <button
            onClick={() => setScreen && setScreen('member')}
            className="bg-on-surface text-background font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-primary hover:text-on-primary transition-all inline-flex items-center gap-3 group"
          >
            Minha Área
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.section>
    </div>
  );
}
