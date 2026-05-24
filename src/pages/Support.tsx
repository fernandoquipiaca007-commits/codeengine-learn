import { motion } from 'motion/react';
import { Headphones, MessageCircle, Mail, Book, Video, HelpCircle } from 'lucide-react';

interface SupportProps {
  setScreen: (screen: string) => void;
}

export function Support({ setScreen }: SupportProps) {
  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden">
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6 animate__animated animate__fadeInDown">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              Central de Suporte
            </span>
          </div>
          
          <h1 className="animate__animated animate__slideInLeft font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            Como Podemos Ajudar?
          </h1>
          
          <p className="animate__animated animate__fadeInUp font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            Nossa equipe está pronta para ajudar você a aproveitar ao máximo a CodeEngine 1. 
            Escolha o canal de suporte mais adequado para sua necessidade.
          </p>
        </motion.div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer animate__animated animate__slideInUp"
          onClick={() => setScreen('contact')}
        >
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-6">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">
            Formulário WhatsApp
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-4">
            Preencha o formulário de contato e envie sua mensagem direto pelo WhatsApp.
          </p>
          <p className="font-sans text-xs text-green-400 font-semibold">
            +244 957 459 336
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer animate__animated animate__slideInUp"
          onClick={() => window.open('https://wa.me/244957459336', '_blank')}
        >
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-6">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">
            WhatsApp
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-4">
            Fale conosco diretamente pelo WhatsApp para suporte rápido.
          </p>
          <p className="font-sans text-xs text-green-400 font-semibold">
            +244 957 459 336
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-8 hover:scale-105 transition-transform cursor-pointer animate__animated animate__slideInUp"
          onClick={() => setScreen('contact')}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">
            Formulário
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-4">
            Preencha nosso formulário detalhado para questões específicas.
          </p>
          <p className="font-sans text-xs text-primary font-semibold">
            Abrir formulário →
          </p>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 mb-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-8">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-6">
          {[
            {
              q: 'Como faço para acessar meus produtos?',
              a: 'Após a compra, acesse a área de membros e vá em "Minhas Compras". Todos os seus produtos estarão disponíveis para download.'
            },
            {
              q: 'Posso solicitar reembolso?',
              a: 'Sim, oferecemos garantia de 7 dias. Entre em contato conosco dentro deste prazo para solicitar reembolso.'
            },
            {
              q: 'Os produtos recebem atualizações?',
              a: 'Sim! Todos os produtos são atualizados regularmente e você recebe as atualizações gratuitamente.'
            },
            {
              q: 'Como funciona o suporte técnico?',
              a: 'Oferecemos suporte por email e WhatsApp. Membros premium têm suporte prioritário com resposta em até 12 horas.'
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-white/10 pb-6 last:border-0">
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                {faq.q}
              </h3>
              <p className="font-sans text-sm text-on-surface-variant">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
            <Book className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">
            Documentação
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-6">
            Acesse nossa documentação completa com guias, tutoriais e exemplos práticos.
          </p>
          <button className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full glass-panel border border-white/10 text-on-surface hover:text-primary hover:border-primary/30 transition-all">
            Em Breve
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-2xl font-bold text-white mb-3">
            Tutoriais em Vídeo
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-6">
            Assista tutoriais em vídeo para aprender a usar nossos produtos de forma eficiente.
          </p>
          <button className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full glass-panel border border-white/10 text-on-surface hover:text-primary hover:border-primary/30 transition-all">
            Em Breve
          </button>
        </div>
      </motion.section>
    </div>
  );
}
