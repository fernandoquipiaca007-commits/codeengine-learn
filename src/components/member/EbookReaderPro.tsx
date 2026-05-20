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
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('continuous');
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

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
        scrollToPage(page - 1);
      } else if (e.key === 'ArrowRight' && page < numPages) {
        setPage((p) => p + 1);
        scrollToPage(page + 1);
      } else if (e.key === 'Home') {
        setPage(1);
        scrollToPage(1);
      } else if (e.key === 'End') {
        setPage(numPages);
        scrollToPage(numPages);
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

  // Detectar página visível durante scroll (modo contínuo)
  useEffect(() => {
    if (viewMode !== 'continuous' || !pdfContainerRef.current) return;

    const handleScroll = () => {
      const container = pdfContainerRef.current;
      if (!container) return;

      const pages = container.querySelectorAll('.react-pdf__Page');
      let visiblePage = 1;

      pages.forEach((pageElement, index) => {
        const rect = pageElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Verifica se a página está visível no viewport
        if (rect.top < containerRect.height / 2 && rect.bottom > containerRect.height / 2) {
          visiblePage = index + 1;
        }
      });

      if (visiblePage !== currentVisiblePage) {
        setCurrentVisiblePage(visiblePage);
        setPage(visiblePage);
      }
    };

    const container = pdfContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentVisiblePage]);

  // Função para rolar até uma página específica
  const scrollToPage = (pageNum: number) => {
    if (!pdfContainerRef.current) return;
    
    const pages = pdfContainerRef.current.querySelectorAll('.react-pdf__Page');
    const targetPage = pages[pageNum - 1];
    
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <div ref={containerRef} className="min-h-screen pb-20">
      {/* Header simples */}
      <div className="px-4 sm:px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-display font-semibold text-lg">
            CodeEngine <span className="text-gray-500">Learn</span>
          </span>
        </button>
      </div>

      {/* Container principal */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegação - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Card de progresso */}
              <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Capítulos
                </h3>
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                  {Array.from({ length: Math.ceil(numPages / 10) }, (_, i) => {
                    const startPage = i * 10 + 1;
                    const endPage = Math.min((i + 1) * 10, numPages);
                    const isActive = page >= startPage && page <= endPage;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setPage(startPage);
                          scrollToPage(startPage);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary/10 border-2 border-primary text-primary'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Páginas {startPage}-{endPage}
                          </span>
                          {isActive && <BookOpen className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Marcadores */}
              {bookmarks.length > 0 && (
                <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                  <h3 className="font-display text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Marcadores
                  </h3>
                  <div className="space-y-2">
                    {bookmarks.slice(0, 5).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          scrollToPage(p);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-sm text-gray-300 flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4 text-primary fill-current" />
                        Página {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Área do PDF - 3/4 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header do documento */}
            <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Página {page} de {numPages}</span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{Math.round(progressPercent)}% completo</span>
                  </div>
                </div>

                {/* Botão de menu mobile */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de progresso */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Visualizador de PDF - Modo Contínuo Suave */}
            <div 
              ref={pdfContainerRef}
              className="pdf-scroll-container relative rounded-3xl overflow-hidden bg-white shadow-2xl border-2 border-white/10"
              style={{
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
              }}
            >
              {url && format === 'pdf' && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <Document
                    file={url}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    loading={
                      <div className="flex items-center justify-center p-20 bg-gray-100">
                        <div className="text-center space-y-4">
                          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto" />
                          <p className="text-gray-600">Carregando documento...</p>
                        </div>
                      </div>
                    }
                    error={
                      <div className="p-20 text-center bg-gray-100">
                        <p className="text-red-500 font-medium">Erro ao carregar PDF</p>
                      </div>
                    }
                  >
                    {/* Renderizar todas as páginas em modo contínuo */}
                    {Array.from(new Array(numPages), (el, index) => (
                      <div
                        key={`page_${index + 1}`}
                        className="mb-4 shadow-lg"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transformOrigin: 'center',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        <Page
                          pageNumber={index + 1}
                          width={Math.min(900, window.innerWidth - 100)}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="mx-auto"
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}

              {format === 'epub' && (
                <div className="p-20 text-center bg-gray-100">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Formato EPUB detectado. Use o botão de download para ler em seu dispositivo preferido.
                  </p>
                  {url && (
                    <a
                      href={url}
                      download
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Baixar EPUB
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Controles de navegação */}
            <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Navegação de páginas */}
                <div className="flex items-center gap-3">
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, page - 1);
                      setPage(newPage);
                      scrollToPage(newPage);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                    <input
                      type="number"
                      min={1}
                      max={numPages}
                      value={page}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= numPages) {
                          setPage(val);
                          scrollToPage(val);
                        }
                      }}
                      className="w-16 px-2 py-1 text-center bg-transparent text-white focus:outline-none"
                    />
                    <span className="text-sm text-gray-400">/ {numPages}</span>
                  </div>

                  <button
                    disabled={page >= numPages}
                    onClick={() => {
                      const newPage = Math.min(numPages, page + 1);
                      setPage(newPage);
                      scrollToPage(newPage);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Controles de visualização */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-mono w-12 text-center text-gray-400">
                    {Math.round(zoom * 100)}%
                  </span>

                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>

                  <div className="w-px h-6 bg-white/10 mx-2" />

                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Rotacionar"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleBookmark}
                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                      bookmarks.includes(page) ? 'text-primary' : ''
                    }`}
                    title="Adicionar marcador"
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarks.includes(page) ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      const themes: Theme[] = ['light', 'dark', 'sepia'];
                      const currentIndex = themes.indexOf(theme);
                      setTheme(themes[(currentIndex + 1) % themes.length]);
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Alternar tema"
                  >
                    {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:block"
                    title="Tela cheia"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configurações mobile */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full space-y-6 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Configurações</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-400">Tema de Leitura</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5'
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
                  <label className="block text-sm font-medium mb-3 text-gray-400">
                    Marcadores ({bookmarks.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                    {bookmarks.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          setShowSettings(false);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-all flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4 text-primary fill-current" />
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
    </div>
  );
}
