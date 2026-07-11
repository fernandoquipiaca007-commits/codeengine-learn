import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Video,
  MoveUp, MoveDown, PlayCircle, Clock, Save, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonVideoSource = 'youtube' | 'vimeo' | 'panda' | 'upload';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoSource: LessonVideoSource;
  videoUrl: string;
  availability: 'immediate' | 'scheduled';
  scheduledAt: string;
  duration: string; // mm:ss, optional
  moduleId: string | null;
}

export interface Module {
  id: string;
  title: string;
}

interface CourseBuilderProps {
  lessons: Lesson[];
  modules: Module[];
  onLessonsChange: (lessons: Lesson[]) => void;
  onModulesChange: (modules: Module[]) => void;
  collaboratorPlan: 'ebook_creator' | 'course_creator';
  onUpgradePremium: () => void;
  submitAttempted: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeLesson(moduleId: string | null = null): Lesson {
  return {
    id: makeId(),
    title: '',
    description: '',
    videoSource: 'youtube',
    videoUrl: '',
    availability: 'immediate',
    scheduledAt: '',
    duration: '',
    moduleId,
  };
}

function makeModule(): Module {
  return { id: makeId(), title: '' };
}

const VIDEO_SOURCES: { value: LessonVideoSource; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'panda', label: 'Panda Video' },
  { value: 'upload', label: 'Upload Proprio (Premium)' },
];

// ─── Sub-component: Lesson Card ───────────────────────────────────────────────

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  total: number;
  collaboratorPlan: string;
  onUpgradePremium: () => void;
  onUpdate: (updated: Lesson) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  submitAttempted: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function LessonCard({
  lesson,
  index,
  total,
  collaboratorPlan,
  onUpgradePremium,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  submitAttempted,
  isOpen,
  onToggle,
}: LessonCardProps) {
  const update = (partial: Partial<Lesson>) => onUpdate({ ...lesson, ...partial });

  return (
    <div className="rounded-xl border border-white/10 bg-surface-container overflow-hidden">
      {/* Lesson header row */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
          {index + 1}
        </span>

        <span className={`flex-1 text-sm font-semibold truncate ${lesson.title ? 'text-white' : 'text-on-surface-variant'}`}>
          {lesson.title || 'Nova Aula'}
        </span>

        {lesson.videoUrl && (
          <PlayCircle size={14} className="text-green-400 shrink-0" />
        )}
        {lesson.duration && (
          <span className="text-[10px] text-on-surface-variant font-mono shrink-0">{lesson.duration}</span>
        )}

        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/10 transition disabled:opacity-30"
            title="Mover para cima"
          >
            <MoveUp size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/10 transition disabled:opacity-30"
            title="Mover para baixo"
          >
            <MoveDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition"
            title="Remover aula"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {isOpen ? <ChevronUp size={14} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={14} className="text-on-surface-variant shrink-0" />}
      </div>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Titulo da Aula *
            </label>
            <input
              type="text"
              value={lesson.title}
              onChange={e => update({ title: e.target.value })}
              placeholder="Ex: Introducao ao Flexbox"
              className={`w-full rounded-xl bg-surface-high border px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                submitAttempted && !lesson.title ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {submitAttempted && !lesson.title && (
              <span className="text-[10px] text-red-400 mt-0.5 block">O titulo da aula e obrigatorio.</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Origem do Video
              </label>
              <select
                value={lesson.videoSource}
                onChange={e => {
                  const val = e.target.value as LessonVideoSource;
                  if (val === 'upload' && collaboratorPlan !== 'course_creator') {
                    onUpgradePremium();
                    return;
                  }
                  update({ videoSource: val, videoUrl: '' });
                }}
                className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {VIDEO_SOURCES.map(s => (
                  <option key={s.value} value={s.value} className="bg-surface-high">{s.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                {lesson.videoSource === 'upload' ? 'Upload do Video' : 'URL do Video (Opcional)'}
              </label>
              {lesson.videoSource === 'upload' ? (
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              ) : (
                <input
                  type="url"
                  value={lesson.videoUrl}
                  onChange={e => update({ videoUrl: e.target.value })}
                  placeholder={
                    lesson.videoSource === 'youtube' ? 'https://youtu.be/...' :
                    lesson.videoSource === 'vimeo' ? 'https://vimeo.com/...' :
                    'https://...'
                  }
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Duracao (mm:ss) <span className="normal-case text-white/30">(opcional)</span>
              </label>
              <div className="relative">
                <Clock size={12} className="absolute left-3 top-3 text-on-surface-variant" />
                <input
                  type="text"
                  value={lesson.duration}
                  onChange={e => update({ duration: e.target.value })}
                  placeholder="00:00"
                  maxLength={5}
                  className="w-full rounded-xl bg-surface-high border border-white/10 pl-8 pr-3 py-2.5 text-xs text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Disponibilizacao
              </label>
              <div className="flex rounded-xl overflow-hidden border border-white/10 h-[42px]">
                <button
                  type="button"
                  onClick={() => update({ availability: 'immediate', scheduledAt: '' })}
                  className={`flex-1 text-xs font-semibold transition-colors ${
                    lesson.availability === 'immediate'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-high text-on-surface-variant hover:text-white hover:bg-white/5'
                  }`}
                >
                  Imediata
                </button>
                <button
                  type="button"
                  onClick={() => update({ availability: 'scheduled' })}
                  className={`flex-1 text-xs font-semibold border-l border-white/10 transition-colors ${
                    lesson.availability === 'scheduled'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-surface-high text-on-surface-variant hover:text-white hover:bg-white/5'
                  }`}
                >
                  Agendada
                </button>
              </div>
              {lesson.availability === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={lesson.scheduledAt}
                  onChange={e => update({ scheduledAt: e.target.value })}
                  className="mt-1.5 w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Descricao <span className="normal-case text-white/30">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={lesson.description}
              onChange={e => update({ description: e.target.value })}
              placeholder="Descreva o conteudo desta aula..."
              className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Module Group ──────────────────────────────────────────────

interface ModuleGroupProps {
  module: Module;
  lessons: Lesson[];
  allLessons: Lesson[];
  collaboratorPlan: string;
  onUpgradePremium: () => void;
  onUpdateModule: (m: Module) => void;
  onRemoveModule: () => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onRemoveLesson: (id: string) => void;
  onMoveLessonUp: (id: string) => void;
  onMoveLessonDown: (id: string) => void;
  onAddLesson: () => void;
  submitAttempted: boolean;
  openLessonId: string | null;
  onToggleLesson: (id: string) => void;
}

function ModuleGroup({
  module, lessons, allLessons, collaboratorPlan, onUpgradePremium,
  onUpdateModule, onRemoveModule, onUpdateLesson, onRemoveLesson,
  onMoveLessonUp, onMoveLessonDown, onAddLesson, submitAttempted,
  openLessonId, onToggleLesson
}: ModuleGroupProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/15 bg-white/3 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="text-on-surface-variant hover:text-white transition"
        >
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <input
          type="text"
          value={module.title}
          onChange={e => onUpdateModule({ ...module, title: e.target.value })}
          placeholder="Nome do Modulo (ex: Modulo 1 — Introducao)"
          className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-white/30 focus:outline-none border-b border-transparent focus:border-white/20 transition-colors py-0.5"
        />
        <button
          type="button"
          onClick={onRemoveModule}
          className="p-1 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
          title="Remover modulo"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {open && (
        <div className="p-3 space-y-2">
          {lessons.map((lesson, idx) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={idx}
              total={lessons.length}
              collaboratorPlan={collaboratorPlan}
              onUpgradePremium={onUpgradePremium}
              onUpdate={onUpdateLesson}
              onRemove={() => onRemoveLesson(lesson.id)}
              onMoveUp={() => onMoveLessonUp(lesson.id)}
              onMoveDown={() => onMoveLessonDown(lesson.id)}
              submitAttempted={submitAttempted}
              isOpen={openLessonId === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
            />
          ))}
          <button
            type="button"
            onClick={onAddLesson}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/3 px-3 py-2.5 text-xs font-semibold text-on-surface-variant hover:text-white hover:border-white/30 hover:bg-white/5 transition"
          >
            <Plus size={13} /> Adicionar Aula neste Modulo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseBuilder({
  lessons,
  modules,
  onLessonsChange,
  onModulesChange,
  collaboratorPlan,
  onUpgradePremium,
  submitAttempted,
}: CourseBuilderProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(lessons[0]?.id || null);

  const handleToggleLesson = (id: string) => {
    setOpenLessonId(prev => prev === id ? null : id);
  };

  const unassigned = lessons.filter(l => !l.moduleId);

  const addLesson = () => {
    const newL = makeLesson(null);
    onLessonsChange([...lessons, newL]);
    setOpenLessonId(newL.id);
  };

  const addLessonToModule = (moduleId: string) => {
    const newL = makeLesson(moduleId);
    onLessonsChange([...lessons, newL]);
    setOpenLessonId(newL.id);
  };

  const updateLesson = (updated: Lesson) => {
    onLessonsChange(lessons.map(l => l.id === updated.id ? updated : l));
  };

  const removeLesson = (id: string) => {
    onLessonsChange(lessons.filter(l => l.id !== id));
    if (openLessonId === id) setOpenLessonId(null);
  };

  const moveLessonInGroup = (id: string, direction: 'up' | 'down', groupLessons: Lesson[]) => {
    const idx = groupLessons.findIndex(l => l.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === groupLessons.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newGroup = [...groupLessons];
    [newGroup[idx], newGroup[swapIdx]] = [newGroup[swapIdx], newGroup[idx]];

    const otherLessons = lessons.filter(l => !groupLessons.some(g => g.id === l.id));
    const reordered = [...newGroup, ...otherLessons];
    onLessonsChange(reordered);
  };

  const addModule = () => {
    onModulesChange([...modules, makeModule()]);
  };

  const updateModule = (updated: Module) => {
    onModulesChange(modules.map(m => m.id === updated.id ? updated : m));
  };

  const removeModule = (moduleId: string) => {
    onModulesChange(modules.filter(m => m.id !== moduleId));
    onLessonsChange(lessons.map(l => l.moduleId === moduleId ? { ...l, moduleId: null } : l));
  };

  const totalLessons = lessons.length;
  const hasVideoCount = lessons.filter(l => l.videoUrl).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <PlayCircle size={13} className="text-primary" />
          <span><strong className="text-white">{totalLessons}</strong> aula{totalLessons !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Video size={13} className="text-green-400" />
          <span><strong className="text-white">{hasVideoCount}</strong> com video</span>
        </div>
        {modules.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Save size={13} className="text-blue-400" />
            <span><strong className="text-white">{modules.length}</strong> modulo{modules.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {submitAttempted && totalLessons === 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-300">
          <AlertTriangle size={14} className="shrink-0" />
          Adicione pelo menos 1 aula antes de publicar o curso.
        </div>
      )}

      <div className="space-y-2">
        {unassigned.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={idx}
            total={unassigned.length}
            collaboratorPlan={collaboratorPlan}
            onUpgradePremium={onUpgradePremium}
            onUpdate={updateLesson}
            onRemove={() => removeLesson(lesson.id)}
            onMoveUp={() => moveLessonInGroup(lesson.id, 'up', unassigned)}
            onMoveDown={() => moveLessonInGroup(lesson.id, 'down', unassigned)}
            submitAttempted={submitAttempted}
            isOpen={openLessonId === lesson.id}
            onToggle={() => handleToggleLesson(lesson.id)}
          />
        ))}
      </div>

      {modules.map(module => {
        const modLessons = lessons.filter(l => l.moduleId === module.id);
        return (
          <ModuleGroup
            key={module.id}
            module={module}
            lessons={modLessons}
            allLessons={lessons}
            collaboratorPlan={collaboratorPlan}
            onUpgradePremium={onUpgradePremium}
            onUpdateModule={updateModule}
            onRemoveModule={() => removeModule(module.id)}
            onUpdateLesson={updateLesson}
            onRemoveLesson={removeLesson}
            onMoveLessonUp={id => moveLessonInGroup(id, 'up', modLessons)}
            onMoveLessonDown={id => moveLessonInGroup(id, 'down', modLessons)}
            onAddLesson={() => addLessonToModule(module.id)}
            submitAttempted={submitAttempted}
            openLessonId={openLessonId}
            onToggleLesson={handleToggleLesson}
          />
        );
      })}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={addLesson}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition"
        >
          <Plus size={15} /> Adicionar Aula
        </button>
        <button
          type="button"
          onClick={addModule}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-3 text-sm font-semibold text-on-surface-variant hover:text-white hover:border-white/25 hover:bg-white/5 transition"
        >
          <Plus size={15} /> Adicionar Modulo (opcional)
        </button>
      </div>
    </div>
  );
}
