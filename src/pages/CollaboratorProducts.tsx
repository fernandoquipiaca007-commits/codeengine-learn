import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeft, Edit2, ShieldAlert, CheckCircle, Clock, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { CollaboratorProductForm } from './CollaboratorProductForm';

interface CollaboratorProductsProps {
  setScreen: (screen: string) => void;
  collaboratorProfile?: {
    id: string;
    displayName: string;
    plan: 'ebook_creator' | 'course_creator';
    payoutMethod: 'paypal' | 'iban';
  } | null;
}

export function CollaboratorProducts({ setScreen, collaboratorProfile }: CollaboratorProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(collaboratorProfile || null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      if (!profile) {
        const dashboardRes = await fetch(`${BACKEND_URL}/api/collaborators/dashboard`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success) {
          setProfile(dashboardData.profile);
        } else {
          setError(dashboardData.error || 'Erro ao carregar dados do colaborador.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/collaborators/products`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Erro ao carregar produtos.');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Erro de conexão ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (prod: any) => {
    if (prod.aoa_price && Number(prod.aoa_price) > 0) {
      return Number(prod.aoa_price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    }
    return Number(prod.price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400 border border-green-500/20">
            <CheckCircle size={12} /> Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <ShieldAlert size={12} /> Rejeitado
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
            <Clock size={12} /> Em Análise
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase">Ativo</span>;
    }
    return <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant uppercase">Rascunho</span>;
  };

  const handleEdit = (id: string) => {
    setSelectedProductId(id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        void loadProducts();
      } else {
        alert(data.error || 'Erro ao tentar apagar o produto.');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erro de conexão ao tentar apagar o produto.');
    }
  };

  const handleNewProduct = () => {
    setSelectedProductId(null);
    setIsFormOpen(true);
  };

  const handleFormSaveSuccess = () => {
    setIsFormOpen(false);
    setSelectedProductId(null);
    void loadProducts();
  };

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen page-wrapper">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen('colaborador')}
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-on-surface hover:bg-white/10 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant leading-[1.1] tracking-[-0.04em]">
              Meus Produtos
            </h1>
            <p className="mt-2 text-on-surface-variant font-sans text-sm sm:text-base">
              Adicione e gerencie os ebooks e cursos que publica na Codeengine.
            </p>
          </div>
        </div>

        <button
          onClick={handleNewProduct}
          className="flex items-center gap-2 rounded-full bg-on-surface px-5 py-2.5 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] self-start sm:self-center font-display uppercase tracking-widest text-xs"
        >
          <Plus size={18} />
          Adicionar Produto
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300 flex items-center gap-2 font-sans">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-on-surface-variant">
            <FileText size={24} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white font-display">Nenhum produto publicado</h3>
          <p className="mb-6 text-sm text-on-surface-variant max-w-sm mx-auto font-sans">
            Você ainda não publicou nenhum produto digital. Comece cadastrando seu primeiro e-book.
          </p>
          <button
            onClick={handleNewProduct}
            className="inline-flex items-center gap-2 rounded-full bg-on-surface px-6 py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm font-display uppercase tracking-widest text-xs"
          >
            <Plus size={18} /> Cadastrar Meu Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-2xl glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Licença</th>
                  <th className="px-6 py-4">Moderação</th>
                  <th className="px-6 py-4">Status da Loja</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((prod) => (
                  <tr key={prod.id} className="text-on-surface hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 rounded-lg overflow-hidden border border-white/10">
                          <img src={prod.cover_url} alt={prod.title} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <span className="font-semibold text-white line-clamp-1">{prod.title}</span>
                          <span className="text-xs text-on-surface-variant font-mono">ID: {prod.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white font-mono">
                      {formatPrice(prod)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium font-sans">
                      {prod.licensing_info?.type === 'commercial' ? 'Comercial' : 'Pessoal'}
                      {prod.licensing_info?.lifetime ? ' (Vitalício)' : ` (${prod.licensing_info?.duration_days} dias)`}
                    </td>
                    <td className="px-6 py-4">
                      {getApprovalBadge(prod.approval_status)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(prod.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(prod.id)}
                          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <Edit2 size={13} className="text-primary" /> Editar
                        </button>
                        
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} /> Excluir
                        </button>
                        
                        {prod.approval_status === 'approved' && prod.status === 'active' && (
                          <a
                            href={`/?screen=product&id=${prod.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 transition-all cursor-pointer"
                          >
                            Ver Loja <ExternalLink size={12} className="text-primary" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-[1300px] my-4 bg-transparent"
            >
              <CollaboratorProductForm
                productId={selectedProductId}
                collaboratorPlan={profile?.plan || 'ebook_creator'}
                onClose={() => setIsFormOpen(false)}
                onSaveSuccess={handleFormSaveSuccess}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
