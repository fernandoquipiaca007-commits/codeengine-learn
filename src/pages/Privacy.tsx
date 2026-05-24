import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

interface PrivacyProps {
  setScreen: (screen: string) => void;
}

export function Privacy({ setScreen }: PrivacyProps) {
  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              Política de Privacidade
            </span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            Sua Privacidade é Nossa Prioridade
          </h1>
          
          <p className="font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            Na CodeEngine 1, levamos a proteção dos seus dados a sério. Esta política descreve como coletamos, 
            usamos e protegemos suas informações pessoais.
          </p>
          
          <p className="font-sans text-sm text-on-surface-variant mt-4">
            Última atualização: 13 de Maio de 2026
          </p>
        </motion.div>
      </header>

      {/* Content Sections */}
      <div className="space-y-12 max-w-4xl">
        {/* Section 1 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Informações que Coletamos
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                Coletamos apenas as informações necessárias para fornecer nossos serviços.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 ml-0 sm:ml-14">
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-white mb-2">
                Informações de Cadastro
              </h3>
              <ul className="font-sans text-sm text-on-surface-variant space-y-2">
                <li>• Nome completo</li>
                <li>• Endereço de email</li>
                <li>• Senha (criptografada)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                Informações de Uso
              </h3>
              <ul className="font-sans text-sm text-on-surface-variant space-y-2">
                <li>• Produtos visualizados e adquiridos</li>
                <li>• Histórico de downloads</li>
                <li>• Preferências e favoritos</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Section 2 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Como Usamos Suas Informações
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                Utilizamos seus dados exclusivamente para melhorar sua experiência.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 ml-14">
            <p className="font-sans text-sm text-on-surface-variant">
              • Processar suas compras e fornecer acesso aos produtos
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Enviar notificações sobre novos produtos e atualizações
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Personalizar recomendações de conteúdo
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Melhorar nossos serviços e experiência do usuário
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Comunicar sobre suporte e atualizações importantes
            </p>
          </div>
        </motion.section>

        {/* Section 3 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Proteção de Dados
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                Implementamos medidas de segurança rigorosas para proteger suas informações.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 ml-14">
            <p className="font-sans text-sm text-on-surface-variant">
              • Criptografia SSL/TLS em todas as comunicações
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Senhas armazenadas com hash seguro
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Acesso restrito aos dados pessoais
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Backups regulares e seguros
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • Monitoramento contínuo de segurança
            </p>
          </div>
        </motion.section>

        {/* Section 4 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Seus Direitos
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant">
                Você tem controle total sobre seus dados pessoais.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 ml-14">
            <p className="font-sans text-sm text-on-surface-variant">
              • <strong className="text-white">Acesso:</strong> Solicitar cópia dos seus dados
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • <strong className="text-white">Correção:</strong> Atualizar informações incorretas
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • <strong className="text-white">Exclusão:</strong> Solicitar remoção dos seus dados
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • <strong className="text-white">Portabilidade:</strong> Exportar seus dados
            </p>
            <p className="font-sans text-sm text-on-surface-variant">
              • <strong className="text-white">Opt-out:</strong> Cancelar notificações a qualquer momento
            </p>
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 border border-primary/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Dúvidas sobre Privacidade?
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant mb-4">
                Entre em contato conosco para esclarecer qualquer questão sobre como tratamos seus dados.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setScreen('contact')}
                  className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-primary text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
                >
                  Fale Conosco
                </button>
                <a
                  href="mailto:codeengine2@gmail.com"
                  className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full glass-panel border border-white/10 text-on-surface hover:text-primary hover:border-primary/30 transition-all"
                >
                  codeengine2@gmail.com
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
