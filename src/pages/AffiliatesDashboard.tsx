import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  Link2, Users, TrendingUp, DollarSign, Landmark, CheckCircle,
  Clock, XCircle, Copy, Percent, AlertCircle, ArrowLeft,
  ExternalLink, Settings, Wallet, ArrowRight, RefreshCw, Search,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserCountry } from '../contexts/UserCountryContext';
import { CountryRequiredModal } from '../components/CountryRequiredModal';

interface AffiliatesDashboardProps {
  setScreen: (screen: string, section?: string) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function AffiliatesDashboard({ setScreen }: AffiliatesDashboardProps) {
  const { t } = useTranslation('pages');
  const { country, isAngola, isLoading: countryLoading } = useUserCountry();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [seenExplainer, setSeenExplainer] = useState<boolean>(() => {
    return localStorage.getItem('ce_affiliate_intro_seen') === 'true';
  });

  // Core data states
  const [wallet, setWallet] = useState<any>(null);
  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'conversions' | 'payout' | 'withdrawals'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Payout configuration form
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'iban' | 'multicaixa'>('iban');
  const [payoutInfo, setPayoutInfo] = useState({
    paypalEmail: '',
    bankName: '',
    iban: '',
    accountHolder: '',
    phoneNumber: '',
    fullName: ''
  });
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Withdraw request form
  const [withdrawCurrency, setWithdrawCurrency] = useState<'usd' | 'aoa'>('usd');
  const [hasDefaultedCurrency, setHasDefaultedCurrency] = useState(false);

  useEffect(() => {
    if (!hasDefaultedCurrency && !countryLoading) {
      setWithdrawCurrency(isAngola ? 'aoa' : 'usd');
      setHasDefaultedCurrency(true);
    }
  }, [isAngola, countryLoading, hasDefaultedCurrency]);

  useEffect(() => {
    if (!countryLoading && !isAngola && payoutMethod !== 'paypal') {
      setPayoutMethod('paypal');
    }
  }, [isAngola, countryLoading, payoutMethod]);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }
      setUser(session.user);
      
      // Check if they visited/seen in localStorage for this specific user
      const storedSeen = localStorage.getItem(`ce_affiliate_intro_seen_${session.user.id}`);
      if (storedSeen === 'true') {
        setSeenExplainer(true);
      }

      await loadDashboardData(session.access_token);
    } catch (err) {
      console.error('Error verifying auth / loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadDashboardData(session.access_token);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadDashboardData(accessToken: string) {
    try {
      // 1. Fetch Wallet
      const walletRes = await fetch(`${BACKEND_URL}/api/affiliates/wallet`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const walletData = await walletRes.json();
      if (walletData.success && walletData.wallet) {
        setWallet(walletData.wallet);
        // Pre-fill payout settings if present
        if (walletData.wallet.payout_method) {
          setPayoutMethod(walletData.wallet.payout_method);
        }
        if (walletData.wallet.payout_info) {
          setPayoutInfo(prev => ({
            ...prev,
            ...walletData.wallet.payout_info
          }));
        }
      }

      // 2. Fetch My Links
      const linksRes = await fetch(`${BACKEND_URL}/api/affiliates/my-links`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const linksData = await linksRes.json();
      if (linksData.success) {
        const linksList = linksData.links || [];
        setMyLinks(linksList);
        if (linksList.length > 0) {
          setSeenExplainer(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            localStorage.setItem(`ce_affiliate_intro_seen_${session.user.id}`, 'true');
          }
        }
      }

      // 3. Fetch Available Products
      const productsRes = await fetch(`${BACKEND_URL}/api/affiliates/products`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const productsData = await productsRes.json();
      if (productsData.success) {
        setAvailableProducts(productsData.products || []);
      }

      // 4. Fetch Conversions (History)
      const convsRes = await fetch(`${BACKEND_URL}/api/affiliates/conversions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const convsData = await convsRes.json();
      if (convsData.success) {
        setConversions(convsData.conversions || []);
      }

      // 5. Fetch Payout/Withdrawal History (Directly from Supabase via RLS)
      const { data: wdData, error: wdErr } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!wdErr && wdData) {
        setWithdrawals(wdData);
      }
    } catch (err) {
      console.error('Error inside loadDashboardData:', err);
    }
  }

  // Handle Joining Affiliate Program for a product
  async function handleJoinAffiliate(productId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/affiliates/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      const data = await res.json();

      if (data.success) {
        // Reload links and products
        await loadDashboardData(session.access_token);
        // Show success / auto switch to links tab or keep on product tab but updated
      } else {
        alert(data.error || 'Erro ao afiliar-se.');
      }
    } catch (err) {
      console.error('Error joining affiliate:', err);
      alert('Erro de conexão ao afiliar-se.');
    }
  }

  // Save Payout Details
  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayout(true);
    setPayoutMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/affiliates/wallet/payout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payout_method: payoutMethod,
          payout_info: payoutInfo
        })
      });
      const data = await res.json();

      if (data.success) {
        setPayoutMessage({ type: 'success', text: 'Dados de saque guardados com sucesso!' });
        // Reload wallet
        await loadDashboardData(session.access_token);
      } else {
        setPayoutMessage({ type: 'error', text: data.error || 'Erro ao guardar dados.' });
      }
    } catch (err) {
      console.error('Error saving payout:', err);
      setPayoutMessage({ type: 'error', text: 'Erro de ligação ao servidor.' });
    } finally {
      setSavingPayout(false);
    }
  }

  // Submit Payout Request
  async function handleRequestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      setWithdrawMessage({ type: 'error', text: 'Insira um valor de saque válido.' });
      return;
    }

    // Check if payout details are set
    if (!wallet?.payout_method) {
      setWithdrawMessage({ type: 'error', text: 'Configure o seu método de pagamento na aba correspondente antes de efetuar saques.' });
      return;
    }

    const available = withdrawCurrency === 'usd' ? wallet.balance_usd : wallet.balance_aoa;
    if (amountNum > available) {
      setWithdrawMessage({ type: 'error', text: 'Saldo disponível insuficiente.' });
      return;
    }

    setWithdrawing(true);
    setWithdrawMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/affiliates/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          currency: withdrawCurrency,
          amount: amountNum
        })
      });
      const data = await res.json();

      if (data.success) {
        setWithdrawMessage({ type: 'success', text: data.message || 'Pedido de saque realizado!' });
        setWithdrawAmount('');
        // Reload wallet and withdrawals list
        await loadDashboardData(session.access_token);
      } else {
        setWithdrawMessage({ type: 'error', text: data.error || 'Erro ao processar saque.' });
      }
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      setWithdrawMessage({ type: 'error', text: 'Erro de ligação ao servidor.' });
    } finally {
      setWithdrawing(false);
    }
  }

  function handleAcceptProgram() {
    if (user?.id) {
      localStorage.setItem(`ce_affiliate_intro_seen_${user.id}`, 'true');
      localStorage.setItem(`ce_affiliate_accepted_${user.id}`, 'true');
    }
    localStorage.setItem('ce_affiliate_intro_seen', 'true');
    localStorage.setItem('ce_affiliate_intro_accepted', 'true');
    setSeenExplainer(true);
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const formatCurrency = (val: number | string, curr: 'usd' | 'aoa') => {
    const num = Number(val) || 0;
    if (curr === 'usd') {
      return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else {
      return num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }).replace('Kz', 'AOA');
    }
  };

  // Filter products by search term
  const filteredProducts = availableProducts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || countryLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm font-sans">Carregando painel de afiliados...</p>
      </div>
    );
  }

  // ─── ONBOARDING EXPLAINER SCREEN ───────────────────────────────────────────
  if (!seenExplainer) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-10 bg-background text-on-surface">
        <CountryRequiredModal />
        <div className="w-full max-w-4xl bg-surface/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
          {/* Subtle decoration glows */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/15 blur-[120px]" />

          <div className="relative flex flex-col items-center text-center">
            {/* Icon Banner */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(192,193,255,0.2)]">
              <Award className="w-9 h-9 text-primary animate-pulse" />
            </div>

            <h1 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-on-surface to-primary bg-clip-text text-transparent mb-3">
              Programa de Afiliados CodeEngine
            </h1>
            <p className="font-sans text-sm md:text-base text-on-surface-variant max-w-2xl mb-10">
              Transforme a sua influência em rendimento. Recomende cursos, e-books e scripts profissionais de criadores de tecnologia na nossa plataforma e receba comissões automáticas diretamente na sua carteira.
            </p>

            {/* Explanation grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 text-left">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white">Sem Aprovação Prévia</h3>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Não precisa de esperar que o criador aprove a sua afiliação. Qualquer membro registado pode começar a promover os produtos imediatamente após ativar o programa.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white font-sans">Links Únicos de Tracking</h3>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Gere links únicos com o seu código de rastreio exclusivo. Os cliques e conversões são registados automaticamente e guardados no navegador do cliente durante 30 dias.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white">Percentagens Definidas pelo Criador</h3>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Cada produtor decide a taxa de comissão que partilha (até 80% do valor da venda). Pode escolher os produtos com maior margem para rentabilizar as suas redes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white">Carteira Separada & Moeda Local</h3>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  O saldo de afiliado é gerido de forma independente do saldo de produtor. Recebe e retira os fundos na moeda em que o cliente pagou (USD ou AOA).
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (user?.id) {
                    localStorage.setItem(`ce_affiliate_intro_seen_${user.id}`, 'true');
                  }
                  localStorage.setItem('ce_affiliate_intro_seen', 'true');
                  setScreen('member', 'inicio');
                }}
                className="px-6 py-3 rounded-xl border border-white/15 hover:bg-white/5 transition-all text-xs font-display uppercase tracking-widest text-on-surface-variant font-bold hover:text-white"
              >
                Voltar à Área de Membro
              </button>

              <button
                onClick={handleAcceptProgram}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-background hover:brightness-110 shadow-[0_0_30px_rgba(192,193,255,0.35)] transition-all text-xs font-display uppercase tracking-widest font-extrabold flex items-center justify-center gap-2"
              >
                <span>Avançar para o Painel</span>
                <ArrowRight className="w-4 h-4 text-background" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD CORE SCREEN ────────────────────────────────────────────────
  return (
    <div className="w-full flex-grow flex flex-col bg-background text-on-surface px-4 md:px-6 pt-16 pb-4">
      <CountryRequiredModal />
      {/* Top Banner Row - 100% full width */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-primary font-display uppercase tracking-wider mb-0.5 font-bold">
            <Percent className="w-3.5 h-3.5" />
            <span>Afiliados CodeEngine</span>
          </div>
          <h1 className="font-display text-xl md:text-2xl font-black text-white">
            Painel de Afiliado
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSeenExplainer(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-on-surface-variant hover:text-white transition-all"
            title="Ver instruções do programa de afiliados"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ver Instruções</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 hover:bg-white/5 text-on-surface-variant hover:text-white transition-all disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. KPIs Row (Full Width, 3-Column layout) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Card 1: Wallet Balance */}
        <div className="bg-surface/30 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Saldos Disponíveis</p>
              <div className="mt-1 space-y-0.5">
                {isAngola ? (
                  <>
                    <h3 className="font-display text-lg font-extrabold text-white">
                      {formatCurrency(wallet?.balance_aoa || 0, 'aoa')}
                    </h3>
                    <h3 className="font-display text-xs font-semibold text-primary/80">
                      {formatCurrency(wallet?.balance_usd || 0, 'usd')}
                    </h3>
                  </>
                ) : (
                  <h3 className="font-display text-lg font-extrabold text-white">
                    {formatCurrency(wallet?.balance_usd || 0, 'usd')}
                  </h3>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="border-t border-white/5 pt-1.5 mt-1.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Método de Saque:</span>
            <span className="font-bold text-white uppercase">{wallet?.payout_method || 'Não Configurado'}</span>
          </div>
        </div>

        {/* Card 2: Traffic Stats */}
        <div className="bg-surface/30 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Desempenho Geral</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-on-surface-variant">Cliques</span>
                  <p className="font-display text-lg font-extrabold text-white mt-0.5">
                    {myLinks.reduce((sum, l) => sum + (l.clicks || 0), 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-variant">Conversões</span>
                  <p className="font-display text-lg font-extrabold text-white mt-0.5">
                    {myLinks.reduce((sum, l) => sum + (l.totalConversions || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="border-t border-white/5 pt-1.5 mt-1.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Taxa Média de Conversão:</span>
            <span className="font-bold text-white">
              {(() => {
                const totalClicks = myLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
                const totalConvs = myLinks.reduce((sum, l) => sum + (l.totalConversions || 0), 0);
                return totalClicks > 0 ? `${((totalConvs / totalClicks) * 100).toFixed(1)}%` : '0.0%';
              })()}
            </span>
          </div>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-surface/30 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Total Sacado</p>
              <div className="mt-1 space-y-0.5">
                {isAngola ? (
                  <>
                    <h3 className="font-display text-base font-bold text-white">
                      {formatCurrency(wallet?.total_withdrawn_aoa || 0, 'aoa')}
                    </h3>
                    <h3 className="font-display text-xs font-semibold text-on-surface-variant">
                      {formatCurrency(wallet?.total_withdrawn_usd || 0, 'usd')}
                    </h3>
                  </>
                ) : (
                  <h3 className="font-display text-base font-bold text-white">
                    {formatCurrency(wallet?.total_withdrawn_usd || 0, 'usd')}
                  </h3>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="border-t border-white/5 pt-1.5 mt-1.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Ganhos Totais acumulados:</span>
            <span className="font-bold text-white">
              {isAngola
                ? formatCurrency((wallet?.total_earned_aoa || 0), 'aoa')
                : formatCurrency((wallet?.total_earned_usd || 0), 'usd')
              }
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Stretches Full Width) */}
      <div className="w-full border-b border-white/10 mb-4 flex overflow-x-auto scrollbar-none whitespace-nowrap gap-2">
        {[
          { id: 'overview', label: 'Minhas Afiliações & Links' },
          { id: 'products', label: 'Produtos Disponíveis' },
          { id: 'conversions', label: 'Histórico de Comissões' },
          { id: 'payout', label: 'Configurar Pagamento' },
          { id: 'withdrawals', label: 'Saques' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPayoutMessage(null);
              setWithdrawMessage(null);
            }}
            className={`px-3 py-2 font-display text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-white/5'
                : 'border-transparent text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents (Occupies 100% of usable width) */}
      <div className="w-full flex-grow">
        {/* ==================== TAB: OVERVIEW (MY LINKS) ==================== */}
        {activeTab === 'overview' && (
          <div className="w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Seus Links de Afiliado</h2>
                <p className="font-sans text-xs text-on-surface-variant">Partilhe estes links para rastrear cliques e gerar comissões automáticas.</p>
              </div>
              
              {myLinks.length > 0 && (
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-primary text-background hover:bg-primary/95 text-xs font-display uppercase tracking-widest font-extrabold rounded-lg flex items-center justify-center gap-1.5 self-start"
                >
                  <Percent className="w-3.5 h-3.5 text-background" />
                  <span>Obter Mais Links</span>
                </button>
              )}
            </div>

            {myLinks.length === 0 ? (
              <div className="w-full py-10 bg-surface/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-on-surface-variant">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">Sem links de afiliado ativos</h3>
                <p className="font-sans text-xs text-on-surface-variant max-w-sm mb-4">
                  Você ainda não se afiliou a nenhum produto. Vá para a aba "Produtos Disponíveis" e ative seus links.
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-2 bg-primary text-background hover:brightness-105 transition-all text-xs font-display uppercase tracking-widest font-extrabold rounded-lg"
                >
                  Ver Produtos Disponíveis
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {myLinks.map((link: any) => {
                  const productUrl = `${window.location.origin}/?screen=product&id=${link.product.id}&ref=${link.tracking_code}`;
                  const generalUrl = `${window.location.origin}/?ref=${link.tracking_code}`;

                  return (
                    <div
                      key={link.id}
                      className="bg-surface/30 border border-white/10 rounded-xl p-2.5 hover:border-primary/30 transition-all flex flex-row gap-2.5 items-center"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-14 h-18 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black/40 relative">
                        {link.product.cover_url ? (
                          <img
                            src={link.product.cover_url}
                            alt={link.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-on-surface-variant font-sans uppercase">
                            Sem Capa
                          </div>
                        )}
                        <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-primary/20 backdrop-blur-md border border-primary/20 text-[8px] text-primary font-display font-extrabold uppercase">
                          {link.commission_pct}%
                        </div>
                      </div>

                      {/* Info & Links inputs */}
                      <div className="flex-grow flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-display text-sm font-bold text-white mb-0.5 line-clamp-1">
                            {link.product.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-sans text-on-surface-variant">
                            <span>Preço: <strong className="text-white">
                              {link.product.price
                                ? `$${link.product.price}`
                                : isAngola
                                  ? `${link.product.aoa_price} AOA`
                                  : '—'
                              }
                            </strong></span>
                            <span>Cliques: <strong className="text-white">{link.clicks || 0}</strong></span>
                            <span>Vendas: <strong className="text-white">{link.totalConversions || 0}</strong></span>
                          </div>
                        </div>
                        
                        {/* Compact Link Actions */}
                        <div className="flex flex-row items-center gap-2 mt-1.5">
                          <button
                            onClick={() => copyToClipboard(productUrl, `${link.id}-prod`)}
                            className="flex-1 flex items-center justify-between gap-1 px-2 py-1 rounded bg-black/40 border border-white/5 hover:bg-white/5 text-[10px] text-white font-sans font-semibold transition-all cursor-pointer min-w-0"
                          >
                            <span className="text-on-surface-variant truncate mr-1">Link Direto</span>
                            <div className="flex items-center gap-1 text-primary shrink-0">
                              <Copy className="w-3 h-3" />
                              <span className="text-[9px]">{copiedLinkId === `${link.id}-prod` ? 'Copiado' : 'Copiar'}</span>
                            </div>
                          </button>

                          <button
                            onClick={() => copyToClipboard(generalUrl, `${link.id}-gen`)}
                            className="flex-1 flex items-center justify-between gap-1 px-2 py-1 rounded bg-black/40 border border-white/5 hover:bg-white/5 text-[10px] text-white font-sans font-semibold transition-all cursor-pointer min-w-0"
                          >
                            <span className="text-on-surface-variant truncate mr-1">Link Loja</span>
                            <div className="flex items-center gap-1 text-primary shrink-0">
                              <Copy className="w-3 h-3" />
                              <span className="text-[9px]">{copiedLinkId === `${link.id}-gen` ? 'Copiado' : 'Copiar'}</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: PRODUCTS (AVAILABLE) ==================== */}
        {activeTab === 'products' && (
          <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Catálogo de Afiliação</h2>
                <p className="font-sans text-xs text-on-surface-variant">Selecione produtos listados por criadores e ative o seu link de comissão com um clique.</p>
              </div>

              {/* Search input */}
              <div className="w-full md:w-80 flex items-center gap-2 bg-surface/50 border border-white/10 rounded-xl px-3 py-2 shadow-inner">
                <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar por título ou criador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-on-surface-variant flex-grow"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="w-full py-10 bg-surface/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-on-surface-variant">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">Nenhum produto encontrado</h3>
                <p className="font-sans text-xs text-on-surface-variant">
                  Tente alterar os seus termos de pesquisa ou volte mais tarde para novos lançamentos.
                </p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product: any) => {
                    const hasUsd = product.price && product.price > 0;
                    const hasAoa = product.aoa_price && product.aoa_price > 0;
                    const isAoaOnly = !hasUsd && hasAoa;
                    const disabledForForeigner = !isAngola && isAoaOnly;

                    return (
                  <div
                    key={product.id}
                    className={`bg-surface/30 border rounded-xl p-3.5 transition-all flex flex-col justify-between ${
                      disabledForForeigner
                        ? 'border-white/5 opacity-60'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Product cover */}
                      <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40 mb-2 relative">
                        {product.cover_url ? (
                          <img
                            src={product.cover_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant uppercase font-sans">
                            Sem Capa
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/25 backdrop-blur-md border border-primary/30 text-[10px] text-primary font-display font-extrabold uppercase">
                          {product.affiliate_commission_pct}% Comissão
                        </div>
                      </div>

                      {/* Details */}
                      <h3 className="font-display text-sm font-bold text-white line-clamp-1 mb-1">{product.title}</h3>
                      <p className="text-[11px] font-sans text-on-surface-variant mb-2">Por: <strong className="text-white">{product.collaboratorName}</strong></p>

                      {/* Currency badge */}
                      <div className="flex gap-1.5 mb-2">
                        {hasUsd && hasAoa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border border-green-500/30 bg-green-500/10 text-green-400">
                            💵 USD + 🟡 AOA
                          </span>
                        ) : hasUsd ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-400">
                            💵 USD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-400">
                            🟡 Apenas AOA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-sans uppercase tracking-wider text-on-surface-variant block">Seu Ganho Estimado</span>
                        <span className="text-xs font-display font-black text-white">
                          {hasUsd
                            ? `$${(product.price * (product.affiliate_commission_pct / 100)).toFixed(2)}`
                            : isAngola && hasAoa
                              ? `${(product.aoa_price * (product.affiliate_commission_pct / 100)).toFixed(0)} AOA`
                              : '—'
                          }
                        </span>
                      </div>

                      {product.already_affiliated ? (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-display font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>Já Afiliado</span>
                        </div>
                      ) : disabledForForeigner ? (
                        <span className="px-3 py-1.5 bg-white/5 text-on-surface-variant text-[10px] font-display uppercase tracking-widest font-bold rounded-lg border border-white/10 cursor-not-allowed">
                          Apenas AOA
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinAffiliate(product.id)}
                          className="px-4 py-2 bg-white text-background hover:bg-primary hover:text-background text-xs font-display uppercase tracking-widest font-black rounded-lg transition-all"
                        >
                          Afiliar-se
                        </button>
                      )}
                    </div>
                  </div>
                    );
                  })}

              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: CONVERSIONS (COMMISSIONS) ==================== */}
        {activeTab === 'conversions' && (
          <div className="w-full space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-white mb-1">Registro de Comissões</h2>
              <p className="font-sans text-xs text-on-surface-variant">Histórico detalhado de todas as vendas convertidas através do seu link.</p>
            </div>

            {conversions.length === 0 ? (
              <div className="w-full py-10 bg-surface/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-on-surface-variant">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white mb-1">Nenhuma comissão registrada</h3>
                <p className="font-sans text-xs text-on-surface-variant max-w-sm">
                  Partilhe os seus links nas suas plataformas. Assim que um cliente finalizar a compra, ela constará aqui.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-surface/20 shadow-md">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/15 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="p-2.5">Produto</th>
                      <th className="p-2.5">Valor da Venda</th>
                      <th className="p-2.5">Taxa</th>
                      <th className="p-2.5">Sua Comissão</th>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions
                      .filter((conv: any) => isAngola || conv.currency === 'usd')
                      .map((conv: any) => (
                      <tr key={conv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-2.5 font-semibold text-white">{conv.products?.title}</td>
                        <td className="p-2.5">
                          {conv.currency === 'usd' ? `$${conv.sale_amount_usd}` : `${formatCurrency(conv.sale_amount_aoa, 'aoa')}`}
                        </td>
                        <td className="p-2.5">{conv.commission_rate}%</td>
                        <td className="p-2.5 font-bold text-green-400">
                          {conv.currency === 'usd' ? `+$${conv.commission_usd}` : `+${formatCurrency(conv.commission_aoa, 'aoa')}`}
                        </td>
                        <td className="p-2.5 text-on-surface-variant">
                          {new Date(conv.created_at).toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            conv.status === 'paid'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                          }`}>
                            {conv.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: PAYOUT CONFIG ==================== */}
        {activeTab === 'payout' && (
          <div className="w-full max-w-2xl bg-surface/30 border border-white/10 rounded-xl p-4 shadow-lg">
            <h2 className="font-display text-lg font-bold text-white mb-1.5">Dados de Recebimento</h2>
            <p className="font-sans text-xs text-on-surface-variant mb-4">
              Estes dados serão utilizados para processar os seus saques. Certifique-se de que os dados estão corretos para evitar rejeições.
            </p>

            <form onSubmit={handleSavePayout} className="space-y-5">
              {/* Method Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-display font-bold uppercase tracking-wider text-on-surface-variant">Método Preferencial</label>
                <div className={`grid ${isAngola ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
                  {[
                    { id: 'iban', label: 'IBAN (Bancos AO)', icon: <Landmark className="w-4 h-4" /> },
                    { id: 'paypal', label: 'PayPal (Global)', icon: <Wallet className="w-4 h-4" /> },
                    { id: 'multicaixa', label: 'Express/Telefone', icon: <Landmark className="w-4 h-4" /> }
                  ]
                  .filter((m) => isAngola ? true : m.id === 'paypal')
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayoutMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        payoutMethod === m.id
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(192,193,255,0.15)]'
                          : 'border-white/10 bg-black/25 text-on-surface-variant hover:text-white hover:border-white/20'
                      }`}
                    >
                      {m.icon}
                      <span className="text-[10px] font-sans font-bold mt-1.5">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs based on Payout Method */}
              {payoutMethod === 'iban' && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Nome do Titular da Conta</label>
                      <input
                        type="text"
                        required
                        value={payoutInfo.accountHolder}
                        onChange={(e) => setPayoutInfo(prev => ({ ...prev, accountHolder: e.target.value }))}
                        placeholder="Ex: Fernando Quipiaca"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Nome do Banco</label>
                      <input
                        type="text"
                        required
                        value={payoutInfo.bankName}
                        onChange={(e) => setPayoutInfo(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Ex: BAI, BFA, BIC"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">IBAN</label>
                    <input
                      type="text"
                      required
                      value={payoutInfo.iban}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, iban: e.target.value }))}
                      placeholder="AO06.XXXX.XXXX.XXXX.XXXX.XXXX.X"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans select-all"
                    />
                  </div>
                </div>
              )}

              {payoutMethod === 'paypal' && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">E-mail do PayPal</label>
                    <input
                      type="email"
                      required
                      value={payoutInfo.paypalEmail}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, paypalEmail: e.target.value }))}
                      placeholder="seuemail@paypal.com"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Nome Completo do Beneficiário</label>
                    <input
                      type="text"
                      required
                      value={payoutInfo.fullName}
                      onChange={(e) => setPayoutInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Nome completo cadastrado no PayPal"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>
                </div>
              )}

              {payoutMethod === 'multicaixa' && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Número de Telefone Associado</label>
                      <input
                        type="text"
                        required
                        value={payoutInfo.phoneNumber}
                        onChange={(e) => setPayoutInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="Ex: 923XXXXXX"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={payoutInfo.fullName}
                        onChange={(e) => setPayoutInfo(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Nome do Titular"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-on-surface-variant/40 outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payoutMessage && (
                <div className={`p-3 rounded-lg border text-xs font-sans flex items-center gap-2 ${
                  payoutMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border-green-500/25'
                    : 'bg-red-500/10 text-red-400 border-red-500/25'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{payoutMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPayout}
                className="w-full py-2.5 bg-primary text-background hover:bg-primary/90 disabled:opacity-50 text-xs font-display uppercase tracking-widest font-extrabold rounded-lg shadow-lg flex items-center justify-center gap-1.5 transition-all"
              >
                {savingPayout ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Dados de Recebimento</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================== TAB: WITHDRAWALS ==================== */}
        {activeTab === 'withdrawals' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Request Payout Form */}
            <div className="lg:col-span-1 bg-surface/30 border border-white/10 rounded-xl p-4 shadow-lg h-fit">
              <h2 className="font-display text-lg font-bold text-white mb-1.5">Solicitar Saque</h2>
              <p className="font-sans text-xs text-on-surface-variant mb-3">
                Transfira o seu saldo disponível de afiliado para o seu método de pagamento preferencial.
              </p>

              {/* Currency selection */}
              <form onSubmit={handleRequestWithdraw} className="space-y-4">
                {isAngola && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Selecionar Moeda</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawCurrency('usd')}
                        className={`flex-1 py-2 text-center rounded-lg border text-xs font-display font-extrabold uppercase transition-all ${
                          withdrawCurrency === 'usd'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-white/10 bg-black/25 text-on-surface-variant'
                        }`}
                      >
                        USD ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawCurrency('aoa')}
                        className={`flex-1 py-2 text-center rounded-lg border text-xs font-display font-extrabold uppercase transition-all ${
                          withdrawCurrency === 'aoa'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-white/10 bg-black/25 text-on-surface-variant'
                        }`}
                      >
                        AOA (Kz)
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-on-surface-variant">Valor do Saque</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-display font-bold">
                      {withdrawCurrency === 'usd' ? '$' : 'AOA'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3.5 py-2 text-xs text-white outline-none focus:border-primary transition-all font-sans font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant mt-1.5 px-0.5">
                    <span>Saldo Disponível:</span>
                    <span className="font-bold text-white">
                      {withdrawCurrency === 'usd'
                        ? formatCurrency(wallet?.balance_usd || 0, 'usd')
                        : formatCurrency(wallet?.balance_aoa || 0, 'aoa')
                      }
                    </span>
                  </div>
                </div>

                {withdrawMessage && (
                  <div className={`p-3 rounded-lg border text-xs font-sans flex items-center gap-2 ${
                    withdrawMessage.type === 'success'
                      ? 'bg-green-500/10 text-green-400 border-green-500/25'
                      : 'bg-red-500/10 text-red-400 border-red-500/25'
                  }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{withdrawMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full py-2.5 bg-primary text-background hover:brightness-105 disabled:opacity-50 text-xs font-display uppercase tracking-widest font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {withdrawing ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Solicitar Saque</span>
                  )}
                </button>
              </form>
            </div>

            {/* Payout Requests History List (Full Width Tables on right) */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider px-1">Seus Pedidos de Saque</h2>
              
              {withdrawals.length === 0 ? (
                <div className="w-full py-10 bg-surface/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 text-on-surface-variant">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-white mb-1">Nenhum saque solicitado</h3>
                  <p className="font-sans text-xs text-on-surface-variant">
                    Seus pedidos de saque e histórico de transações aparecerão nesta área.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-surface/20">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/15 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <th className="p-2.5">Valor</th>
                        <th className="p-2.5">Método</th>
                        <th className="p-2.5">Data</th>
                        <th className="p-2.5">Taxa</th>
                        <th className="p-2.5 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w: any) => (
                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-bold text-white">
                            {w.currency === 'usd'
                              ? `$${w.amount_usd}`
                              : isAngola
                                ? `${formatCurrency(w.amount_aoa, 'aoa')}`
                                : '—'
                            }
                          </td>
                          <td className="p-2.5 uppercase">{w.payout_method}</td>
                          <td className="p-2.5 text-on-surface-variant">
                            {new Date(w.created_at).toLocaleDateString('pt-PT')}
                          </td>
                          <td className="p-2.5 text-on-surface-variant">
                            {w.fee_amount > 0 ? (
                              w.currency === 'usd' ? `$${w.fee_amount}` : `${w.fee_amount} AOA`
                            ) : (
                              'Grátis'
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                w.status === 'completed'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                                  : w.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                              }`}>
                                {w.status === 'completed' && 'Pago'}
                                {w.status === 'rejected' && 'Rejeitado'}
                                {w.status === 'pending' && 'Processando'}
                              </span>
                              {w.admin_notes && (
                                <span className="text-[10px] text-red-400/80 max-w-[150px] truncate" title={w.admin_notes}>
                                  Nota: {w.admin_notes}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
