// Este componente foi substituído pela versão Edge
// Importando a versão melhorada com estilo Microsoft Edge
export { EbookReaderEdge as EbookReader } from './EbookReaderEdge';

// Versão legada mantida para compatibilidade
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getEbookReadUrl, saveProgress, getProductProgress } from '../../lib/learning-api';
import { useLocale } from '../../contexts/LocaleContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookReaderLegacyProps {
  productId: string;
  onBack: () => void;
}

export function EbookReaderLegacy({ productId, onBack }: EbookReaderLegacyProps) {
  const { locale } = useLocale();
  const [url, setUrl] = useState<string | null>(null);
  const [format, setFormat] = useState('pdf');
  const [title, setTitle] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

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
      const savedPage = prog?.progress?.find((p: { lesson_id: null; page_number?: number }) => !p.lesson_id)?.page_number;
      if (savedPage && savedPage > 1) setPage(savedPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [productId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!numPages || format !== 'pdf') return;
    const pct = (page / numPages) * 100;
    saveProgress({
      product_id: productId,
      progress_type: 'ebook',
      page_number: page,
      position_percent: pct,
      status: pct >= 95 ? 'completed' : 'in_progress',
    });
  }, [page, numPages, productId, format]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (format === 'epub') {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        <p className="text-on-surface-variant text-sm">
          EPUB: abra pelo leitor abaixo ou use download se o formato não carregar no browser.
        </p>
        {url && (
          <iframe src={url} title={title} className="w-full h-[80vh] rounded-xl border border-white/10 bg-white" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="font-display text-2xl font-bold text-white">{title}</h1>

      <div className="flex items-center justify-between gap-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="p-2 rounded-lg border border-white/10 disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-sm text-on-surface-variant">
          Página {page} {numPages ? `de ${numPages}` : ''}
        </span>
        <button
          disabled={page >= numPages}
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          className="p-2 rounded-lg border border-white/10 disabled:opacity-40"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {url && (
        <div className="flex justify-center overflow-auto rounded-xl border border-white/10 bg-surface-container p-4 max-h-[75vh]">
          <Document file={url} onLoadSuccess={({ numPages: n }) => setNumPages(n)} loading={<div className="p-8">Carregando PDF...</div>}>
            <Page pageNumber={page} width={Math.min(800, window.innerWidth - 48)} />
          </Document>
        </div>
      )}
    </div>
  );
}
