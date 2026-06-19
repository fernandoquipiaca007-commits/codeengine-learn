import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeft, Edit2, ShieldAlert, CheckCircle, Clock, FileText, ExternalLink } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle size={12} /> Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            <ShieldAlert size={12} /> Rejeitado
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
            <Clock size={12} /> Em Análise
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 uppercase">Ativo</span>;
    }
    return <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-800 uppercase">Rascunho</span>;
  };

  const handleEdit = (id: string) => {
    setSelectedProductId(id);
    setIsFormOpen(true);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('colaborador')}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Meus Produtos</h1>
            <p className="mt-1 text-gray-500">Adicione e gerencie os ebooks e cursos que publica na Codeengine.</p>
          </div>
        </div>

        <button
          onClick={handleNewProduct}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all text-sm self-start sm:self-center"
        >
          <Plus size={18} />
          Adicionar Produto
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-gray-150 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <FileText size={24} />
          </div>
          <h3 className="mb-1 text-lg font-bold text-gray-900 font-display">Nenhum produto publicado</h3>
          <p className="mb-6 text-sm text-gray-500 max-w-sm mx-auto">
            Você ainda não publicou nenhum produto digital. Comece cadastrando seu primeiro e-book.
          </p>
          <button
            onClick={handleNewProduct}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-hover transition-all text-sm"
          >
            <Plus size={18} /> Cadastrar Meu Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Licença</th>
                  <th className="px-6 py-4">Moderação</th>
                  <th className="px-6 py-4">Status da Loja</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="text-gray-700 hover:bg-gray-50/30 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 rounded-lg overflow-hidden border border-gray-100">
                          <img src={prod.cover_url} alt={prod.title} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 line-clamp-1">{prod.title}</span>
                          <span className="text-xs text-gray-400">ID: {prod.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {formatPrice(prod)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
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
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        {prod.approval_status === 'approved' && prod.status === 'active' && (
                          <a
                            href={`/?screen=product&id=${prod.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all"
                          >
                            Ver Loja <ExternalLink size={12} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl rounded-2xl bg-white shadow-xl my-8"
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
