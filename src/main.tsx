import {StrictMode, Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { LocaleProvider } from './contexts/LocaleContext';

// Google Translate / Browser Translator DOM Crash Prevention Patch
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

// NOTE: The controllerchange → reload pattern was REMOVED.
// It caused the page to auto-reload every ~15s after first SW activation.
// Updates are now user-initiated via UpdatePrompt component.

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
            <h1 className="font-display text-2xl font-bold text-white mb-4">Atualização Disponível</h1>
            <p className="font-sans text-sm text-on-surface-variant mb-6">
              Houve uma alteração nos arquivos do aplicativo. Por favor, clique abaixo para recarregar e carregar a versão mais recente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-full bg-[#6366f1] text-white font-display text-sm font-semibold hover:scale-95 transition-transform shadow-lg shadow-indigo-500/20"
            >
              Recarregar Aplicativo
            </button>
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
        <App />
      </LocaleProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
