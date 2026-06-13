import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  Search,
  Moon,
  Sun,
  Settings,
  MoreVertical,
  Bot
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import i18n from '../../lib/i18n';
import { getEbookReadUrl, saveProgress, getProductProgress } from '../../lib/learning-api';
import { useLocale } from '../../contexts/LocaleContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ReadingMentorPanel } from '../assistant/ReadingMentorPanel';

// ═══ ESTABILIDADE: Worker local Vite (sem CDN externo) ═══
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ═══ ERROR BOUNDARY ═══
// Impede que um crash na biblioteca de PDF destrua todo o ecrã (tela preta)
class ReaderErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ReaderErrorBoundary apanhou um crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090b] text-white">
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center space-y-4">
            <h3 className="text-xl font-bold text-red-400">{i18n.t('member:ebookReader.engineError')}</h3>
            <p className="text-gray-400 text-sm">{i18n.t('member:ebookReader.engineErrorDesc')}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-[#0078d4] rounded-xl font-bold w-full hover:bg-[#106ebe] transition-colors"
            >
              {i18n.t('member:ebookReader.reloadReader')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface EbookReaderProProps {
  productId: string;
  onBack: () => void;
  lang?: any;
}

type Theme = 'light' | 'dark' | 'auto';
type ViewMode = 'fit-width' | 'fit-page' | 'actual-size';
type RenderQuality = 'auto' | 'performance' | 'high-quality';
type PageSpacing = 'compact' | 'normal';

export function EbookReaderPro({ productId, onBack, lang }: EbookReaderProProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('member');
  const effectiveLocale = lang || locale;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPageRef = useRef(1);
  const scrolledOnLoad = useRef(false);

  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMentor, setShowMentor] = useState(false);
  const [title, setTitle] = useState('');
  
  const [containerWidth, setContainerWidth] = useState(1200);
  const [aspectRatio, setAspectRatio] = useState(1.4142); 
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2, 3]));

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(`pdf-theme-${productId}`);
    return (saved as Theme) || 'light';
  });
  
  const [visualZoom, setVisualZoom] = useState(() => {
    const saved = localStorage.getItem(`pdf-zoom-${productId}`);
    const isMobile = window.innerWidth < 640;
    const defaultZoom = isMobile ? 0.2 : 0.6;
    if (saved) {
      const parsedZoom = parseFloat(saved);
      if (isNaN(parsedZoom) || parsedZoom <= 0) return defaultZoom;
      return parsedZoom;
    }
    return defaultZoom;
  });
  
  const [rotation, setRotation] = useState(() => {
    const saved = localStorage.getItem(`pdf-rotation-${productId}`);
    return saved ? parseInt(saved) : 0;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`pdf-viewmode-${productId}`);
    return (saved as ViewMode) || 'fit-width';
  });
  
  const [renderQuality, setRenderQuality] = useState<RenderQuality>(() => {
    const isMobile = window.innerWidth < 768;
    return isMobile ? 'performance' : 'auto';
  });
  const [pageSpacing, setPageSpacing] = useState<PageSpacing>('compact');
  
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
  }), []);

  // ═══ SOLUÇÃO ANTI-LOOP ═══
  // window.resize em vez de ResizeObserver (evita loop infinito com scrollbar)
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageWidth = useMemo(() => {
    const isMobile = containerWidth < 640;
    const padding = isMobile ? 0 : 64; 
    const safeWidth = Math.max(320, containerWidth); 
    
    switch (viewMode) {
      case 'fit-width': return safeWidth - padding;
      case 'fit-page': return Math.min(1200, safeWidth - padding);
      case 'actual-size': return isMobile ? safeWidth - padding : 816; 
      default: return safeWidth - padding;
    }
  }, [viewMode, containerWidth]);

  const staticRenderScale = useMemo(() => {
    switch (renderQuality) {
      case 'performance': return 1.0;
      case 'high-quality': return 2.0; 
      case 'auto': default: return 1.5;
    }
  }, [renderQuality]);

  const pageGap = pageSpacing === 'compact' ? 0 : 2;

  // ═══ Persistência local ═══
  useEffect(() => localStorage.setItem(`pdf-theme-${productId}`, theme), [theme, productId]);
  useEffect(() => localStorage.setItem(`pdf-zoom-${productId}`, visualZoom.toString()), [visualZoom, productId]);
  useEffect(() => localStorage.setItem(`pdf-rotation-${productId}`, rotation.toString()), [rotation, productId]);
  useEffect(() => localStorage.setItem(`pdf-viewmode-${productId}`, viewMode), [viewMode, productId]);

  // ═══ Carregar dados ═══
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ebook, prog] = await Promise.all([
        getEbookReadUrl(productId, effectiveLocale),
        getProductProgress(productId).catch(() => null),
      ]);
      setUrl(ebook.url);
      if (prog?.product?.title) {
        setTitle(prog.product.title);
      }

      // Restore position from localStorage (priority) or server
      const localData = localStorage.getItem(`ebook_progress_${productId}`);
      let initialPage = 1;

      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.page_number > 1) {
            initialPage = parsed.page_number;
          }
        } catch (e) {}
      }

      if (initialPage === 1) {
        const serverPage = prog?.progress?.find((p: { lesson_id: null; page_number?: number }) => !p.lesson_id)?.page_number;
        if (serverPage && serverPage > 1) {
          initialPage = serverPage;
        }
      }

      initialPageRef.current = initialPage;

      if (initialPage > 1) {
        setCurrentPage(initialPage);
        setVisiblePages(new Set([Math.max(1, initialPage - 1), initialPage, initialPage + 1]));

        // Fallback timeout to scroll as a secondary mechanism
        setTimeout(() => {
          if (!scrolledOnLoad.current) {
            goToPage(initialPage);
          }
        }, 1500);
      }
      const prefs = prog?.preferences;
      if (prefs && prefs.bookmarks) setBookmarks(prefs.bookmarks);
    } catch (e) {
      setError(t('ebookReader.loadError'));
    } finally {
      setLoading(false);
    }
  }, [productId, locale]);

  useEffect(() => { load(); }, [load]);

  // ═══ Salvar progresso automaticamente ═══
  useEffect(() => {
    if (!numPages || currentPage < 1) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const pct = (currentPage / numPages) * 100;

      // Save to server
      saveProgress({
        product_id: productId,
        progress_type: 'ebook',
        page_number: currentPage,
        position_percent: pct,
        status: pct >= 95 ? 'completed' : 'in_progress',
      }).catch(() => {});

      // Save to localStorage for instant "Continue" support
      localStorage.setItem(`ebook_progress_${productId}`, JSON.stringify({
        page_number: currentPage,
        timestamp: Date.now()
      }));
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [currentPage, numPages, productId]);

  // ═══ ESTABILIDADE: Salvar ao sair ═══
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (numPages && currentPage > 0) {
        const pct = (currentPage / numPages) * 100;
        saveProgress({
          product_id: productId,
          progress_type: 'ebook',
          page_number: currentPage,
          position_percent: pct,
          status: pct >= 95 ? 'completed' : 'in_progress',
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentPage, numPages, productId]);

  // Keep a ref of currentPage so that the IntersectionObserver doesn't have to re-subscribe
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // ═══ Scroll Contínuo Virtualizado com IntersectionObserver ═══
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !numPages) return;

    const pageIntersectionMap = new Map<number, boolean>();

    const observerOptions = {
      root: container,
      rootMargin: '10% 0px 10% 0px',
      threshold: [0.01, 0.5, 0.99]
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const pageNum = Number(entry.target.getAttribute('data-page'));
        if (isNaN(pageNum)) return;
        pageIntersectionMap.set(pageNum, entry.isIntersecting);
      });

      // Calculate which pages are visible
      const newVisible = new Set<number>();
      for (let i = 1; i <= numPages; i++) {
        if (pageIntersectionMap.get(i)) {
          newVisible.add(i);
        }
      }

      // Preload buffer
      const isMobile = window.innerWidth < 768;
      const buffer = isMobile ? 1 : 2;
      const expandedVisible = new Set<number>();
      newVisible.forEach((pageNum) => {
        const start = Math.max(1, pageNum - buffer);
        const end = Math.min(numPages, pageNum + buffer);
        for (let i = start; i <= end; i++) {
          expandedVisible.add(i);
        }
      });

      // Default fallback when initial load hasn't processed intersections yet
      if (expandedVisible.size === 0) {
        const curr = currentPageRef.current;
        const start = Math.max(1, curr - buffer);
        const end = Math.min(numPages, curr + buffer);
        for (let i = start; i <= end; i++) {
          expandedVisible.add(i);
        }
      }

      setVisiblePages((prev) => {
        if (prev.size !== expandedVisible.size) return expandedVisible;
        let changed = false;
        for (const item of expandedVisible) {
          if (!prev.has(item)) {
            changed = true;
            break;
          }
        }
        return changed ? expandedVisible : prev;
      });

      // Determine active page centered in scroll container
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;
      let closestPageNum = currentPageRef.current;
      let minDistance = Infinity;

      const pageElements = container.querySelectorAll('[data-page]');
      pageElements.forEach((pageElement) => {
        const pageNum = Number(pageElement.getAttribute('data-page'));
        if (pageIntersectionMap.get(pageNum)) {
          const rect = pageElement.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          const distance = Math.abs(elementCenter - containerCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestPageNum = pageNum;
          }
        }
      });

      if (closestPageNum !== currentPageRef.current && closestPageNum >= 1 && closestPageNum <= numPages) {
        setCurrentPage(closestPageNum);
      }
    };

    const observer = new IntersectionObserver(callback, observerOptions);

    // Observe each page wrapper element
    const pageWrappers = container.querySelectorAll('[data-page]');
    pageWrappers.forEach((wrapper) => observer.observe(wrapper));

    return () => {
      observer.disconnect();
    };
  }, [numPages]);

  // ═══ Navegação ═══
  const goToPage = useCallback((pageNum: number) => {
    if (!scrollContainerRef.current || pageNum < 1) return;
    const targetPage = scrollContainerRef.current.querySelector(`[data-page="${pageNum}"]`);
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  }, []);

  // ═══ PRECISION SCROLL ON LOAD ═══
  useEffect(() => {
    if (numPages > 0 && !scrolledOnLoad.current && initialPageRef.current > 1) {
      scrolledOnLoad.current = true;
      setTimeout(() => {
        goToPage(initialPageRef.current);
      }, 300);
    }
  }, [numPages, goToPage]);

  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.2, Math.min(10, newZoom));
    setVisualZoom(clampedZoom);
  }, []);

  // ═══ Atalhos de teclado ═══
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goToPage(currentPage - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToPage(currentPage + 1); }
      else if (e.key === 'Home') { e.preventDefault(); goToPage(1); }
      else if (e.key === 'End') { e.preventDefault(); goToPage(numPages); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); handleZoomChange(visualZoom + 0.1); }
      else if (e.key === '-') { e.preventDefault(); handleZoomChange(visualZoom - 0.1); }
      else if (e.key === '0') { e.preventDefault(); handleZoomChange(1.0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, visualZoom, goToPage, handleZoomChange]);

  // ═══ Bookmarks ═══
  const toggleBookmark = useCallback(() => {
    setBookmarks((prev) => {
      const newBookmarks = prev.includes(currentPage) ? prev.filter((p) => p !== currentPage) : [...prev, currentPage].sort((a, b) => a - b);
      saveProgress({ product_id: productId, progress_type: 'ebook', preferences: { bookmarks: newBookmarks } }).catch(() => {});
      return newBookmarks;
    });
  }, [currentPage, productId]);

  const handleDocumentLoadError = useCallback((err: any) => {
    console.error("Erro ao carregar PDF:", err);
    setError(t('ebookReader.corruptedError'));
  }, [t]);

  // ═══ Loading State ═══
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0078d4] mx-auto" />
          <p className="text-white text-sm font-medium">{t('ebookReader.loadingDocument')}</p>
        </div>
      </div>
    );
  }

  // ═══ Error State ═══
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center z-50 p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white/5 p-6 rounded-xl border border-white/10">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={load} className="w-full px-4 py-2.5 bg-[#0078d4] text-white rounded-lg font-semibold hover:bg-[#106ebe]">
            {t('ebookReader.retry')}
          </button>
        </div>
      </div>
    );
  }

  // ═══ Temas adaptativos ═══
  const effectiveTheme = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  const bgColor = effectiveTheme === 'light' ? '#e5e5e5' : '#1f1f1f';
  const toolbarBg = effectiveTheme === 'light' ? '#ffffff' : '#2d2d2d';
  const toolbarText = effectiveTheme === 'light' ? '#000000' : '#ffffff';
  const toolbarBorder = effectiveTheme === 'light' ? '#e0e0e0' : '#3f3f3f';
  const pageBg = effectiveTheme === 'light' ? '#ffffff' : '#2d2d2d';
  const pageTextColor = effectiveTheme === 'light' ? '#666666' : '#999999';

  return (
    <div className="fixed inset-0 flex flex-col z-[100] font-sans" style={{ backgroundColor: bgColor }}>
      <style>{`
        .page-wrapper {
          transition: width 0.2s ease-out, height 0.2s ease-out;
        }
        .page-scaler {
          transition: transform 0.2s ease-out;
        }
        .react-pdf__Document {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
      
      {/* ═══ Toolbar Superior Responsiva ═══ */}
      <div className="flex-shrink-0 border-b relative z-10" style={{ backgroundColor: toolbarBg, borderColor: toolbarBorder, minHeight: '52px' }}>
        <div className="h-full flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={onBack} className="p-2 md:p-2.5 rounded-lg hover:bg-black/10 transition-colors" title={t('ebookReader.back')} style={{ color: toolbarText }}>
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="hidden sm:block w-px h-6 bg-black/20 mx-1" />
            <div className="flex items-center bg-black/5 rounded-lg border" style={{ borderColor: toolbarBorder }}>
              <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} className="p-2 sm:p-2.5 rounded-l-lg hover:bg-black/10 disabled:opacity-30" style={{ color: toolbarText }}>
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center px-1">
                <input type="number" min={1} max={numPages} value={currentPage} onChange={(e) => { const val = parseInt(e.target.value); if (val >= 1 && val <= numPages) goToPage(val); }} className="w-10 sm:w-14 px-1 py-1 text-center text-sm sm:text-base font-medium bg-transparent focus:outline-none" style={{ color: toolbarText }} />
                <span className="text-xs sm:text-sm whitespace-nowrap pr-2 opacity-60" style={{ color: toolbarText }}>/ {numPages}</span>
              </div>
              <button disabled={currentPage >= numPages} onClick={() => goToPage(currentPage + 1)} className="p-2 sm:p-2.5 rounded-r-lg hover:bg-black/10 disabled:opacity-30" style={{ color: toolbarText }}>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1">
            <div className="flex items-center bg-black/5 rounded-lg border" style={{ borderColor: toolbarBorder }}>
              <button onClick={() => handleZoomChange(visualZoom - 0.1)} className="p-2 rounded-l-lg hover:bg-black/10 transition-colors" style={{ color: toolbarText }}>
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="text-xs sm:text-sm font-medium w-12 sm:w-14 text-center" style={{ color: toolbarText }}>
                {Math.round(visualZoom * 100)}%
              </span>
              <button onClick={() => handleZoomChange(visualZoom + 0.1)} className="p-2 rounded-r-lg hover:bg-black/10 transition-colors" style={{ color: toolbarText }}>
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="hidden md:block w-px h-6 bg-black/20 mx-1" />
            <div className="hidden md:flex items-center gap-1">
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-2.5 rounded-lg hover:bg-black/10" style={{ color: toolbarText }}><RotateCw className="w-5 h-5" /></button>
              <button onClick={toggleBookmark} className={`p-2.5 rounded-lg hover:bg-black/10 ${bookmarks.includes(currentPage) ? 'text-[#0078d4]' : ''}`} style={{ color: bookmarks.includes(currentPage) ? '#0078d4' : toolbarText }}><Bookmark className={`w-5 h-5 ${bookmarks.includes(currentPage) ? 'fill-current' : ''}`} /></button>
              <button className="p-2.5 rounded-lg hover:bg-black/10" style={{ color: toolbarText }}><Search className="w-5 h-5" /></button>
            </div>
            <div className="hidden sm:block w-px h-6 bg-black/20 mx-1" />
            <button 
              onClick={() => setShowMentor(!showMentor)} 
              className="p-2 sm:p-2.5 rounded-lg hover:bg-black/10 ml-1 transition-colors" 
              style={{ color: showMentor ? '#0078d4' : toolbarText }}
              title="Mentor de Leitura (IA)"
            >
              <Bot className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 sm:p-2.5 rounded-lg hover:bg-black/10 ml-1" style={{ color: toolbarText }}>
              <span className="hidden sm:inline-block"><Settings className="w-5 h-5" /></span>
              <span className="inline-block sm:hidden"><MoreVertical className="w-5 h-5" /></span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Área Principal com PDF e Mentor de Leitura ═══ */}
      <div className="flex-1 flex overflow-hidden relative">
        <ReaderErrorBoundary>
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-auto relative"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {url && (
              <div className="flex flex-col items-center py-0 sm:py-4 w-full" style={{ gap: '0px' }}>
                <Document
                  file={url}
                  onLoadSuccess={(pdf) => {
                    setNumPages(pdf.numPages);
                    // Load first page's aspect ratio asynchronously right away
                    pdf.getPage(1).then((page: any) => {
                      const w = page.originalWidth || page.width || (page.getViewport ? page.getViewport({ scale: 1 }).width : 800);
                      const h = page.originalHeight || page.height || (page.getViewport ? page.getViewport({ scale: 1 }).height : 1131);
                      const ratio = h / w;
                      if (!isNaN(ratio) && ratio > 0 && isFinite(ratio)) {
                        setAspectRatio(ratio);
                        setPageRatios(prev => ({ ...prev, 1: ratio }));
                      }
                    }).catch((err) => {
                      console.error("Error fetching page 1 aspect ratio on document load:", err);
                    });
                  }}
                  onLoadError={handleDocumentLoadError}
                  loading={<div className="p-20 text-white font-medium flex items-center gap-3"><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>{t('ebookReader.loadingDocumentProgress')}</div>}
                  error={<div className="p-20 text-red-400 font-medium text-center bg-black/50 rounded-xl my-10">{t('ebookReader.connectionError')}</div>}
                  options={pdfOptions}
                >
                  {Array.from(new Array(numPages), (_, index) => {
                    const pageNum = index + 1;
                    const isVisible = visiblePages.has(pageNum);
                    
                    const currentRatio = pageRatios[pageNum] || aspectRatio;
                    const safeRatio = isNaN(currentRatio) || currentRatio <= 0 || !isFinite(currentRatio) ? 1.4142 : currentRatio;
                    const wrapperWidth = pageWidth * visualZoom;
                    const wrapperHeight = pageWidth * visualZoom * safeRatio;
                    
                    const MAX_CANVAS_WIDTH = 1500;
                    const dpr = Math.min(window.devicePixelRatio || 1, 2);
                    
                    let safeScale = staticRenderScale;
                    const physicalPixels = pageWidth * staticRenderScale * dpr;
                    
                    if (physicalPixels > MAX_CANVAS_WIDTH) {
                      safeScale = MAX_CANVAS_WIDTH / (pageWidth * dpr);
                    }
                    
                    const transformScale = visualZoom / safeScale;

                    return (
                      <div
                        key={`page_wrap_${pageNum}`}
                        data-page={pageNum}
                        className="page-wrapper shadow-lg border-b border-white/5 flex items-center justify-center relative overflow-hidden"
                        style={{
                          width: `${wrapperWidth}px`,
                          height: `${wrapperHeight}px`,
                          marginBottom: `${pageGap}px`,
                          backgroundColor: pageBg,
                        }}
                      >
                        {isVisible ? (
                          <div 
                            className="page-scaler flex items-center justify-center"
                            style={{
                              transform: `scale(${transformScale}) rotate(${rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <Page
                              pageNumber={pageNum}
                              width={pageWidth}
                              scale={safeScale} 
                              renderTextLayer={renderQuality !== 'performance'}
                              renderAnnotationLayer={renderQuality !== 'performance'}
                              devicePixelRatio={dpr}
                              onLoadSuccess={(page: any) => {
                                try {
                                  const w = page.originalWidth || page.width || (page.getViewport ? page.getViewport({ scale: 1 }).width : 800);
                                  const h = page.originalHeight || page.height || (page.getViewport ? page.getViewport({ scale: 1 }).height : 1131);
                                  const ratio = h / w;
                                  if (!isNaN(ratio) && ratio > 0 && isFinite(ratio)) {
                                    setPageRatios(prev => {
                                      if (prev[pageNum] === ratio) return prev;
                                      return { ...prev, [pageNum]: ratio };
                                    });
                                    if (pageNum === 1) {
                                      setAspectRatio(ratio);
                                    }
                                  }
                                } catch (e) {
                                  console.error("Error setting aspect ratio for page " + pageNum, e);
                                }
                              }}
                              loading={null}
                              error={
                                <div className="w-full h-full flex items-center justify-center text-red-500 font-bold bg-red-50">
                                  {t('ebookReader.errorBadge')}
                                </div>
                              }
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center font-bold opacity-30 text-xl sm:text-2xl"
                            style={{ color: pageTextColor }}
                          >
                            {t('ebookReader.page', { page: pageNum })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Document>
              </div>
            )}
          </div>
        </ReaderErrorBoundary>

        {showMentor && (
          <div className="w-80 md:w-96 flex-shrink-0 h-full border-l border-white/10 hidden md:block">
            <ReadingMentorPanel productId={productId} productTitle={title || 'Ebook'} agentType="ebook_mentor" />
          </div>
        )}
      </div>

      {/* ═══ Painel de Configurações (Bottom Sheet mobile / Modal desktop) ═══ */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[200]" onClick={() => setShowSettings(false)}>
          <div className="rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: toolbarBg, border: `1px solid ${toolbarBorder}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: toolbarBorder }}>
              <h2 className="text-lg font-bold" style={{ color: toolbarText }}>{t('ebookReader.menuTitle')}</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-black/10 bg-black/5" style={{ color: toolbarText }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 sm:pb-6 space-y-8">
              {/* Ferramentas extras (mobile) */}
              <div className="block md:hidden">
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: toolbarText }}>{t('ebookReader.extraTools')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-3 rounded-xl border flex flex-col items-center gap-2 hover:bg-black/5" style={{ borderColor: toolbarBorder, color: toolbarText }}><RotateCw className="w-5 h-5" /><span className="text-xs font-medium">{t('ebookReader.rotate')}</span></button>
                  <button onClick={toggleBookmark} className={`p-3 rounded-xl border flex flex-col items-center gap-2 hover:bg-black/5 ${bookmarks.includes(currentPage) ? 'text-[#0078d4] border-[#0078d4]/30' : ''}`} style={{ borderColor: toolbarBorder, color: bookmarks.includes(currentPage) ? '#0078d4' : toolbarText }}><Bookmark className={`w-5 h-5 ${bookmarks.includes(currentPage) ? 'fill-current' : ''}`} /><span className="text-xs font-medium">{t('ebookReader.bookmark')}</span></button>
                </div>
              </div>
              {/* Aparência */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: toolbarText }}>{t('ebookReader.appearance')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as Theme[]).map((themeItem) => (
                    <button key={themeItem} onClick={() => setTheme(themeItem)} className={`p-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-2 border ${theme === themeItem ? 'bg-[#0078d4] text-white border-transparent' : 'hover:bg-black/5'}`} style={{ color: theme === themeItem ? '#ffffff' : toolbarText, borderColor: theme === themeItem ? 'transparent' : toolbarBorder }}>
                      {themeItem === 'light' && <Sun className="w-5 h-5" />}{themeItem === 'dark' && <Moon className="w-5 h-5" />}{themeItem === 'auto' && <Settings className="w-5 h-5" />}
                      <span className="capitalize">{themeItem === 'auto' ? t('ebookReader.auto') : themeItem === 'light' ? t('ebookReader.light') : t('ebookReader.dark')}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Modo de Ajuste */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: toolbarText }}>{t('ebookReader.adjustMode')}</label>
                <div className="space-y-2">
                  {(['fit-width', 'fit-page', 'actual-size'] as ViewMode[]).map((mode) => (
                    <button key={mode} onClick={() => { setViewMode(mode); if(mode === 'fit-width') handleZoomChange(1.0); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${viewMode === mode ? 'bg-[#0078d4] text-white border-transparent' : 'hover:bg-black/5'}`} style={{ color: viewMode === mode ? '#ffffff' : toolbarText, borderColor: viewMode === mode ? 'transparent' : toolbarBorder }}>
                      {mode === 'fit-width' && t('ebookReader.fitWidth')}{mode === 'fit-page' && t('ebookReader.fitPage')}{mode === 'actual-size' && t('ebookReader.actualSize')}
                    </button>
                  ))}
                </div>
              </div>
              {/* Qualidade Visual */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: toolbarText }}>{t('ebookReader.visualQuality')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['performance', 'auto', 'high-quality'] as RenderQuality[]).map((quality) => (
                    <button key={quality} onClick={() => setRenderQuality(quality)} className={`p-3 rounded-xl text-xs text-center font-medium transition-all border ${renderQuality === quality ? 'bg-[#0078d4] text-white border-transparent' : 'hover:bg-black/5'}`} style={{ color: renderQuality === quality ? '#ffffff' : toolbarText, borderColor: renderQuality === quality ? 'transparent' : toolbarBorder }}>
                      {quality === 'performance' && t('ebookReader.qualityPerformance')}{quality === 'auto' && t('ebookReader.qualityDefault')}{quality === 'high-quality' && t('ebookReader.qualityHigh')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
