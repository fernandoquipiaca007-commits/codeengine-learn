import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeft, Edit2, ShieldAlert, CheckCircle, FileText, ExternalLink, Trash2, Copy } from 'lucide-react';
import { CollaboratorProductForm } from './CollaboratorProductForm';
import { ProductTypePicker } from '../components/collaborator/ProductTypePicker';
import { ProductFormType } from '../lib/categoryDetect';
import { useTranslation } from 'react-i18next';

interface CollaboratorProductsProps {
  setScreen: (screen: string) => void;
  collaboratorProfile?: {
    id: string;
    displayName: string;
    plan: 'ebook_creator' | 'course_creator';
    payoutMethod: 'paypal' | 'iban';
  } | null;
  setIsImmersive?: (v: boolean) => void;
}

interface PickerCategory {
  id: string;
  name: string;
}

export function CollaboratorProducts({ setScreen, collaboratorProfile, setIsImmersive }: CollaboratorProductsProps) {
  const { t } = useTranslation('pages');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(collaboratorProfile || null);

  const [step, setStep] = useState<'list' | 'picker' | 'form'>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [pickerCategories, setPickerCategories] = useState<PickerCategory[]>([]);
  const [presetCategoryId, setPresetCategoryId] = useState<string | null>(null);
  const [presetFormType, setPresetFormType] = useState<ProductFormType | null>(null);

  useEffect(() => {
    loadProducts();
    loadPickerCategories();
    return () => { setIsImmersive?.(false); };
  }, [setIsImmersive]);

  async function loadPickerCategories() {
    try {
      const { data } = await supabase.from('categories').select('id, name').order('display_order', { ascending: true });
      if (data) setPickerCategories(data);
    } catch (e) { /* non-critical */ }
  }

  async function loadProducts() {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setScreen('auth'); return; }
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
      if (!profile) {
        const dr = await fetch(`${BACKEND_URL}/api/collaborators/dashboard`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        const dd = await dr.json();
        if (dd.success) { setProfile(dd.profile); } else { setError(dd.error || 'Erro ao carregar dados.'); setLoading(false); return; }
      }
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (data.success) { setProducts(data.products || []); } else { setError(data.error || 'Erro ao carregar produtos.'); }
    } catch (err) { setError('Erro de conexao.'); } finally { setLoading(false); }
  }

  const formatPrice = (prod: any) => {
    if (prod.aoa_price && Number(prod.aoa_price) > 0) return Number(prod.aoa_price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    return Number(prod.price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getApprovalBadge = (status: string) => {
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20"><ShieldAlert size={12} /> {t('collaborator.products.statusDisabled', 'Desativado')}</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400 border border-green-500/20"><CheckCircle size={12} /> {t('collaborator.products.statusActive', 'Publicado')}</span>;
  };

  const getStatusBadge = (prod: any) => {
    if (prod.status === 'active') return <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase">{t('collaborator.products.statusActive', 'Publicado')}</span>;
    if (prod.status === 'draft' && prod.scheduled_publish_at) {
      const d = new Date(prod.scheduled_publish_at);
      return <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">{t('collaborator.products.statusScheduled', 'Agendado')}: {String(d.getDate()).padStart(2,'0')}/{String(d.getMonth()+1).padStart(2,'0')}</span>;
    }
    return <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant uppercase">{t('collaborator.products.statusDraft', 'Rascunho')}</span>;
  };

  const handleEdit = (id: string) => { setSelectedProductId(id); setPresetCategoryId(null); setPresetFormType(null); setStep('form'); setIsImmersive?.(true); };

  const handleDelete = async (id: string) => {
    if (!confirm(t('collaborator.products.confirmDelete', 'Deseja realmente excluir este produto?'))) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setScreen('auth'); return; }
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (data.success) { alert(data.message); void loadProducts(); } else { alert(data.error || t('collaborator.products.deleteError', 'Erro ao apagar.')); }
    } catch (err) { alert(t('collaborator.products.connectionError', 'Erro de conexao.')); }
  };

  const handleNewProduct = () => { setSelectedProductId(null); setPresetCategoryId(null); setPresetFormType(null); setStep('picker'); setIsImmersive?.(true); };

  const handlePickerSelect = (categoryId: string, formType: ProductFormType) => { setPresetCategoryId(categoryId || null); setPresetFormType(formType); setStep('form'); };

  const handleFormClose = () => { setStep('list'); setSelectedProductId(null); setPresetCategoryId(null); setPresetFormType(null); setIsImmersive?.(false); };

  const handleFormSaveSuccess = () => { setStep('list'); setSelectedProductId(null); setPresetCategoryId(null); setPresetFormType(null); setIsImmersive?.(false); void loadProducts(); };

  const handleCopyLink = (title: string) => {
    const slug = title.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,'-').replace(/&/g,'-and-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-');
    navigator.clipboard.writeText(`${window.location.origin}/product/${slug}`).then(() => alert(t('collaborator.products.linkCopied', 'Link copiado!'))).catch(console.error);
  };

  return (
    <div className="collab-compact-wrapper">
    <div className="pt-20 pb-16 px-4 md:px-8 w-full min-h-screen page-wrapper">
      <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('colaborador')} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-on-surface hover:bg-white/10 hover:text-white transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant leading-[1.1] tracking-[-0.04em]">{t('collaborator.products.title', 'Meus Produtos')}</h1>
            <p className="mt-2 text-on-surface-variant font-sans text-sm sm:text-base">{t('collaborator.products.subtitle', 'Adicione e gerencie os ebooks e cursos que publica na Codeengine.')}</p>
          </div>
        </div>
        <button onClick={handleNewProduct} className="flex items-center gap-2 rounded-full bg-on-surface px-5 py-2.5 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] self-start sm:self-center font-display uppercase tracking-widest text-xs">
          <Plus size={18} /> {t('collaborator.products.addProduct', 'Adicionar Produto')}
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300 flex items-center gap-2 font-sans"><ShieldAlert size={16} /><span>{error}</span></div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>
      ) : products.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-on-surface-variant"><FileText size={24} /></div>
          <h3 className="mb-2 text-lg font-bold text-white font-display">{t('collaborator.products.noProductsTitle', 'Nenhum produto publicado')}</h3>
          <p className="mb-6 text-sm text-on-surface-variant max-w-sm mx-auto font-sans">{t('collaborator.products.noProductsDesc', 'Você ainda não publicou nenhum produto. Comece agora.')}</p>
          <button onClick={handleNewProduct} className="inline-flex items-center gap-2 rounded-full bg-on-surface px-6 py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm font-display uppercase tracking-widest text-xs">
            <Plus size={18} /> {t('collaborator.products.createFirstProduct', 'Cadastrar Meu Primeiro Produto')}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-2xl glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4">{t('collaborator.products.tableHeaderProduct', 'Produto')}</th>
                  <th className="px-6 py-4">{t('collaborator.products.tableHeaderPrice', 'Preço')}</th>
                  <th className="px-6 py-4">{t('collaborator.products.tableHeaderLicense', 'Licença')}</th>
                  <th className="px-6 py-4">{t('collaborator.products.tableHeaderModeration', 'Moderação')}</th>
                  <th className="px-6 py-4">{t('collaborator.products.tableHeaderStatus', 'Status')}</th>
                  <th className="px-6 py-4 text-right">{t('collaborator.products.tableHeaderActions', 'Ações')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((prod) => (
                  <tr key={prod.id} className="text-on-surface hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 rounded-lg overflow-hidden border border-white/10">
                          <img src={prod.cover_url} alt={prod.title} className="h-full w-full object-contain" />
                        </div>
                        <div>
                          <span className="font-semibold text-white line-clamp-1">{prod.title}</span>
                          <span className="text-xs text-on-surface-variant font-mono">ID: {prod.id.substring(0,8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white font-mono whitespace-nowrap">{formatPrice(prod)}</td>
                    <td className="px-6 py-4 text-xs font-medium font-sans whitespace-nowrap">{prod.licensing_info?.type === 'commercial' ? t('collaborator.products.licenseCommercial', 'Comercial') : t('collaborator.products.licensePersonal', 'Pessoal')}{prod.licensing_info?.lifetime ? ` (${t('collaborator.products.licenseLifetime', 'Vitalício')})` : ` (${prod.licensing_info?.duration_days} ${t('collaborator.products.licenseDays', 'dias')})`}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getApprovalBadge(prod.approval_status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(prod)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(prod.id)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"><Edit2 size={13} className="text-primary" /> {t('collaborator.products.actionEdit', 'Editar')}</button>
                        <button onClick={() => handleDelete(prod.id)} className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer whitespace-nowrap"><Trash2 size={13} /> {t('collaborator.products.actionDelete', 'Excluir')}</button>
                        <button onClick={() => handleCopyLink(prod.title)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"><Copy size={13} className="text-yellow-400" /> {t('collaborator.products.actionCopyLink', 'Copiar Link')}</button>
                        {prod.approval_status === 'approved' && prod.status === 'active' ? (
                          <a href={`/product/${prod.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">{t('collaborator.products.actionViewStore', 'Ver Loja')} <ExternalLink size={12} className="text-primary" /></a>
                        ) : (
                          <a href={`/product/${prod.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}?preview=true`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-all cursor-pointer animate-pulse whitespace-nowrap">{t('collaborator.products.actionViewPreview', 'Ver Preview')} <ExternalLink size={12} /></a>
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

      <AnimatePresence>
        {step === 'picker' && (
          <ProductTypePicker
            categories={pickerCategories}
            onSelect={handlePickerSelect}
            onClose={handleFormClose}
          />
        )}
        {step === 'form' && (
          <div className="fixed inset-0 z-40 bg-[#050505] flex flex-col">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="w-full h-full flex flex-col flex-grow bg-transparent">
              <CollaboratorProductForm
                productId={selectedProductId}
                collaboratorPlan={profile?.plan || 'ebook_creator'}
                presetCategoryId={presetCategoryId}
                presetFormType={presetFormType}
                onClose={handleFormClose}
                onSaveSuccess={handleFormSaveSuccess}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
