import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  BookOpen,
  Maximize,
  Minimize,
  RotateCw,
  Download,
  Bookmark,
  Settings,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getEbookReadUrl, saveProgress, getProductProgress } from '../../lib/learning-api';
import { useLocale } from '../../contexts/LocaleContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookReaderProProps {
  productId: string;
  onBack: () => void;
}

type Theme = 'light' | 'dark' | 'sepia';
type ViewMode = 'single' | 'double' | 'continuous';

export function EbookReaderPro({ productId, onBack }: EbookReaderProProps) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado básico
  const [url, setUrl] = useState<string | null>(null);
  const [format, setFormat] = useState('pdf');
  const [title, setTitle] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Estado de UI/UX
  const [theme, setTheme] = useState<Theme>('dark');
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  // Carregar dados
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ebook, prog] = await Promise.all([
        getEbookReadUrl(productId, locale),
        getProductProgress(productId).catch(() => null),
      ]);

      setUrl(ebook.url);
      setFormat(ebook.format || 'pdf');

      if (prog?.product?.title) setTitle(prog.product.title);

      // Restaurar progresso
      const savedPage = prog?.progress?.find(
        (p: { lesson_id: null; page_number?: number }) => !p.lesson_id
      )?.page_number;
      if (savedPage && savedPage > 1) setPage(savedPage);

      // Restaurar preferências
      const prefs = prog?.preferences;
      if (prefs) {
        if (prefs.reading_theme) setTheme(prefs.reading_theme);
        if (prefs.bookmarks) setBookmarks(prefs.bookmarks);
      }
    } catch (e) {
      console.error('Erro ao carregar e-book:', e);
    } finally {
      setLoading(false);
    }
  }, [productId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  // Salvar progresso automaticamente
  useEffect(() => {
    if (!numPages || format !== 'pdf' || page < 1) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const pct = (page / numPages) * 100;
      saveProgress({
        product_id: productId,
        progress_type: 'ebook',
        page_number: page,
        position_percent: pct,
        status: pct >= 95 ? 'completed' : 'in_progress',
      });
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [page, numPages, productId, format]);

  // Salvar ao sair
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (numPages && page > 0) {
        const pct = (page / numPages) * 100;
        saveProgress({
          product_id: productId,
          progress_type: 'ebook',
          page_number: page,
          position_percent: pct,
          status: pct >= 95 ? 'completed' : 'in_progress',
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [page, numPages, productId]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && page > 1) {
        setPage((p) => p - 1);
      } else if (e.key === 'ArrowRight' && page < numPages) {
        setPage((p) => p + 1);
      } else if (e.key === 'Home') {
        setPage(1);
      } else if (e.key === 'End') {
        setPage(numPages);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(3, z + 0.1));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.5, z - 0.1));
      } else if (e.key === 'f' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, numPages]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Bookmark
  const toggleBookmark = () => {
    setBookmarks((prev) => {
      if (prev.includes(page)) {
        return prev.filter((p) => p !== page);
      } else {
        return [...prev, page].sort((a, b) => a - b);
      }
    });
  };

  // Temas
  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-white',
    sepia: 'bg-[#f4ecd8] text-[#5c4a3a]',
  };

  const themeContainerClasses = {
    light: 'bg-gray-100',
    dark: 'bg-black',
    sepia: 'bg-[#e8dcc0]',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto" />
          <p className="text-on-surface-variant">Carregando seu e-book...</p>
        </div>
      </div>
    );
  }

  const progressPercent = numPages > 0 ? (page / numPages) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-surface/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Voltar e Título */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-lg sm:text-xl font-bold truncate">{title}</h1>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span>
                    Página {page} de {numPages}
                  </span>
                  <span>•</span>
                  <span>{Math.round(progressPercent)}% concluído</span>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Zoom */}
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Tema */}
              <button
                onClick={() => {
                  const themes: Theme[] = ['light', 'dark', 'sepia'];
                  const currentIndex = themes.indexOf(theme);
                  setTheme(themes[(currentIndex + 1) % themes.length]);
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
                title="Alternar tema"
              >
                {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Rotação */}
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden md:block"
                title="Rotacionar"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Bookmark */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                  bookmarks.includes(page) ? 'text-primary' : ''
                }`}
                title="Adicionar marcador"
              >
                <Bookmark className={bookmarks.includes(page) ? 'fill-current' : ''} />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:block"
                title="Tela cheia"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Painel de configurações */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Configurações</h2>
              <button onClick={() => setShowSettings(false)} className="text-on-surface-variant hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tema</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        theme === t ? 'border-primary' : 'border-white/10'
                      }`}
                    >
                      {t === 'light' && '☀️ Claro'}
                      {t === 'dark' && '🌙 Escuro'}
                      {t === 'sepia' && '📜 Sépia'}
                    </button>
                  ))}
                </div>
              </div>

              {bookmarks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Marcadores ({bookmarks.length})</label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {bookmarks.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          setShowSettings(false);
                        }}
                        className="w-full text-left p-2 rounded hover:bg-white/10 text-sm"
                      >
                        Página {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo do PDF */}
      <div className={`${themeContainerClasses[theme]} min-h-screen py-8`}>
        <div className="max-w-5xl mx-auto px-4">
          {url && format === 'pdf' && (
            <div className="flex flex-col items-center space-y-6">
              <div
                className="shadow-2xl rounded-lg overflow-hidden"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.3s ease',
                }}
              >
                <Document
                  file={url}
                  onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                  loading={
                    <div className="flex items-center justify-center p-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
                    </div>
                  }
                  error={
                    <div className="p-20 text-center">
                      <p className="text-red-500">Erro ao carregar PDF</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={page}
                    width={Math.min(800, window.innerWidth - 48)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              </div>

              {/* Navegação inferior */}
              <div className="flex items-center gap-4 bg-surface/80 backdrop-blur-lg rounded-full px-6 py-3 border border-white/10">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={numPages}
                    value={page}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= numPages) setPage(val);
                    }}
                    className="w-16 px-2 py-1 text-center bg-white/10 rounded border border-white/20 focus:border-primary focus:outline-none"
                  />
                  <span className="text-sm text-on-surface-variant">/ {numPages}</span>
                </div>

                <button
                  disabled={page >= numPages}
                  onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                  className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Próxima página"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {format === 'epub' && (
            <div className="text-center space-y-4">
              <p className="text-on-surface-variant">
                Formato EPUB detectado. Use o botão de download para ler em seu dispositivo preferido.
              </p>
              {url && (
                <a
                  href={url}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Baixar EPUB
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
