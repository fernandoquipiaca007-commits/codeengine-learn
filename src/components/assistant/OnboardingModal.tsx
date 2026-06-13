import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Bot, HelpCircle, Check, Loader2, PartyPopper } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'loading' | 'welcome'>('intro');
  const [referralSource, setReferralSource] = useState('');
  const [wantsToLearn, setWantsToLearn] = useState('');
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [otherWantsToLearn, setOtherWantsToLearn] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [userName, setUserName] = useState('Membro');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      }
    });
  }, []);

  const handleNext = () => {
    if (step === 'intro') setStep('q1');
    else if (step === 'q1') setStep('q2');
    else if (step === 'q2') setStep('q3');
    else if (step === 'q3') setStep('q4');
    else if (step === 'q4') handleSave();
  };

  const handleSave = async () => {
    setStep('loading');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      let onboardingSaved = false;
      let conversationIdVal: string | null = null;
      let retrievedWelcomeMessage = '';

      try {
        const response = await fetch(`${backendUrl}/api/assistant/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            referralSource,
            wantsToLearn: wantsToLearn === 'Outro' ? otherWantsToLearn : wantsToLearn,
            goal,
            difficulty
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            onboardingSaved = true;
            conversationIdVal = result.conversationId;
          }
        }
      } catch (apiErr) {
        console.warn('API onboarding save failed, falling back to direct Supabase storage:', apiErr);
      }

      // Fallback: save directly to Supabase if API call failed
      if (!onboardingSaved) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (member) {
          // Check if onboarding already exists
          const { data: existingOnboarding } = await supabase
            .from('assistant_onboarding_responses')
            .select('id')
            .eq('member_id', member.id)
            .maybeSingle();

          if (!existingOnboarding) {
            const { error: insertErr } = await supabase
              .from('assistant_onboarding_responses')
              .insert({
                member_id: member.id,
                referral_source: referralSource,
                wants_to_learn: wantsToLearn === 'Outro' ? otherWantsToLearn : wantsToLearn,
                goal,
                difficulty
              });
            if (insertErr) console.error('Error saving onboarding directly:', insertErr);
          }

          // Create conversation if not exists
          const { data: existingConv } = await supabase
            .from('assistant_conversations')
            .select('id')
            .eq('member_id', member.id)
            .eq('status', 'active')
            .maybeSingle();

          if (!existingConv) {
            const { data: newConv, error: convErr } = await supabase
              .from('assistant_conversations')
              .insert({
                member_id: member.id,
                status: 'active'
              })
              .select('id')
              .maybeSingle();

            if (convErr) {
              console.error('Error creating conversation directly:', convErr);
            } else if (newConv) {
              conversationIdVal = newConv.id;
            }
          } else {
            conversationIdVal = existingConv.id;
          }
        }
      }

      // Wait 3.5 seconds to let n8n process the initial welcome message (if we hit the API)
      setTimeout(async () => {
        try {
          if (conversationIdVal) {
            const { data: msgs, error: msgsErr } = await supabase
              .from('assistant_messages')
              .select('content')
              .eq('conversation_id', conversationIdVal)
              .eq('sender', 'assistant')
              .order('created_at', { ascending: false });

            if (!msgsErr && msgs && msgs.length > 0) {
              retrievedWelcomeMessage = msgs[0].content;
              setWelcomeMessage(retrievedWelcomeMessage);
            }
          }
        } catch (e) {
          console.error('Error fetching welcome message:', e);
        } finally {
          // Fallback welcome message if n8n was slow or offline
          if (!retrievedWelcomeMessage && !welcomeMessage) {
            setWelcomeMessage(`Olá, ${userName}! Analisei suas respostas e vi que o seu objetivo principal é "${goal}" e que sua maior dificuldade hoje é "${difficulty}". Como seu assistente de IA, estou aqui para estruturar sua jornada de estudos na plataforma, recomendando os e-books e cursos exatos que vão te ajudar a acelerar. Vamos juntos dominar esse conhecimento!`);
          }
          setStep('welcome');
          setLoading(false);
        }
      }, 3500);

    } catch (err) {
      console.error('Onboarding save error:', err);
      // Fallback welcome message in case of absolute failure
      setWelcomeMessage(`Olá, ${userName}! Estou configurando seu assistente de IA pessoal. Vamos começar a explorar a plataforma e encontrar os melhores conteúdos juntos!`);
      setStep('welcome');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-[580px] bg-surface/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),_0_0_50px_rgba(192,193,255,0.05)] backdrop-blur-2xl overflow-hidden"
        >
          {/* Glowing Background Orbs */}
          <div className="absolute -top-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

          {/* Steps & Content */}
          <div className="relative z-10 flex flex-col min-h-[380px] justify-between">
            
            {/* Step Intro */}
            {step === 'intro' && (
              <div className="flex flex-col gap-6 text-center items-center py-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center animate-pulse">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-3">
                    Seu Consultor Pessoal de IA
                  </h2>
                  <p className="font-sans text-sm sm:text-base text-on-surface-variant/95 leading-relaxed max-w-md">
                    Olá, <span className="text-primary font-bold">{userName}</span>! Preparamos um assistente de inteligência artificial pessoal para guiar você pela plataforma e tirar dúvidas sobre todo o nosso conteúdo.
                  </p>
                </div>
                <p className="font-sans text-xs text-on-surface-variant/60">
                  Responda a 4 perguntas rápidas para personalizarmos sua experiência.
                </p>
              </div>
            )}

            {/* Step 1: referralSource */}
            {step === 'q1' && (
              <div className="flex flex-col gap-5 py-4">
                <div className="flex items-center gap-2 text-primary">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-display text-xs font-bold tracking-widest uppercase">Passo 1 de 4</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Como você conheceu a nossa plataforma?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {[
                    'Instagram / Redes Sociais',
                    'Indicação de Amigo',
                    'Pesquisa no Google',
                    'Anúncio Pago',
                    'Outro Canal'
                  ].map((source) => (
                    <button
                      key={source}
                      onClick={() => setReferralSource(source)}
                      className={`px-4 py-3 rounded-xl border text-left font-sans text-sm font-semibold transition-all ${
                        referralSource === source
                          ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(192,193,255,0.15)]'
                          : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: wantsToLearn */}
            {step === 'q2' && (
              <div className="flex flex-col gap-5 py-4">
                <div className="flex items-center gap-2 text-primary">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-display text-xs font-bold tracking-widest uppercase">Passo 2 de 4</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  O que você mais deseja aprender na plataforma?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {[
                    'Inteligência Artificial (Prompting/Agentes)',
                    'Automações com n8n / Make',
                    'Programação & Código (React/Node)',
                    'Tráfego Pago & Vendas Online',
                    'Modelagem de Negócios / SaaS',
                    'Outro'
                  ].map((learn) => (
                    <button
                      key={learn}
                      onClick={() => setWantsToLearn(learn)}
                      className={`px-4 py-3 rounded-xl border text-left font-sans text-sm font-semibold transition-all ${
                        wantsToLearn === learn
                          ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(192,193,255,0.15)]'
                          : 'bg-white/5 border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {learn}
                    </button>
                  ))}
                </div>

                {wantsToLearn === 'Outro' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <input
                      type="text"
                      value={otherWantsToLearn}
                      onChange={(e) => setOtherWantsToLearn(e.target.value)}
                      placeholder="Escreva o que deseja aprender (ex: Fitness, Design, Finanças...)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 font-sans text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <p className="font-sans text-xs text-on-surface-variant/50">
                      Você pode escrever qualquer assunto de seu interesse!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: goal */}
            {step === 'q3' && (
              <div className="flex flex-col gap-5 py-4">
                <div className="flex items-center gap-2 text-primary">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-display text-xs font-bold tracking-widest uppercase">Passo 3 de 4</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Qual é o seu objetivo principal de curto prazo?
                </h3>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Automatizar o atendimento da minha empresa, vender e-books..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 font-sans text-sm focus:outline-none focus:border-primary/50 transition-colors mt-2"
                />
                <p className="font-sans text-xs text-on-surface-variant/50">
                  Escreva com suas próprias palavras para que o consultor entenda seu contexto.
                </p>
              </div>
            )}

            {/* Step 4: difficulty */}
            {step === 'q4' && (
              <div className="flex flex-col gap-5 py-4">
                <div className="flex items-center gap-2 text-primary">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-display text-xs font-bold tracking-widest uppercase">Passo 4 de 4</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Qual é a sua maior dificuldade ou desafio hoje?
                </h3>
                <input
                  type="text"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  placeholder="Ex: Falta de tempo, não sei programar, dificuldade com ferramentas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 font-sans text-sm focus:outline-none focus:border-primary/50 transition-colors mt-2"
                />
                <p className="font-sans text-xs text-on-surface-variant/50">
                  Isso ajuda a IA a mapear atalhos e recomendar as ferramentas certas.
                </p>
              </div>
            )}

            {/* Loading state */}
            {step === 'loading' && (
              <div className="flex flex-col gap-5 items-center justify-center py-16 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    Estruturando Seu Assistente...
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant/80 max-w-xs leading-relaxed">
                    Sincronizando suas preferências com o assistente e gerando sua mensagem de introdução personalizada.
                  </p>
                </div>
              </div>
            )}

            {/* Welcome message card (Final Step) */}
            {step === 'welcome' && (
              <div className="flex flex-col gap-5 py-2">
                <div className="flex items-center gap-2.5 text-green-400">
                  <PartyPopper className="w-6 h-6" />
                  <span className="font-display text-sm font-bold tracking-wider uppercase">Cadastro Personalizado!</span>
                </div>
                
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Conheça o seu Guia de Estudos
                </h3>

                {/* Assistant Welcome Card */}
                <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-[0_0_30px_rgba(192,193,255,0.05)] relative overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full font-display text-[9px] font-semibold text-primary tracking-widest uppercase">
                    <Sparkles className="w-2.5 h-2.5" />
                    Online
                  </div>
                  <div className="flex items-start gap-3 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5.5 h-5.5 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-sans text-[13px] sm:text-[14px] text-white/90 leading-relaxed whitespace-pre-line">
                        {welcomeMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assistant Suggestion Tip */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 mt-1 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-1">Dica de Utilização</h4>
                    <p className="font-sans text-[11px] text-on-surface-variant/80 leading-relaxed">
                      O seu consultor de IA foi configurado. Você pode continuar esta conversa e pedir recomendações personalizadas a qualquer momento clicando no ícone do chat no canto inferior direito da tela.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {step !== 'loading' && (
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                {/* Back button */}
                {step !== 'intro' && step !== 'welcome' ? (
                  <button
                    onClick={() => {
                      if (step === 'q1') setStep('intro');
                      else if (step === 'q2') setStep('q1');
                      else if (step === 'q3') setStep('q2');
                      else if (step === 'q4') setStep('q3');
                    }}
                    className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                ) : (
                  <div />
                )}

                {/* Next/Submit Button */}
                {step === 'welcome' ? (
                  <button
                    onClick={onComplete}
                    className="font-display text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-primary-fixed transition-all shadow-[0_0_20px_rgba(192,193,255,0.3)] flex items-center gap-1.5"
                  >
                    Entrar na Plataforma
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={
                      (step === 'q1' && !referralSource) ||
                      (step === 'q2' && (!wantsToLearn || (wantsToLearn === 'Outro' && !otherWantsToLearn.trim()))) ||
                      (step === 'q3' && !goal.trim()) ||
                      (step === 'q4' && !difficulty.trim())
                    }
                    className={`font-display text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-1.5 transition-all ${
                      (step === 'q1' && !referralSource) ||
                      (step === 'q2' && (!wantsToLearn || (wantsToLearn === 'Outro' && !otherWantsToLearn.trim()))) ||
                      (step === 'q3' && !goal.trim()) ||
                      (step === 'q4' && !difficulty.trim())
                        ? 'bg-white/5 border border-white/10 text-on-surface-variant/40 cursor-not-allowed'
                        : 'bg-on-surface text-background hover:bg-primary hover:text-on-primary shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(192,193,255,0.3)]'
                    }`}
                  >
                    {step === 'intro' ? 'Iniciar' : step === 'q4' ? 'Concluir' : 'Avançar'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
