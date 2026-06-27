import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Code2, 
  Workflow, 
  Megaphone, 
  Briefcase, 
  TrendingUp, 
  Check,
  Compass,
  Cpu,
  Bookmark,
  Target
} from 'lucide-react';

const TRANSLATIONS = {
  pt: {
    title: "Personalize sua Experiência",
    subtitle: "Conte-nos um pouco sobre você para recomendarmos os melhores conteúdos.",
    step: "Passo",
    of: "de",
    next: "Continuar",
    finish: "Finalizar Onboarding",
    saving: "Salvando...",
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
          { value: "tools", label: "Ferramentas" },
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
    subtitle: "Tell us a bit about yourself so we can recommend the best content for you.",
    step: "Step",
    of: "of",
    next: "Continue",
    finish: "Finish Onboarding",
    saving: "Saving...",
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

  // Check if button should be disabled for current step
  const isStepInvalid = () => {
    if (step === 1) return !source;
    if (step === 2) return !goal;
    if (step === 3) return contentPrefs.length === 0;
    if (step === 4) return interests.length === 0;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-black text-white font-sans">
      {/* Immersive starfield/space overlay background matching CodeEngine styling */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,16,48,0.3)_0%,rgba(0,0,0,0.8)_80%)] pointer-events-none z-0" />
      <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)] rounded-full top-1/4 left-1/4 filter blur-3xl pointer-events-none z-0 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(139,92,246,0.05)_0%,transparent_70%)] rounded-full bottom-1/4 right-1/4 filter blur-3xl pointer-events-none z-0" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 md:p-8 relative z-10 border border-white/5 bg-surface/40 backdrop-blur-2xl shadow-2xl flex flex-col gap-6 text-center select-none animate-fade-in transition-all">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            {t.subtitle}
          </p>
        </div>

        {/* Step indicator */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>{t.step} {step} {t.of} {totalSteps}</span>
            <span className="text-primary font-semibold">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className="min-h-[260px] flex flex-col justify-center gap-4 py-2 transition-all">
          
          {/* STEP 1: SOURCE */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <h2 className="text-lg font-bold flex items-center gap-2 justify-center">
                <Compass className="w-5 h-5 text-primary" />
                {t.questions.source.title}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {t.questions.source.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSource(opt.value)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      source === opt.value
                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10 text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: GOAL */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <h2 className="text-lg font-bold flex items-center gap-2 justify-center">
                <Target className="w-5 h-5 text-primary" />
                {t.questions.goal.title}
              </h2>
              <div className="flex flex-col gap-2">
                {t.questions.goal.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={`py-3.5 px-5 rounded-xl border text-sm text-left font-medium transition-all flex items-center justify-between ${
                      goal === opt.value
                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10 text-white/70'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {goal === opt.value && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONTENT TYPE */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <div className="text-center">
                <h2 className="text-lg font-bold flex items-center gap-2 justify-center">
                  <Bookmark className="w-5 h-5 text-primary" />
                  {t.questions.content.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t.questions.content.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {t.questions.content.options.map((opt) => {
                  const selected = contentPrefs.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleContentPref(opt.value)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        selected
                          ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                          : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10 text-white/70'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: INTERESTS */}
          {step === 4 && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <div className="text-center">
                <h2 className="text-lg font-bold flex items-center gap-2 justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                  {t.questions.interests.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t.questions.interests.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {t.questions.interests.options.map((opt) => {
                  const selected = interests.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleInterest(opt.value)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                        selected
                          ? 'bg-primary/20 border-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                          : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10 text-white/70'
                      }`}
                    >
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        <div className="flex justify-between items-center mt-4 gap-4">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className={`py-3 px-6 rounded-xl border text-sm font-medium transition-all ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/10 active:scale-95'
            }`}
          >
            Voltar
          </button>

          <button
            onClick={handleNext}
            disabled={isStepInvalid() || loading}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(99,102,241,0.2)] disabled:shadow-none"
          >
            {loading ? (
              <span>{t.saving}</span>
            ) : (
              <>
                <span>{step === totalSteps ? t.finish : t.next}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
