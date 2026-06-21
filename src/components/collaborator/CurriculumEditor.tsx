import { useState, useEffect } from 'react';
import {
  Trash2 as LucideTrash2,
  ChevronUp as LucideChevronUp,
  ChevronDown as LucideChevronDown,
  GripVertical as LucideGripVertical,
  Video as LucideVideo,
  Headphones as LucideHeadphones
} from 'lucide-react';

const Trash2 = LucideTrash2 as any;
const ChevronUp = LucideChevronUp as any;
const ChevronDown = LucideChevronDown as any;
const GripVertical = LucideGripVertical as any;
const Video = LucideVideo as any;
const Headphones = LucideHeadphones as any;
import {
  CourseModule,
  CourseLesson,
  loadCurriculum,
  saveModule,
  deleteModule,
  saveLesson,
  deleteLesson,
} from '../../lib/curriculum';

interface CurriculumEditorProps {
  productId: string;
  onChange?: (lessons: CourseLesson[]) => void;
}

export function CurriculumEditor({ productId, onChange }: CurriculumEditorProps) {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) load();
  }, [productId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadCurriculum(productId);
      setModules(data.modules);
      setLessons(data.lessons);
      onChange?.(data.lessons);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function addModule() {
    setSavingMessage('A criar módulo...');
    setSaving(true);
    try {
      const m = await saveModule(productId, {
        title: `Módulo ${modules.length + 1}`,
        display_order: modules.length,
      });
      setModules([...modules, m]);
    } catch (err: any) {
      setUploadError(err.message || 'Falha ao criar o módulo.');
    } finally {
      setSaving(false);
      setSavingMessage(null);
    }
  }

  async function addLesson(moduleId?: string) {
    setSavingMessage('A criar aula...');
    setSaving(true);
    try {
      const l = await saveLesson(productId, {
        title: `Aula ${lessons.length + 1}`,
        module_id: moduleId || null,
        display_order: lessons.filter((x) => x.module_id === moduleId).length,
        lesson_type: 'video',
        is_preview: false,
        is_active: true,
      });
      const updated = [...lessons, l];
      setLessons(updated);
      onChange?.(updated);
    } catch (err: any) {
      setUploadError(err.message || 'Falha ao criar a aula.');
    } finally {
      setSaving(false);
      setSavingMessage(null);
    }
  }

  async function handleLessonFile(lessonId: string, file: File) {
    setSavingMessage('A carregar ficheiro da aula...');
    setSaving(true);
    setUploadError(null);
    try {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      const updated = await saveLesson(productId, lesson, file);
      const list = lessons.map((l) => (l.id === lessonId ? updated : l));
      setLessons(list);
      onChange?.(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar o ficheiro da aula.';
      setUploadError(message);
      console.error('Lesson upload error:', err);
    } finally {
      setSaving(false);
      setSavingMessage(null);
    }
  }

  async function moveLesson(lessonId: string, direction: 'up' | 'down') {
    const sorted = [...lessons].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await saveLesson(productId, { ...a, display_order: b.display_order });
    await saveLesson(productId, { ...b, display_order: a.display_order });
    await load();
  }

  const unassignedLessons = lessons.filter((l) => !l.module_id);
  const lessonsByModule = (moduleId: string) =>
    lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.display_order - b.display_order);

  const LESSON_TYPE_LABELS = { video: '🎬 Vídeo', audio: '🎧 Áudio', link: '🔗 Link Externo' };

  function renderLessonRow(lesson: CourseLesson) {
    const lessonType = lesson.lesson_type || 'video';

    return (
      <div key={lesson.id} className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-on-surface-variant mt-2 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={lesson.title}
              onChange={(e) =>
                setLessons(lessons.map((l) => (l.id === lesson.id ? { ...l, title: e.target.value } : l)))
              }
              onBlur={() => saveLesson(productId, lesson).then(load)}
              className="w-full bg-surface-high border border-white/10 rounded-md px-3 py-2 text-sm text-white"
              placeholder="Título da aula"
            />
            <textarea
              value={lesson.description || ''}
              onChange={(e) =>
                setLessons(lessons.map((l) => (l.id === lesson.id ? { ...l, description: e.target.value } : l)))
              }
              onBlur={() => saveLesson(productId, lesson).then(load)}
              className="w-full bg-surface-high border border-white/10 rounded-md px-3 py-2 text-sm text-white"
              rows={2}
              placeholder="Descrição"
            />

            {/* Lesson Type Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={lessonType}
                onChange={(e) => {
                  const updated = { ...lesson, lesson_type: e.target.value as CourseLesson['lesson_type'] };
                  setLessons(lessons.map((l) => (l.id === lesson.id ? updated : l)));
                  saveLesson(productId, updated).then(load);
                }}
                className="border border-white/10 rounded-md px-2 py-1 text-sm bg-surface-high text-white focus:outline-none"
              >
                {Object.entries(LESSON_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={lesson.is_preview}
                  onChange={(e) => {
                    const updated = { ...lesson, is_preview: e.target.checked };
                    saveLesson(productId, updated).then(load);
                  }}
                  className="rounded border-white/10 bg-surface-high focus:ring-primary"
                />
                Preview na store
              </label>

              {lessonType === 'video' && lesson.video_storage_path && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Video className="w-3 h-3" /> Vídeo carregado
                  {lesson.video_duration_seconds
                    ? ` (${Math.floor(lesson.video_duration_seconds / 60)}min)`
                    : ''}
                </span>
              )}
              {lessonType === 'audio' && lesson.audio_storage_path && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Headphones className="w-3 h-3" /> Áudio carregado
                  {lesson.video_duration_seconds
                    ? ` (${Math.floor(lesson.video_duration_seconds / 60)}min)`
                    : ''}
                </span>
              )}
            </div>

            {/* Media Upload based on type */}
            {lessonType === 'video' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  disabled={saving}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleLessonFile(lesson.id, f);
                  }}
                  className="text-xs text-on-surface-variant file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-white/10 file:text-white"
                />
                <p className="text-[10px] text-on-surface-variant">
                  MP4/WebM/MOV até 2GB.
                </p>
              </div>
            )}

            {lessonType === 'audio' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,.mp3,.ogg,.wav,.m4a"
                  disabled={saving}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleLessonFile(lesson.id, f);
                  }}
                  className="text-xs text-on-surface-variant file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-white/10 file:text-white"
                />
                <p className="text-[10px] text-on-surface-variant">
                  MP3/OGG/WAV até 500MB.
                </p>
              </div>
            )}

            {lessonType === 'link' && (
              <div>
                <input
                  type="url"
                  value={lesson.external_url || ''}
                  onChange={(e) =>
                    setLessons(lessons.map((l) => (l.id === lesson.id ? { ...l, external_url: e.target.value } : l)))
                  }
                  onBlur={() => saveLesson(productId, lesson).then(load)}
                  className="w-full bg-surface-high border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                  placeholder="https://exemplo.com/recurso"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  URL externo (Notion, Google Docs, artigo, etc.)
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => moveLesson(lesson.id, 'up')} className="p-1 hover:bg-white/10 rounded text-on-surface-variant">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => moveLesson(lesson.id, 'down')} className="p-1 hover:bg-white/10 rounded text-on-surface-variant">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => deleteLesson(lesson.id).then(load)}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Carregando curriculum...</p>;
  }

  return (
    <div className="space-y-6 border border-primary/20 rounded-xl p-6 bg-white/5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white font-display">Estrutura e Aulas do Curso</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addModule}
            disabled={saving}
            className="text-xs px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 text-white font-semibold"
          >
            + Módulo
          </button>
          <button
            type="button"
            onClick={() => addLesson()}
            disabled={saving}
            className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-high font-semibold"
          >
            + Aula
          </button>
        </div>
      </div>

      {/* Diretrizes de Estruturação */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-on-surface-variant space-y-2 font-sans">
        <h4 className="font-bold text-white flex items-center gap-1.5 font-display text-xs uppercase tracking-wider">
          💡 Guia de Estruturação do Curso
        </h4>
        <p className="text-xs leading-relaxed">
          Para garantir uma excelente experiência de aprendizagem para os alunos, siga estas boas práticas:
        </p>
        <ul className="list-disc pl-4 text-[11px] space-y-1 text-on-surface-variant/80">
          <li>
            <strong>Aula de Introdução:</strong> Adicione a primeira aula (geralmente uma introdução ou aula de boas-vindas) diretamente no início, fora de qualquer módulo ("Aulas sem módulo"), para que sirva de apresentação na página inicial do produto.
          </li>
          <li>
            <strong>Módulos Estruturados:</strong> Divida o resto do conteúdo principal do seu curso em módulos organizados. Dê a cada módulo um título claro e uma descrição detalhada explicando o que será abordado.
          </li>
          <li>
            <strong>Aulas com Detalhes:</strong> Adicione títulos e descrições explicativas para cada aula, e faça o upload do vídeo/áudio ou link correspondente de forma estruturada para o aluno assistir com coerência.
          </li>
        </ul>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
          {uploadError}
        </div>
      )}

      {saving && (
        <p className="text-xs text-primary animate-pulse font-medium">{savingMessage || 'A carregar...'}</p>
      )}

      {modules.map((mod) => (
        <div key={mod.id} className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={mod.title}
                onChange={(e) =>
                  setModules(modules.map((m) => (m.id === mod.id ? { ...m, title: e.target.value } : m)))
                }
                onBlur={() => saveModule(productId, mod)}
                className="font-semibold text-white bg-transparent border-b border-white/10 focus:border-primary outline-none w-full font-display text-lg pb-1"
                placeholder="Título do Módulo (ex: Módulo 1 - Introdução)"
              />
              <textarea
                value={mod.description || ''}
                onChange={(e) =>
                  setModules(modules.map((m) => (m.id === mod.id ? { ...m, description: e.target.value } : m)))
                }
                onBlur={() => saveModule(productId, mod)}
                className="w-full bg-surface-high border border-white/10 rounded-md px-3 py-2 text-xs text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
                rows={2}
                placeholder="Escreva uma descrição detalhada sobre o que o aluno vai aprender neste módulo..."
              />
            </div>
            <div className="flex gap-2 items-center flex-shrink-0 mt-1">
              <button type="button" onClick={() => addLesson(mod.id)} className="text-xs text-primary font-semibold hover:underline mr-2">
                + Aula
              </button>
              <button type="button" onClick={() => deleteModule(mod.id).then(load)} className="text-red-400 p-1 hover:bg-red-500/10 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-3">{lessonsByModule(mod.id).map(renderLessonRow)}</div>
        </div>
      ))}

      {unassignedLessons.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Aulas sem módulo (Apresentação / Introdução)</h4>
          <div className="space-y-3">{unassignedLessons.map(renderLessonRow)}</div>
        </div>
      )}

      {lessons.length === 0 && (
        <p className="text-xs text-on-surface-variant">
          Adicione pelo menos uma aula antes de publicar o curso.
        </p>
      )}
    </div>
  );
}
