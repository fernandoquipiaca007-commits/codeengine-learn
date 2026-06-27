import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Check,
  Compass,
  Cpu,
  Bookmark,
  Target
} from 'lucide-react';

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
function Typewriter({ text, speed = 55 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) return;
    const t = setTimeout(() => {
      setDisplayed((p) => p + text[idx]);
      setIdx((p) => p + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [idx, text, speed]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse opacity-70">|</span>
    </span>
  );
}

/* ─── Particle dots canvas background ───────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number; da: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.1,
        da: (Math.random() - 0.5) * 0.004,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.da;
        if (p.alpha > 0.6 || p.alpha < 0.05) p.da *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,180,255,${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

const TRANSLATIONS = {
  pt: {
    title: "Personalize sua Experiência",
    subtitle: "Conte-nos um pouco sobre você para recomendarmos os melhores conteúdos.",
    step: "Passo",
    of: "de",
    next: "Continuar",
    finish: "Finalizar Onboarding",
    saving: "Salvando...",
    back: "Voltar",
    quotes: {
      step1: "A sua jornada na CodeEngine começa hoje. Queremos conhecer a sua história.",
      step2: "Foco e direção. O objetivo certo molda a melhor experiência.",
      step3: "Selecione o formato ideal. Facilitamos o acesso ao conhecimento.",
      step4: "Personalização inteligente. Conectamos você ao conteúdo certo."
    },
    questions: {
      source: {
        title: "Como conheceu a CodeEngine?",
        options: [
          { value: "google", label: "Google" },
          { value: "youtube", label: "YouTube" },
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "facebook", label: "Facebook" },
          { value: "indicao", label: "Indicação de Amigo" },
          { value: "anuncio", label: "Anúncio" },
          { value: "outro", label: "Outro" }
        ]
      },
      goal: {
        title: "Qual é o seu objetivo principal?",
        options: [
          { value: "skills", label: "Aprender novas habilidades" },
          { value: "finance", label: "Crescer financeiramente" },
          { value: "automate", label: "Automatizar meus negócios" },
          { value: "productivity", label: "Melhorar produtividade" },
          { value: "trends", label: "Acompanhar tendências tecnológicas" },
          { value: "tools", label: "Encontrar ferramentas úteis" }
        ]
      },
      content: {
        title: "Que tipo de conteúdo prefere consumir?",
        subtitle: "Selecione todos os que se aplicam",
        options: [
          { value: "ebooks", label: "E-books" },
          { value: "courses", label: "Cursos Completos" },
          { value: "tools", label: "Ferramentas & Utilitários" },
          { value: "templates", label: "Templates & Modelos" },
          { value: "news", label: "Notícias & Artigos" },
          { value: "guides", label: "Guias Práticos" },
          { value: "softwares", label: "Softwares" },
          { value: "saas", label: "Aplicações SaaS" }
        ]
      },
      interests: {
        title: "Quais temas mais te interessam?",
        subtitle: "Selecione seus tópicos preferidos",
        options: [
          { value: "Inteligência Artificial", label: "Inteligência Artificial (IA)" },
          { value: "Programação", label: "Programação & Coding" },
          { value: "Automação", label: "Automação de Tarefas" },
          { value: "Marketing", label: "Marketing Digital" },
          { value: "Negócios", label: "Negócios & Startups" },
          { value: "Empreendedorismo", label: "Empreendedorismo" },
          { value: "Fitness", label: "Fitness & Treino" },
          { value: "Saúde", label: "Saúde & Bem-estar" },
          { value: "Finanças", label: "Finanças & Investimentos" },
          { value: "Produtividade", label: "Produtividade & Foco" },
          { value: "Design", label: "Design, UI & UX" },
          { value: "Educação", label: "Educação & Aprendizado" },
          { value: "Crypto", label: "Criptoativos & Web3" },
          { value: "Trading", label: "Trading & Mercado" },
          { value: "SaaS", label: "Software as a Service" }
        ]
      }
    }
  },
  en: {
    title: "Personalize Your Experience",
    subtitle: "Tell us a bit about yourself so we can recommend the best content.",
    step: "Step",
    of: "of",
    next: "Continue",
    finish: "Finish Onboarding",
    saving: "Saving...",
    back: "Back",
    quotes: {
      step1: "Your journey on CodeEngine starts today. We want to know your story.",
      step2: "Focus and direction. The right goal shapes the best experience.",
      step3: "Select the ideal format. We make knowledge access easy.",
      step4: "Smart personalization. Connecting you to the right content."
    },
    questions: {
      source: {
        title: "How did you hear about CodeEngine?",
        options: [
          { value: "google", label: "Google" },
          { value: "youtube", label: "YouTube" },
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "facebook", label: "Facebook" },
          { value: "indicao", label: "Friend Referral" },
          { value: "anuncio", label: "Advertisement" },
          { value: "outro", label: "Other" }
        ]
      },
      goal: {
        title: "What is your main goal?",
        options: [
          { value: "skills", label: "Learn new skills" },
          { value: "finance", label: "Grow financially" },
          { value: "automate", label: "Automate my business" },
          { value: "productivity", label: "Improve productivity" },
          { value: "trends", label: "Follow tech trends" },
          { value: "tools", label: "Find useful tools" }
        ]
      },
      content: {
        title: "What type of content do you prefer?",
        subtitle: "Select all that apply",
        options: [
          { value: "ebooks", label: "E-books" },
          { value: "courses", label: "Full Courses" },
          { value: "tools", label: "Tools & Utilities" },
          { value: "templates", label: "Templates & Blueprints" },
          { value: "news", label: "News & Articles" },
          { value: "guides", label: "Practical Guides" },
          { value: "softwares", label: "Softwares" },
          { value: "saas", label: "SaaS Apps" }
        ]
      },
      interests: {
        title: "Which topics interest you the most?",
        subtitle: "Select your preferred topics",
        options: [
          { value: "Inteligência Artificial", label: "Artificial Intelligence (AI)" },
          { value: "Programação", label: "Programming & Coding" },
          { value: "Automação", label: "Task Automation" },
          { value: "Marketing", label: "Digital Marketing" },
          { value: "Negócios", label: "Business & Startups" },
          { value: "Empreendedorismo", label: "Entrepreneurship" },
          { value: "Fitness", label: "Fitness & Workouts" },
          { value: "Saúde", label: "Health & Wellness" },
          { value: "Finanças", label: "Finance & Investments" },
          { value: "Produtividade", label: "Productivity & Focus" },
          { value: "Design", label: "Design, UI & UX" },
          { value: "Educação", label: "Education & Learning" },
          { value: "Crypto", label: "Crypto & Web3" },
          { value: "Trading", label: "Trading & Markets" },
          { value: "SaaS", label: "Software as a Service" }
        ]
      }
    }
  },
  fr: {
    title: "Personnalisez Votre Expérience",
    subtitle: "Dites-nous en un peu plus sur vous afin que nous puissions recommander le meilleur contenu.",
    step: "Étape",
    of: "sur",
    next: "Continuer",
    finish: "Terminer l'Onboarding",
    saving: "Enregistrement...",
    back: "Retour",
    quotes: {
      step1: "Votre voyage sur CodeEngine commence aujourd'hui. Racontez-nous votre histoire.",
      step2: "Focus et direction. Le bon objectif façonne la meilleure expérience.",
      step3: "Sélectionnez le format idéal. Nous facilitons l'accès au savoir.",
      step4: "Personnalisation intelligente. Nous vous connectons au bon contenu."
    },
    questions: {
      source: {
        title: "Comment avez-vous connu CodeEngine?",
        options: [
          { value: "google", label: "Google" },
          { value: "youtube", label: "YouTube" },
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "facebook", label: "Facebook" },
          { value: "indicao", label: "Recommandation" },
          { value: "anuncio", label: "Publicité" },
          { value: "outro", label: "Autre" }
        ]
      },
      goal: {
        title: "Quel est votre objectif principal?",
        options: [
          { value: "skills", label: "Apprendre de nouvelles compétences" },
          { value: "finance", label: "Grandir financièrement" },
          { value: "automate", label: "Automatiser mon entreprise" },
          { value: "productivity", label: "Améliorer la productivité" },
          { value: "trends", label: "Suivre les tendances technologiques" },
          { value: "tools", label: "Trouver des outils utiles" }
        ]
      },
      content: {
        title: "Quel type de contenu préférez-vous?",
        subtitle: "Sélectionnez tout ce qui s'applique",
        options: [
          { value: "ebooks", label: "E-books" },
          { value: "courses", label: "Cours Complets" },
          { value: "tools", label: "Outils & Utilitaires" },
          { value: "templates", label: "Modèles & Templates" },
          { value: "news", label: "Actualités & Articles" },
          { value: "guides", label: "Guides Pratiques" },
          { value: "softwares", label: "Logiciels" },
          { value: "saas", label: "Applications SaaS" }
        ]
      },
      interests: {
        title: "Quels sujets vous intéressent le plus?",
        subtitle: "Sélectionnez vos sujets favoris",
        options: [
          { value: "Inteligência Artificial", label: "Intelligence Artificielle (IA)" },
          { value: "Programação", label: "Programmation & Code" },
          { value: "Automação", label: "Automatisation" },
          { value: "Marketing", label: "Marketing Digital" },
          { value: "Negócios", label: "Affaires & Startups" },
          { value: "Empreendedorismo", label: "Entrepreneuriat" },
          { value: "Fitness", label: "Fitness & Musculation" },
          { value: "Saúde", label: "Santé & Bien-être" },
          { value: "Finanças", label: "Finance & Investissements" },
          { value: "Produtividade", label: "Productivité & Focus" },
          { value: "Design", label: "Design, UI & UX" },
          { value: "Educação", label: "Éducation & Apprentissage" },
          { value: "Crypto", label: "Crypto & Web3" },
          { value: "Trading", label: "Trading & Marchés" },
          { value: "SaaS", label: "Software as a Service" }
        ]
      }
    }
  }
};

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale as 'pt' | 'en' | 'fr'] || TRANSLATIONS.pt;

  const [step, setStep] = useState(1);
  const [source, setSource] = useState('');
  const [goal, setGoal] = useState('');
  const [contentPrefs, setContentPrefs] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      void handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const toggleContentPref = (val: string) => {
    setContentPrefs(prev => 
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const toggleInterest = (val: string) => {
    setInterests(prev => 
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Save onboarding answers
      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          source,
          primary_goal: goal,
          content_preferences: contentPrefs,
          interests,
          completed_at: new Date().toISOString()
        });

      if (onboardingError) throw onboardingError;

      // Update onboarding_completed state in members profile table
      const { error: memberError } = await supabase
        .from('members')
        .update({
          onboarding_completed: true
        })
        .eq('auth_id', user.id);

      if (memberError) throw memberError;

      onComplete();
    } catch (err) {
      console.error("Error submitting onboarding:", err);
      alert("Erro ao salvar as preferências. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isStepInvalid = () => {
    if (step === 1) return !source;
    if (step === 2) return !goal;
    if (step === 3) return contentPrefs.length === 0;
    if (step === 4) return interests.length === 0;
    return false;
  };

  const activeQuote = step === 1 ? t.quotes.step1 
                    : step === 2 ? t.quotes.step2 
                    : step === 3 ? t.quotes.step3 
                    : t.quotes.step4;

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#050505] overflow-hidden">
      {/* ── LEFT: Form Panel ─────────────────────────────────────────────── */}
      <div className="relative flex w-full md:w-[46%] lg:w-[42%] flex-col items-center justify-center px-8 py-6 overflow-y-auto">
        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-72 bg-primary/10 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-[380px]">
          {/* Logo — real CodeEngine icon */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/icons/icon-512.png"
                alt="CodeEngine"
                className="w-9 h-9 rounded-xl object-cover"
              />
              <span className="font-display text-sm font-semibold text-white/60">
                CodeEngine
              </span>
            </div>
            <div className="text-[10px] font-semibold font-display tracking-widest uppercase text-white/30">
              {t.step} {step} / {totalSteps}
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white mb-1.5 leading-tight">
              {t.title}
            </h1>
            <p className="text-xs text-white/40 font-sans leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Question fields container */}
          <div className="space-y-5 py-2">
            
            {/* STEP 1: SOURCE */}
            {step === 1 && (
              <div className="space-y-3.5 animate-fade-in">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2 font-display">
                  {t.questions.source.title}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {t.questions.source.options.map((opt) => {
                    const isSelected = source === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSource(opt.value)}
                        className={`w-full py-2.5 px-3 rounded-lg border text-xs font-medium font-sans transition-all text-center ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: GOAL */}
            {step === 2 && (
              <div className="space-y-2 animate-fade-in">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-3 font-display">
                  {t.questions.goal.title}
                </label>
                <div className="space-y-2">
                  {t.questions.goal.options.map((opt) => {
                    const isSelected = goal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGoal(opt.value)}
                        className={`w-full py-2.5 px-4 rounded-lg border text-xs font-sans font-medium text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: CONTENT TYPE */}
            {step === 3 && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/40 font-display">
                    {t.questions.content.title}
                  </label>
                  <p className="text-[10px] text-white/20 font-sans mt-0.5">{t.questions.content.subtitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {t.questions.content.options.map((opt) => {
                    const isSelected = contentPrefs.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleContentPref(opt.value)}
                        className={`w-full py-2.5 px-3 rounded-lg border text-xs font-sans font-medium text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <span className="truncate mr-1">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: INTERESTS */}
            {step === 4 && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/40 font-display">
                    {t.questions.interests.title}
                  </label>
                  <p className="text-[10px] text-white/20 font-sans mt-0.5">{t.questions.interests.subtitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {t.questions.interests.options.map((opt) => {
                    const isSelected = interests.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleInterest(opt.value)}
                        className={`w-full py-2 px-2.5 rounded-lg border text-[10px] font-sans font-medium text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <span className="truncate mr-1">{opt.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="py-2.5 px-4 rounded-lg border border-white/10 bg-white/4 font-sans text-xs font-medium text-white/70 hover:bg-white/8 hover:text-white transition-all duration-200"
              >
                {t.back}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isStepInvalid() || loading}
              className="flex-1 bg-primary text-on-primary font-display text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(192,193,255,0.25)] hover:shadow-[0_0_36px_rgba(192,193,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-on-primary" />
              ) : (
                <>
                  <span>{step === totalSteps ? t.finish : t.next}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── RIGHT: Illustration Panel ─────────────────────────────────────── */}
      <div className="hidden md:flex relative flex-1 flex-col overflow-hidden">
        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Micro-dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient light blooms */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-indigo-500/6 rounded-full blur-[100px] pointer-events-none" />

        {/* Illustration image — full fill */}
        <div className="absolute inset-0">
          <img
            src="/onboarding.png"
            alt="CodeEngine illustration"
            className="w-full h-full object-cover object-center opacity-90"
            onError={(e) => { 
              (e.target as HTMLImageElement).src = '/login.png'; 
            }}
          />
        </div>

        {/* Bottom gradient overlay for quote readability */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#050505]/95 via-[#050505]/50 to-transparent pointer-events-none" />

        {/* Vertical separator line */}
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        {/* Quote */}
        <div className="relative z-10 mt-auto px-10 pb-10">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-1.5 text-center"
            >
              <p className="text-base font-medium text-white/90 drop-shadow-lg font-display">
                &ldquo;<Typewriter key={step} text={activeQuote} speed={55} />&rdquo;
              </p>
              <cite className="block text-xs font-light not-italic text-white/40 tracking-wider">
                — CodeEngine
              </cite>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
