import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, Trophy, BookOpen, ChevronRight, Check, Lock,
  Sparkles, ShoppingCart, X, Plus, Trash2, Loader2, GraduationCap,
  Clock, Target, Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyllabusStep {
  order: number;
  product_id: string;
  product_title: string;
  chapter_title: string;
  why: string;
  estimated_time: string;
  product?: {
    id: string;
    title: string;
    cover_url: string;
    product_type: string;
    price: number;
  };
  completed: boolean;
}

interface CustomCourse {
  id: string;
  title: string;
  objective: string;
  syllabus: SyllabusStep[];
  product_ids: string[];
  total_price: number;
  discounted_price: number;
  payment_status: 'draft' | 'pending' | 'completed';
  checklist_progress: Record<string, boolean>;
  created_at: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface CustomCoursesHubProps {
  onOpenCourse: (productId: string, lessonId?: string) => void;
  onOpenEbook: (productId: string) => void;
}

export function CustomCoursesHub({ onOpenCourse, onOpenEbook }: CustomCoursesHubProps) {
  const [courses, setCourses] = useState<CustomCourse[]>([]);
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CustomCourse | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/assistant/custom-courses`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setStreak(data.streak || { current_streak: 0, longest_streak: 0, last_activity_date: null });
      }
    } catch (err) {
      console.error('Error loading custom courses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(course: CustomCourse) {
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
        body: JSON.stringify({ customCourseId: course.id }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Combo checkout failed:', data.error);
      }
    } catch (err) {
      console.error('Error initiating combo checkout:', err);
    } finally {
      setCheckingOut(false);
    }
  }

  function openMaterial(step: SyllabusStep) {
    if (step.product?.product_type === 'course') {
      onOpenCourse(step.product_id);
    } else {
      onOpenEbook(step.product_id);
    }
  }

  function getCompletedCount(course: CustomCourse): number {
    return course.syllabus.filter(s => s.completed).length;
  }

  function getProgressPercent(course: CustomCourse): number {
    if (course.syllabus.length === 0) return 0;
    return Math.round((getCompletedCount(course) / course.syllabus.length) * 100);
  }

  // ─── STREAK CARD ────────────────────────────────────────────
  function StreakCard() {
    const streakActive = streak.current_streak > 0;
    const today = new Date().toISOString().split('T')[0];
    const studiedToday = streak.last_activity_date === today;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6"
        style={{
          background: streakActive
            ? 'linear-gradient(135deg, rgba(255,120,50,0.12) 0%, rgba(255,180,50,0.06) 50%, rgba(255,100,30,0.04) 100%)'
            : 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Glow ring behind flame */}
        {streakActive && (
          <div className="absolute top-3 right-4 w-20 h-20 rounded-full blur-2xl opacity-20 bg-orange-400 pointer-events-none" />
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Flame icon */}
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border ${
              streakActive 
                ? 'bg-orange-500/20 border-orange-400/30 text-orange-400' 
                : 'bg-white/5 border-white/10 text-on-surface-variant/40'
            }`}>
              <Flame className={`w-7 h-7 ${streakActive ? 'animate-pulse' : ''}`} />
              {streakActive && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface shadow-lg">
                  {streak.current_streak}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-white">
                {streakActive 
                  ? `${streak.current_streak} ${streak.current_streak === 1 ? 'Dia' : 'Dias'} de Ofensiva!`
                  : 'Comece sua Ofensiva!'
                }
              </h3>
              <p className="font-sans text-xs text-on-surface-variant/70 mt-0.5">
                {studiedToday 
                  ? '✅ Você já estudou hoje. Continue assim!'
                  : streakActive 
                    ? '⏰ Estude hoje para manter sua ofensiva!'
                    : 'Acesse qualquer material para iniciar.'
                }
              </p>
            </div>
          </div>

          {/* Best record */}
          {streak.longest_streak > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-display text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                Recorde: {streak.longest_streak}d
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── COURSE CARD (LIST VIEW) ────────────────────────────────
  function CourseCard({ course }: { course: CustomCourse }) {
    const isCompleted = course.payment_status === 'completed';
    const progress = getProgressPercent(course);
    const completedCount = getCompletedCount(course);

    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedCourse(course)}
        className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300 p-4 sm:p-5 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isCompleted 
                ? 'bg-primary/15 border-primary/25 text-primary'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isCompleted ? <GraduationCap className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-display text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                {course.title}
              </h4>
              <p className="font-sans text-xs text-on-surface-variant/60 mt-1 line-clamp-1">
                {course.objective}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 font-sans text-[10px] text-on-surface-variant/50">
                  <BookOpen className="w-3 h-3" />
                  {course.syllabus.length} materiais
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 font-sans text-[10px] text-primary">
                    <Check className="w-3 h-3" />
                    {completedCount}/{course.syllabus.length} completos
                  </span>
                )}
                {!isCompleted && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-display text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                    40% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-3" />
        </div>

        {/* Progress bar for purchased courses */}
        {isCompleted && (
          <div className="mt-3">
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.button>
    );
  }

  // ─── COURSE DETAIL MODAL ────────────────────────────────────
  function CourseDetail({ course }: { course: CustomCourse }) {
    const isCompleted = course.payment_status === 'completed';
    const progress = getProgressPercent(course);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={() => setSelectedCourse(null)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-5 py-4 border-b border-white/10 bg-surface/95 backdrop-blur-lg flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isCompleted
                  ? 'bg-primary/15 border-primary/25 text-primary'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-white truncate">{course.title}</h3>
                {isCompleted && (
                  <span className="font-sans text-[10px] text-primary">{progress}% concluído</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-on-surface-variant/50" />
              <span className="font-sans text-xs text-on-surface-variant/70">{course.objective?.substring(0, 40)}...</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-on-surface-variant/50" />
              <span className="font-sans text-xs text-on-surface-variant/70">{course.syllabus.length} materiais</span>
            </div>
          </div>

          {/* Progress bar for active courses */}
          {isCompleted && (
            <div className="px-5 pt-3">
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Checklist / Steps */}
          <div className="p-5 space-y-2">
            {course.syllabus.map((step, idx) => (
              <motion.div
                key={step.product_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  step.completed
                    ? 'bg-green-500/5 border-green-500/15'
                    : 'bg-white/[0.015] border-white/5 hover:border-white/10'
                }`}
              >
                {/* Step indicator */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                  step.completed
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : isCompleted
                      ? 'bg-white/5 border-white/10 text-on-surface-variant/50'
                      : 'bg-primary/10 border-primary/20 text-primary/60'
                }`}>
                  {step.completed ? <Check className="w-3.5 h-3.5" /> : step.order}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className={`font-display text-xs font-bold ${
                    step.completed ? 'text-green-400' : 'text-white'
                  }`}>
                    {step.chapter_title}
                  </h5>
                  {step.why && (
                    <p className="font-sans text-[10px] text-on-surface-variant/50 mt-0.5 line-clamp-2">{step.why}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-sans text-[9px] text-on-surface-variant/40 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {step.estimated_time}
                    </span>
                    <span className="font-sans text-[9px] text-on-surface-variant/40">
                      {step.product?.product_type === 'course' ? '📹 Curso' : '📖 Ebook'}
                    </span>
                  </div>
                </div>

                {/* Open button for purchased courses */}
                {isCompleted && (
                  <button
                    onClick={() => openMaterial(step)}
                    className={`px-3 py-1.5 rounded-lg font-display text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 transition-all ${
                      step.completed
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {step.completed ? 'Rever' : 'Abrir'}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer: Purchase CTA for draft courses */}
          {!isCompleted && (
            <div className="sticky bottom-0 px-5 py-4 border-t border-white/10 bg-surface/95 backdrop-blur-lg">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <span className="font-sans text-xs text-on-surface-variant/50 line-through">
                    ${course.total_price.toFixed(2)}
                  </span>
                  <span className="ml-2 font-display text-lg font-bold text-white">
                    ${course.discounted_price.toFixed(2)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 font-display text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  40% OFF
                </span>
              </div>
              <button
                onClick={() => handleCheckout(course)}
                disabled={checkingOut}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-display text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all shadow-[0_4px_20px_rgba(192,193,255,0.3)] disabled:opacity-50"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Pagar e Desbloquear Especialização
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // ─── EMPTY STATE ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StreakCard />

      {/* Course List */}
      {courses.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Minhas Especializações
          </h3>
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-on-surface-variant/40" />
          </div>
          <h3 className="font-display text-sm font-bold text-white mb-1">Nenhuma especialização ainda</h3>
          <p className="font-sans text-xs text-on-surface-variant/60 max-w-[260px] mx-auto">
            Use o Assistente IA para criar seu plano de estudos personalizado com base no seu objetivo.
          </p>
          <div className="mt-4 flex items-center justify-center gap-1 font-sans text-[10px] text-primary">
            <Sparkles className="w-3 h-3" />
            Clique no botão do Assistente para começar
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCourse && <CourseDetail course={selectedCourse} />}
      </AnimatePresence>
    </div>
  );
}
