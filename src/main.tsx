import {StrictMode, Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { LocaleProvider } from './contexts/LocaleContext';
import { UserCountryProvider } from './contexts/UserCountryContext';

// Google Translate / Browser Translator DOM Crash Prevention Patch
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };
}

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; isChunkError: boolean }> {
  state = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: any) {
    const isChunkError = 
      /failed to fetch dynamically imported module/i.test(error?.message || '') ||
      /chunk load failed/i.test(error?.message || '') ||
      /error loading dynamically imported module/i.test(error?.message || '');
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: any) {
    console.error('[RootErrorBoundary] caught fatal error:', error);
    const isChunkError = 
      /failed to fetch dynamically imported module/i.test(error?.message || '') ||
      /chunk load failed/i.test(error?.message || '') ||
      /error loading dynamically imported module/i.test(error?.message || '');
      
    if (isChunkError) {
      console.warn('[RootErrorBoundary] Chunk load error detected. Reloading page to update app assets...');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0e] px-6 text-center text-on-surface">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6366f1]"></div>
              <p className="font-sans text-sm text-on-surface-variant">Carregando nova versão...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0e] px-6 text-center text-on-surface">
          <div className="glass-panel max-w-md p-8 rounded-2xl border border-white/10 shadow-xl bg-surface-container-low/30 backdrop-blur-xl">
            <h1 className="font-display text-2xl font-bold text-white mb-4">Ops! Algo correu mal</h1>
            <p className="font-sans text-sm text-on-surface-variant mb-6">
              Ocorreu um erro inesperado ao carregar esta página.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2.5 rounded-full bg-white/10 text-white font-display text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => {
                  try {
                     sessionStorage.removeItem('ce_last_screen');
                  } catch {}
                  window.location.href = '/';
                }}
                className="w-full px-6 py-2.5 rounded-full bg-[#6366f1] text-white font-display text-sm font-semibold hover:scale-95 transition-transform shadow-lg shadow-indigo-500/20"
              >
                Voltar para o Início
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <LocaleProvider>
        <UserCountryProvider>
          <App />
        </UserCountryProvider>
      </LocaleProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
