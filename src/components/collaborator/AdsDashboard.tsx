import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLocale } from '../../contexts/LocaleContext';
import { useUserCountry } from '../../contexts/UserCountryContext';
import { 
  Sparkles, 
  Megaphone, 
  TrendingUp, 
  Layers, 
  MousePointerClick, 
  Eye, 
  DollarSign, 
  Clock, 
  Check, 
  AlertCircle, 
  Play, 
  Pause,
  Plus,
  X,
  Target
} from 'lucide-react';

interface AdsDashboardProps {
  collaboratorId: string;
}

export default function AdsDashboard({ collaboratorId }: AdsDashboardProps) {
  const { locale } = useLocale();
  const { isAngola } = useUserCountry();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Campaign Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [placement, setPlacement] = useState('hero_banner');
  const [durationDays, setDurationDays] = useState(7);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Analytics Modal States
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Localized texts
  const isPt = locale === 'pt';
  const t = (pt: string, en: string) => (isPt ? pt : en);

  const interestOptions = [
    "Inteligência Artificial", "Programação", "Automação", "Marketing",
    "Negócios", "Empreendedorismo", "Fitness", "Saúde", "Finanças",
    "Produtividade", "Design", "Educação", "Crypto", "Trading", "SaaS"
  ];

  useEffect(() => {
    loadData();
  }, [collaboratorId]);

  // Recalculate price dynamically when placement or duration changes
  useEffect(() => {
    if (showCreateModal) {
      void getCalculatedPrice();
    }
  }, [placement, durationDays, showCreateModal]);

  async function loadData() {
    setLoading(true);
    try {
      const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);

      // Fetch campaigns
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/campaigns`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }

      // Fetch collaborator's active products
      const { data: collabProducts } = await supabase
        .from('products')
        .select('id, title, cover_url')
        .eq('collaborator_id', collaboratorId)
        .eq('status', 'active');
      
      setProducts(collabProducts || []);
      if (collabProducts && collabProducts.length > 0) {
        setSelectedProduct(collabProducts[0].id);
      }
    } catch (err) {
      console.error('Error loading ads dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function getCalculatedPrice() {
    setCalculatingPrice(true);
    try {
      const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/calculate-price?placement=${placement}&duration_days=${durationDays}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setCalculatedPrice(data.price);
      }
    } catch (err) {
      console.error('Error calculating price:', err);
    } finally {
      setCalculatingPrice(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          productId: selectedProduct || null,
          placement,
          durationDays,
          targetInterests: placement === 'notification' ? targetInterests : []
        })
      });

      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Erro ao iniciar checkout.');
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert('Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleCampaign(campaignId: string) {
    try {
      const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/campaigns/${campaignId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: data.status } : c));
      }
    } catch (err) {
      console.error('Error toggling campaign status:', err);
    }
  }

  async function handleOpenAnalytics(campaign: any) {
    setSelectedCampaign(campaign);
    setShowAnalyticsModal(true);
    setLoadingAnalytics(true);
    try {
      const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/campaigns/${campaign.id}/analytics`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (err) {
      console.error('Error loading campaign analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  function toggleInterest(interest: string) {
    setTargetInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  }

  // Summary Metrics Helper
  const getAggregatedMetrics = (cList: any[]) => {
    let spend = 0;
    let revenue = 0;
    
    return { spend, revenue };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-white/60 text-xs">{t('A carregar painel de anúncios...', 'Loading ads dashboard...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/3 border border-white/5 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            CodeEngine Ads Platform
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {t('Promova seus produtos em placements premium e impulsione suas vendas.', 'Promote your products in premium placements and boost your sales.')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-black hover:bg-primary-high transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('Criar Anúncio', 'Create Ad')}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">{t('Campanhas Ativas', 'Active Campaigns')}</span>
          <div className="text-2xl font-black font-display text-white mt-2">
            {campaigns.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">{t('Total Investido (Ads)', 'Total Ad Spend')}</span>
          <div className="text-2xl font-black font-display text-white mt-2">
            $ {campaigns.filter(c => ['active', 'paused', 'completed'].includes(c.status)).reduce((acc, c) => acc + parseFloat(c.total_budget), 0).toFixed(2)}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">{t('Conversões Totais', 'Total Conversions')}</span>
          <div className="text-2xl font-black font-display text-primary mt-2">
            {campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0)}
          </div>
        </div>
      </div>

      {/* Campaigns list */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('Minhas Campanhas', 'My Campaigns')}</h3>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-xs text-white/50">{t('Nenhuma campanha de anúncio criada ainda.', 'No ad campaigns created yet.')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] font-medium text-white transition-all"
            >
              {t('Começar agora', 'Get started now')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/3 text-white/50 font-semibold border-b border-white/10">
                  <th className="p-4">{t('Produto / Campanha', 'Product / Campaign')}</th>
                  <th className="p-4">{t('Placement', 'Placement')}</th>
                  <th className="p-4">{t('Orçamento', 'Budget')}</th>
                  <th className="p-4">{t('Duração', 'Duration')}</th>
                  <th className="p-4">{t('Status', 'Status')}</th>
                  <th className="p-4 text-right">{t('Ações', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {campaigns.map((camp) => {
                  const prod = camp.product;
                  return (
                    <tr key={camp.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        {prod ? (
                          <>
                            <img
                              src={prod.cover_url}
                              alt={prod.title}
                              className="w-10 h-10 rounded object-cover bg-black/40"
                            />
                            <div>
                              <div className="font-bold text-white truncate max-w-[150px]">{prod.title}</div>
                              <div className="text-[10px] text-white/40">{t('Criada em: ', 'Created: ')}{new Date(camp.created_at).toLocaleDateString()}</div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <div className="font-bold text-white">{t('Campanha Customizada', 'Custom Campaign')}</div>
                            <div className="text-[10px] text-white/40">{new Date(camp.created_at).toLocaleDateString()}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 uppercase font-mono text-[10px] text-primary">
                        {camp.placement.replace('_', ' ')}
                      </td>
                      <td className="p-4 font-mono font-semibold text-white">
                        $ {parseFloat(camp.total_budget).toFixed(2)}
                      </td>
                      <td className="p-4 text-white/70">
                        {camp.duration_days} {t('dias', 'days')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          camp.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          camp.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          camp.status === 'pending_payment' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          camp.status === 'paused' ? 'bg-white/10 text-white/70 border border-white/10' :
                          camp.status === 'completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {camp.status}
                        </span>
                        {camp.status === 'rejected' && camp.rejection_reason && (
                          <div className="text-[9px] text-red-400 mt-1 max-w-[180px]">{camp.rejection_reason}</div>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {camp.status === 'pending_payment' && camp.stripe_session_id && (
                          <button
                            onClick={() => {
                              // Re-trigger Stripe session payment
                              const sessionStr = localStorage.getItem('sb-ffdqqiunkzhtgbgaojay-auth-token');
                              if (!sessionStr) return;
                              const session = JSON.parse(sessionStr);
                              fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app'}/api/ads/campaigns`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({
                                  productId: camp.product_id,
                                  placement: camp.placement,
                                  durationDays: camp.duration_days,
                                  targetInterests: camp.target_interests
                                })
                              })
                              .then(r => r.json())
                              .then(d => { if (d.checkoutUrl) window.location.href = d.checkoutUrl; })
                              .catch(() => {});
                            }}
                            className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-[10px] font-bold text-black hover:bg-primary-high transition-colors"
                          >
                            {t('Pagar', 'Pay')}
                          </button>
                        )}

                        {['active', 'paused'].includes(camp.status) && (
                          <button
                            onClick={() => handleToggleCampaign(camp.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                            title={camp.status === 'active' ? t('Pausar', 'Pause') : t('Ativar', 'Resume')}
                          >
                            {camp.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {['active', 'paused', 'completed'].includes(camp.status) && (
                          <button
                            onClick={() => handleOpenAnalytics(camp)}
                            className="inline-flex h-7 items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-white px-2.5 transition-colors"
                          >
                            <TrendingUp className="w-3.5 h-3.5 mr-1 text-primary" />
                            {t('Desempenho', 'Metrics')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          
          <div className="relative glass-panel rounded-2xl border border-white/15 bg-[#101015] w-full max-w-lg overflow-hidden shadow-2xl z-10 flex flex-col text-left">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/2">
              <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                <Megaphone className="w-5 h-5 text-primary" />
                {t('Nova Campanha de Anúncios', 'New Ad Campaign')}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Product selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">{t('Selecionar Produto para Promover', 'Select Product to Promote')}</label>
                {products.length === 0 ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('Precisa de ter produtos ativos aprovados na plataforma.', 'You need active approved products on the platform.')}
                  </div>
                ) : (
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/3 text-white text-xs font-medium focus:border-primary transition-all outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-black">
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Placement selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">{t('Local do Anúncio (Placement)', 'Ad Placement')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'hero_banner', label: 'Homepage Hero (5x)', desc: t('Banner premium principal no topo', 'Main top premium banner') },
                    { value: 'featured_3d', label: 'Carrossel Destaques (2x)', desc: t('Destaque premium rotativo 3D', '3D gallery rotation highlight') },
                    { value: 'search_boost', label: 'Search Boost (3x)', desc: t('Primeiro nos resultados de buscas', 'First in search results') },
                    { value: 'category_boost', label: 'Category Boost (2x)', desc: t('Destaque no topo da categoria', 'Top of library category') },
                    { value: 'launch_push', label: 'Launch Feed (1.5x)', desc: t('Exposição na aba de lançamentos', 'Launch feed placement') },
                    { value: 'notification', label: 'Push Notification (4x)', desc: t('Disparo de push segmentado', 'Targeted push dispatch') }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPlacement(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        placement === opt.value
                          ? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                          : 'bg-white/3 border-white/5 hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-white/40 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target interests checklists (only for notification placement) */}
              {placement === 'notification' && (
                <div className="flex flex-col gap-2 p-3 bg-white/2 border border-white/5 rounded-xl">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary" />
                    {t('Segmentação: Áreas de Interesse (Matching)', 'Segmentation: Areas of Interest')}
                  </label>
                  <p className="text-[10px] text-white/40 mb-1">
                    {t('Apenas usuários que selecionaram esses interesses no onboarding receberão o disparo.', 'Only users selecting these interests in onboarding receive this push.')}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {interestOptions.map(opt => {
                      const selected = targetInterests.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleInterest(opt)}
                          className={`py-1 px-2 rounded-lg border text-[9px] font-semibold text-center transition-all ${
                            selected
                              ? 'bg-primary/20 border-primary text-white'
                              : 'bg-white/3 border-white/5 text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {selected && <Check className="w-2.5 h-2.5 inline mr-1 text-primary" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">{t('Duração da Campanha', 'Campaign Duration')}</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { days: 1, discount: '0%' },
                    { days: 3, discount: '5%' },
                    { days: 7, discount: '10%' },
                    { days: 15, discount: '15%' },
                    { days: 30, discount: '20%' }
                  ].map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setDurationDays(opt.days)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        durationDays === opt.days
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-white/3 border-white/5 hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.days} {t('Dia', 'Day')}</div>
                      <div className="text-[8px] text-primary/70 mt-0.5">{t('Desc: ', 'Off: ')}{opt.discount}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Price display */}
              <div className="p-4 bg-white/3 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{t('Valor Estimado Dinâmico', 'Dynamic Estimated Price')}</div>
                  <div className="text-[10px] text-white/40 mt-1">{t('Cálculo em tempo real (Stripe USD)', 'Real-time billing (Stripe USD)')}</div>
                </div>
                <div>
                  {calculatingPrice ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-primary"></div>
                  ) : calculatedPrice !== null ? (
                    <div className="text-xl font-black font-mono text-primary">$ {calculatedPrice.toFixed(2)}</div>
                  ) : (
                    <div className="text-white/40">-</div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting || products.length === 0 || calculatingPrice || calculatedPrice === null}
                className="w-full h-10 inline-flex items-center justify-center rounded-xl bg-primary text-xs font-bold text-black hover:bg-primary-high transition-colors disabled:opacity-50"
              >
                {submitting ? t('Processando...', 'Redirecting...') : t('Ir para o Stripe Checkout', 'Go to Stripe Checkout')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ANALYTICS METRICS MODAL */}
      {showAnalyticsModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalyticsModal(false)}></div>
          
          <div className="relative glass-panel rounded-2xl border border-white/15 bg-[#101015] w-full max-w-xl overflow-hidden shadow-2xl z-10 flex flex-col text-left">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/2">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('Métricas de Desempenho (Campanha)', 'Campaign Performance Metrics')}
              </h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Campaign summary */}
              <div className="flex items-center gap-4 bg-white/3 border border-white/5 p-4 rounded-xl">
                {selectedCampaign.product && (
                  <img
                    src={selectedCampaign.product.cover_url}
                    alt={selectedCampaign.product.title}
                    className="w-12 h-12 rounded object-cover bg-black/40"
                  />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedCampaign.product?.title || t('Campanha Customizada', 'Custom Campaign')}</h4>
                  <p className="text-[10px] text-white/50 mt-1 uppercase font-mono tracking-wider">
                    Placement: <span className="text-primary">{selectedCampaign.placement}</span> | {t('Investimento: ', 'Spent: ')}<span className="text-white font-mono font-semibold">${parseFloat(selectedCampaign.total_budget).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {loadingAnalytics ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-white/60 text-xs">{t('Carregando métricas...', 'Loading metrics...')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aggregated analytics stats cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white/2 border border-white/5 rounded-lg text-center">
                      <div className="text-[9px] text-white/40 uppercase">{t('Impressões', 'Impressions')}</div>
                      <div className="text-lg font-black text-white mt-1 font-mono">
                        {analyticsData.reduce((acc, a) => acc + (a.impressions || 0), 0)}
                      </div>
                    </div>
                    <div className="p-3 bg-white/2 border border-white/5 rounded-lg text-center">
                      <div className="text-[9px] text-white/40 uppercase">{t('Cliques', 'Clicks')}</div>
                      <div className="text-lg font-black text-white mt-1 font-mono">
                        {analyticsData.reduce((acc, a) => acc + (a.clicks || 0), 0)}
                      </div>
                    </div>
                    <div className="p-3 bg-white/2 border border-white/5 rounded-lg text-center">
                      <div className="text-[9px] text-white/40 uppercase">CTR %</div>
                      <div className="text-lg font-black text-primary mt-1 font-mono">
                        {(() => {
                          const imps = analyticsData.reduce((acc, a) => acc + (a.impressions || 0), 0);
                          const clicks = analyticsData.reduce((acc, a) => acc + (a.clicks || 0), 0);
                          return imps > 0 ? ((clicks / imps) * 100).toFixed(2) + '%' : '0.00%';
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-white/2 border border-white/5 rounded-lg text-center">
                      <div className="text-[9px] text-white/40 uppercase">{t('Vendas (ROI)', 'Sales (ROI)')}</div>
                      <div className="text-lg font-black text-green-400 mt-1 font-mono">
                        {analyticsData.reduce((acc, a) => acc + (a.conversions || 0), 0)}
                      </div>
                    </div>
                  </div>

                  {/* Daily list table */}
                  <div className="border border-white/5 rounded-lg overflow-hidden bg-black/20">
                    <div className="p-3 bg-white/3 font-semibold text-[10px] text-white uppercase">{t('Performance Diária', 'Daily Performance')}</div>
                    <div className="divide-y divide-white/5">
                      {analyticsData.length === 0 ? (
                        <div className="p-6 text-center text-xs text-white/30">{t('Sem dados registrados para esta campanha ainda.', 'No metrics registered for this campaign yet.')}</div>
                      ) : (
                        analyticsData.map(row => (
                          <div key={row.id} className="flex justify-between items-center p-3 text-[11px] font-mono hover:bg-white/2">
                            <span className="text-white/60">{new Date(row.date).toLocaleDateString()}</span>
                            <div className="flex gap-4">
                              <span>{row.impressions} {t('Imp', 'Imp')}</span>
                              <span className="text-primary">{row.clicks} Clicks</span>
                              <span className="text-green-400">{row.conversions} Conv</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
