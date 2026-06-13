import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, GraduationCap, Clock, Sparkles, Check, 
  Trash2, Plus, Edit2, ShoppingCart, X, HelpCircle, BookOpen, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyllabusStep {
  order: number;
  product_id: string;
  product_title: string;
  chapter_title: string;
  why: string;
  estimated_time: string;
}

interface CustomCourse {
  id: string;
  title: string;
  objective: string;
  syllabus: SyllabusStep[];
  product_ids: string[];
  totalPrice: number;
  discountedPrice: number;
  discount: number;
}

interface Product {
  id: string;
  title: string;
  cover_url: string;
  product_type: string;
  price: number;
}

interface SpecializationBuilderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SpecializationBuilderOverlay({
  isOpen,
  onClose,
  onSuccess
}: SpecializationBuilderOverlayProps) {
  const [mode, setMode] = useState<'questionnaire' | 'building' | 'done' | 'edit'>('questionnaire');
  const [step, setStep] = useState<number>(1);
  const [objective, setObjective] = useState('');
  const [level, setLevel] = useState('');
  const [time, setTime] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [course, setCourse] = useState<CustomCourse | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const assemblyLogs = [
    '🤖 Estabelecendo conexão segura com o Agente Especialista em Combos...',
    '📚 Analisando seus objetivos de estudo e mapeando suas necessidades...',
    '🔍 Varrendo o catálogo digital da CodeEngine à procura dos e-books e cursos ideais...',
    '🛠️ Estruturando a sequência de aprendizagem passo a passo (módulos e capítulos)...',
    '✨ Consolidando checklist de estudos e aplicando desconto exclusivo de 40% OFF...'
  ];

  // Fetch catalog and reset state when opening
  useEffect(() => {
    if (!isOpen) return;

    setMode('questionnaire');
    setStep(1);
    setObjective('');
    setLevel('');
    setTime('');
    setLogs([]);
    setCurrentLogIndex(0);
    setCourse(null);
    setSelectedProductIds([]);

    void fetchCatalog();
  }, [isOpen]);

  // Handle building logs ticking
  useEffect(() => {
    if (mode !== 'building') return;

    setCurrentLogIndex(0);
    setLogs([assemblyLogs[0]]); // Set first log immediately

    const logInterval = setInterval(() => {
      setCurrentLogIndex(curr => {
        const nextIndex = curr + 1;
        if (nextIndex < assemblyLogs.length) {
          setLogs(prev => [...prev, assemblyLogs[nextIndex]]);
          return nextIndex;
        } else {
          clearInterval(logInterval);
          return curr;
        }
      });
    }, 1200);

    return () => clearInterval(logInterval);
  }, [mode]);

  async function fetchCatalog() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, cover_url, product_type, price')
        .eq('status', 'active');
      if (!error && data) {
        setCatalog(data as Product[]);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  }

  const startGeneration = (finalObj: string, finalLvl: string, finalTm: string) => {
    setMode('building');
    setLogs([]);
    setCurrentLogIndex(0);
    void generateSyllabus(finalObj, finalLvl, finalTm);
  };

  async function generateSyllabus(obj: string, lvl: string, tm: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/assistant/generate-syllabus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ objective: obj, level: lvl, time: tm }),
      });

      const result = await response.json();
      if (result.success && result.customCourse) {
        // Delay completion slightly so the user sees the cool building logs finish
        setTimeout(() => {
          setCourse(result.customCourse);
          setSelectedProductIds(result.customCourse.steps.map((s: any) => s.product_id));
          setMode('done');
        }, 3000);
      } else {
        console.error('Syllabus generation error:', result.error);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error generating syllabus:', err);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }

  // Recalculates prices dynamically based on currently selected items in edit mode
  const getPrices = () => {
    if (!catalog.length) return { total: 0, discounted: 0 };
    const total = catalog
      .filter(p => selectedProductIds.includes(p.id))
      .reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const discounted = Math.round(total * 0.60 * 100) / 100;
    return { total, discounted };
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  async function handleSaveCustomization() {
    if (!course || selectedProductIds.length === 0) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/assistant/custom-courses/${course.id}/customize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productIds: selectedProductIds }),
      });

      const result = await response.json();
      if (result.success && result.course) {
        // Enrich the steps
        const enrichedSteps = result.course.syllabus.map((step: any) => {
          const prod = catalog.find(p => p.id === step.product_id);
          return { ...step, product: prod };
        });

        setCourse({
          ...course,
          syllabus: enrichedSteps,
          product_ids: selectedProductIds,
          totalPrice: result.totalPrice,
          discountedPrice: result.discountedPrice
        });
        setMode('done');
      }
    } catch (err) {
      console.error('Error saving customized specialization:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckout() {
    if (!course) return;
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/stripe/combo-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customCourseId: course.id,
          productIds: selectedProductIds
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout failed:', data.error);
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
    } finally {
      setCheckingOut(false);
    }
  }

  if (!isOpen) return null;

  const { total, discounted } = getPrices();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl bg-surface/80 border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 bg-surface/90 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  {mode === 'questionnaire' 
                    ? 'Montar Especialização' 
                    : mode === 'building' 
                      ? 'Montando Especialização...' 
                      : 'Sua Especialização sob Medida'}
                </h3>
                <p className="font-sans text-[10px] sm:text-xs text-on-surface-variant/70 mt-0.5">
                  Mapeado pelo Agente Especialista em Combos
                </p>
              </div>
            </div>
            {mode !== 'building' && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-on-surface-variant hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-thin">
            {/* QUESTIONNAIRE MODE */}
            {mode === 'questionnaire' && (
              <div className="space-y-6 py-4">
                {/* ProgressBar/Indicator */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="font-display text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full">
                    Passo {step} de 3
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(s => (
                      <div
                        key={s}
                        className={`w-8 h-1 rounded-full transition-all duration-300 ${
                          s <= step ? 'bg-amber-400' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-display text-base font-bold text-white">Qual é o seu objetivo principal?</h4>
                      <p className="font-sans text-xs text-on-surface-variant/60 leading-relaxed">
                        Explica detalhadamente o que desejas aprender ou automatizar na tua jornada de estudos.
                      </p>
                    </div>
                    <textarea
                      value={objective}
                      onChange={e => setObjective(e.target.value)}
                      placeholder="Ex: Quero aprender a automatizar processos de marketing usando n8n, gerando relatórios de IA e integrando com o Google Sheets..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-sans text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none leading-relaxed"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-white/10 font-sans text-xs font-semibold text-on-surface-variant hover:bg-white/5 hover:text-white transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => step === 1 && objective.trim() && setStep(2)}
                        disabled={!objective.trim()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-display text-xs font-bold uppercase hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center gap-1.5"
                      >
                        Próximo <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-display text-base font-bold text-white">Qual o teu nível de experiência neste assunto?</h4>
                      <p className="font-sans text-xs text-on-surface-variant/60 leading-relaxed">
                        Iremos calibrar a profundidade das referências e a ordem da especialização de acordo com o teu nível.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                      {[
                        { key: 'beginner', title: 'Iniciante', desc: 'Apenas começando neste tópico' },
                        { key: 'intermediate', title: 'Intermediário', desc: 'Já possuo alguma base prática' },
                        { key: 'advanced', title: 'Avançado', desc: 'Quero dominar técnicas profundas' }
                      ].map(lvl => (
                        <button
                          key={lvl.key}
                          onClick={() => {
                            setLevel(lvl.key);
                            setStep(3);
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                            level === lvl.key
                              ? 'bg-amber-500/10 border-amber-500/40 text-white'
                              : 'bg-white/[0.01] border-white/5 text-on-surface-variant/60 hover:border-white/10'
                          }`}
                        >
                          <span className="font-display text-xs font-bold text-white uppercase tracking-wider block mb-1">
                            {lvl.title}
                          </span>
                          <span className="font-sans text-[10px] text-on-surface-variant/60 leading-normal">
                            {lvl.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-sans text-xs font-semibold text-on-surface-variant hover:bg-white/10 hover:text-white transition-all"
                      >
                        ← Voltar
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-display text-base font-bold text-white">Quanto tempo por dia podes dedicar aos teus estudos?</h4>
                      <p className="font-sans text-xs text-on-surface-variant/60 leading-relaxed">
                        Calculamos o tempo estimado e dividimos os módulos de acordo com a tua disponibilidade diária.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                      {[
                        { key: '15 min', label: '15 min' },
                        { key: '30 min', label: '30 min' },
                        { key: '1 hora', label: '1 hora' },
                        { key: '2+ horas', label: '2+ horas' }
                      ].map(t => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setTime(t.key);
                            startGeneration(objective, level, t.key);
                          }}
                          className="p-4 rounded-xl border text-center flex flex-col items-center justify-center bg-white/[0.01] border-white/5 hover:border-amber-500/20 hover:text-amber-400 font-display text-xs font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02]"
                        >
                          <Clock className="w-4 h-4 mb-2 text-on-surface-variant/40" />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-sans text-xs font-semibold text-on-surface-variant hover:bg-white/10 hover:text-white transition-all"
                      >
                        ← Voltar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BUILDING MODE */}
            {mode === 'building' && (
              <div className="space-y-6 py-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-white">Criando trilha de aprendizagem...</h4>
                    <p className="font-sans text-xs text-on-surface-variant/60 max-w-[280px] mt-1">
                      Selecionando os e-books e cursos mais relevantes para você.
                    </p>
                  </div>
                </div>

                {/* Log terminal */}
                <div className="rounded-xl border border-white/5 bg-black/30 p-4 font-mono text-[10px] sm:text-xs text-green-400 space-y-2 h-[160px] overflow-y-auto scrollbar-none shadow-inner">
                  {logs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-green-500">▶</span>
                      <span>{log}</span>
                    </motion.div>
                  ))}
                  {currentLogIndex < assemblyLogs.length - 1 && (
                    <div className="flex items-center gap-1 opacity-70">
                      <span className="w-1.5 h-3 bg-green-400 animate-pulse inline-block" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SYLLABUS DETAIL MODE */}
            {mode === 'done' && course && (
              <div className="space-y-6">
                {/* Course Metadata Card */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                  <h4 className="font-display text-sm font-bold text-white">{course.title}</h4>
                  <p className="font-sans text-xs text-on-surface-variant/70 leading-relaxed">
                    Objetivo: &quot;{course.objective}&quot;
                  </p>
                </div>

                {/* Chapters list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                      Módulos da Especialização
                    </h5>
                    <button
                      onClick={() => setMode('edit')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white tracking-wider uppercase transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar Grade
                    </button>
                  </div>

                  <div className="space-y-2">
                    {course.syllabus.map((step, idx) => {
                      const prod = catalog.find(p => p.id === step.product_id);
                      return (
                        <div
                          key={step.product_id}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.015]"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h6 className="font-display text-xs font-bold text-white leading-tight">
                              {step.chapter_title}
                            </h6>
                            <p className="font-sans text-[10px] text-on-surface-variant/50 mt-0.5 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-medium">
                                {prod?.product_type === 'course' ? '📹 Curso' : '📖 Ebook'}
                              </span>
                              <span>{prod?.title || step.product_title}</span>
                            </p>
                            {step.why && (
                              <p className="font-sans text-[10px] text-on-surface-variant/60 mt-1.5 leading-relaxed bg-white/[0.01] p-2 rounded-lg border border-white/[0.02]">
                                {step.why}
                              </p>
                            )}
                          </div>
                          <div className="font-sans text-[9px] text-on-surface-variant/50 flex-shrink-0 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {step.estimated_time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMIZATION EDIT MODE */}
            {mode === 'edit' && course && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    Materiais &amp; Referências Inclusos
                  </h5>
                  <span className="font-sans text-[10px] text-on-surface-variant/60">
                    Selecione ou remova itens do seu combo.
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {catalog.map(prod => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary/30 text-white'
                            : 'bg-white/[0.01] border-white/5 text-on-surface-variant/60 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {prod.cover_url ? (
                            <img
                              src={prod.cover_url}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-on-surface-variant/40" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-display text-xs font-bold truncate text-white">
                              {prod.title}
                            </p>
                            <span className="font-sans text-[9px] uppercase tracking-wider text-on-surface-variant/50">
                              {prod.product_type === 'course' ? '📹 Curso' : '📖 Ebook'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-sans text-xs font-bold">
                            ${Number(prod.price).toFixed(2)}
                          </span>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-primary border-primary text-on-primary'
                              : 'border-white/20 bg-transparent'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {mode !== 'building' && mode !== 'questionnaire' && course && (
            <div className="sticky bottom-0 px-6 py-4 border-t border-white/10 bg-surface/90 backdrop-blur-md">
              {mode === 'done' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-xs text-on-surface-variant/40 line-through">
                        ${total.toFixed(2)}
                      </span>
                      <span className="font-display text-lg font-bold text-white">
                        ${discounted.toFixed(2)}
                      </span>
                      <span className="font-sans text-[10px] text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                        Economize 40%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-display text-[10px] font-bold text-amber-400 tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      Combo Especial
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-white/10 font-sans text-xs font-semibold text-on-surface-variant hover:bg-white/5 hover:text-white transition-all text-center"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut || selectedProductIds.length === 0}
                      className="flex-1.5 py-3 rounded-xl bg-primary text-on-primary font-display text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all shadow-[0_4px_25px_rgba(192,193,255,0.25)] disabled:opacity-50"
                    >
                      {checkingOut ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Começar Especialização
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="font-sans text-[10px] text-on-surface-variant/50">Total recalculado</span>
                    <p className="font-display text-base font-bold text-white">${discounted.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('done')}
                      className="px-4 py-2 rounded-xl border border-white/10 font-sans text-xs font-semibold text-on-surface-variant hover:bg-white/5 hover:text-white transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSaveCustomization}
                      disabled={saving || selectedProductIds.length === 0}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-display text-xs font-bold uppercase hover:bg-amber-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Confirmar Grade
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
