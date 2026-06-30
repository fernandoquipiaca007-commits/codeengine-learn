import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Film, CheckSquare, Square, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Lesson {
  id: string;
  title: string;
  video_duration_seconds: number | null;
  display_order: number;
}

interface CourseDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud';

export function CourseDownloadModal({
  isOpen,
  onClose,
  productId,
  productTitle,
}: CourseDownloadModalProps) {
  const { t } = useTranslation('member');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadStatus, setDownloadStatus] = useState<Record<string, 'idle' | 'downloading' | 'completed' | 'error'>>({});
  const [overallError, setOverallError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchLessons();
    }
  }, [isOpen, productId]);

  async function fetchLessons() {
    setLoading(true);
    setOverallError(null);
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, video_duration_seconds, display_order')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
      // Default select all
      setSelectedIds(new Set((data || []).map((l) => l.id)));
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setOverallError(t('courseDownloadModal.errorLoading'));
    } finally {
      setLoading(false);
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === lessons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(lessons.map((l) => l.id)));
    }
  };

  const toggleSelectLesson = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  async function startParallelDownloads() {
    const idsToDownload = Array.from(selectedIds);
    if (idsToDownload.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setOverallError(t('courseDownloadModal.loginRequired'));
      return;
    }

    setOverallError(null);

    // Download each lesson in parallel
    const downloadPromises = idsToDownload.map(async (lessonId) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;

      setDownloadStatus((prev) => ({ ...prev, [lessonId]: 'downloading' }));
      setDownloadProgress((prev) => ({ ...prev, [lessonId]: 0 }));

      try {
        const response = await fetch(`${BACKEND_URL}/api/lessons/${lessonId}/download`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          throw new Error(t('courseDownloadModal.downloadFailed'));
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error(t('courseDownloadModal.readerUnavailable'));

        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          if (total) {
            const pct = Math.round((loaded / total) * 100);
            setDownloadProgress((prev) => ({ ...prev, [lessonId]: pct }));
          }
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = `${lesson.display_order.toString().padStart(2, '0')} - ${lesson.title}.mp4`;
        const match = disposition?.match(/filename="?([^";\n]+)"?/);
        if (match) filename = decodeURIComponent(match[1]);

        const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        setDownloadStatus((prev) => ({ ...prev, [lessonId]: 'completed' }));
      } catch (err) {
        console.error(`Download failed for lesson ${lessonId}:`, err);
        setDownloadStatus((prev) => ({ ...prev, [lessonId]: 'error' }));
      }
    });

    await Promise.all(downloadPromises);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#121216]/98 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden animate-[scaleIn_0.3s_ease-out] flex flex-col max-h-[85vh]">
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white leading-tight">
                {t('courseDownloadModal.title')}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant mt-1 truncate max-w-[320px] sm:max-w-md">
                {productTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {overallError && (
          <div className="relative z-10 my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="font-sans text-sm text-red-400">{overallError}</p>
          </div>
        )}

        {/* Bulk control */}
        {!loading && lessons.length > 0 && (
          <div className="relative z-10 py-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              {selectedIds.size === lessons.length ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === lessons.length ? t('courseDownloadModal.deselectAll') : t('courseDownloadModal.selectAll')}
            </button>
            <span className="font-sans text-xs text-on-surface-variant">
              {t('courseDownloadModal.selectedCount', { selected: selectedIds.size, total: lessons.length })}
            </span>
          </div>
        )}

        {/* List of episodes */}
        <div className="relative z-10 flex-1 overflow-y-auto my-4 space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-sans text-sm text-on-surface-variant">{t('courseDownloadModal.loadingEpisodes')}</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-20 font-sans text-sm text-on-surface-variant">
              {t('courseDownloadModal.noEpisodes')}
            </div>
          ) : (
            lessons.map((lesson) => {
              const isSelected = selectedIds.has(lesson.id);
              const status = downloadStatus[lesson.id] || 'idle';
              const progress = downloadProgress[lesson.id] || 0;

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between p-3 rounded-xl border border-white/10 transition-all duration-300 ${
                    status === 'downloading'
                      ? 'bg-primary/10 border-primary/30'
                      : isSelected
                      ? 'bg-white/10'
                      : 'opacity-70 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <button
                      onClick={() => status === 'idle' && toggleSelectLesson(lesson.id)}
                      disabled={status === 'downloading'}
                      className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-white truncate">
                        {lesson.display_order.toString().padStart(2, '0')}. {lesson.title}
                      </p>
                      <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                        {t('courseDownloadModal.duration', { duration: formatDuration(lesson.video_duration_seconds) })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 min-w-[120px] justify-end">
                    {status === 'idle' && (
                      <span className="font-sans text-xs text-on-surface-variant">{t('courseDownloadModal.ready')}</span>
                    )}

                    {status === 'downloading' && (
                      <div className="w-full max-w-[100px] space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] text-primary">
                          <span>{t('courseDownloadModal.downloading')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-sans text-xs">{t('courseDownloadModal.completed')}</span>
                      </div>
                    )}

                    {status === 'error' && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-sans text-xs">{t('courseDownloadModal.error')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {!loading && lessons.length > 0 && (
          <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-white transition-colors"
            >
              {t('courseDownloadModal.cancel')}
            </button>
            <button
              onClick={startParallelDownloads}
              disabled={selectedIds.size === 0 || Object.values(downloadStatus).some((s) => s === 'downloading')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-display text-xs font-semibold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(192,193,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {t('courseDownloadModal.downloadSelected')}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
