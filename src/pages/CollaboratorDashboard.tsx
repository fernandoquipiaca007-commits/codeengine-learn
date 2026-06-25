import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, 
  DollarSign, Landmark, Mail, PlusCircle, AlertCircle, RefreshCw, ChevronRight, FileText, ExternalLink, Award, ShieldCheck, Video, PlayCircle,
  Users, Percent, Search, Briefcase
} from 'lucide-react';

interface CollaboratorDashboardProps {
  setScreen: (screen: string) => void;
  onGoToProducts: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface CollaboratorProfile {
  id: string;
  displayName: string;
  plan: string;
  payoutMethod: 'paypal' | 'iban';
  payoutInfo: {
    email?: string;
    bankName?: string;
    bankHolder?: string;
    iban?: string;
  };
  planExpiresAt?: string;
  upgradeMethod?: 'stripe' | 'fastpay';
  upgradeStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  upgradeReceiptUrl?: string;
  facipayAccount?: string;
}

export function CollaboratorDashboard({ setScreen, onGoToProducts }: CollaboratorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  // Withdrawal Request Modal / State (USD)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // AOA Withdrawal Modal / State
  const [showWithdrawAoaModal, setShowWithdrawAoaModal] = useState(false);
  const [withdrawAoaAmount, setWithdrawAoaAmount] = useState<string>('');
  const [withdrawAoaMethod, setWithdrawAoaMethod] = useState<'iban_aoa' | 'facipay_p2p' | 'paypal_aoa'>('iban_aoa');
  const [submittingWithdrawAoa, setSubmittingWithdrawAoa] = useState(false);
  const [aoaModalError, setAoaModalError] = useState<string | null>(null);
  const [aoaModalSuccess, setAoaModalSuccess] = useState<string | null>(null);

  // Currency filter for dashboard view
  const [walletView, setWalletView] = useState<'usd' | 'aoa' | 'affiliates' | 'founder'>('usd');
  const [affiliates, setAffiliates] = useState<any[]>([]);

  // Membro Fundador state
  const [founderStats, setFounderStats] = useState<any>(null);
  const [founderLoading, setFounderLoading] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // Wallet Settings Modal / State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tempPayoutMethod, setTempPayoutMethod] = useState<'paypal' | 'iban'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [iban, setIban] = useState('');
  const [facipayAccount, setFacipayAccount] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);

  // Benefits & Pricing modal
  const [showPlanBenefitsModal, setShowPlanBenefitsModal] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [submittingStripe, setSubmittingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [fastpaySuccess, setFastpaySuccess] = useState<string | null>(null);
  const [fastpayError, setFastpayError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadFounderStats() {
    setFounderLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${BACKEND_URL}/api/collaborators/founder-stats`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) setFounderStats(data);
    } catch (err) {
      console.error('Error loading founder stats:', err);
    } finally {
      setFounderLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!founderStats?.authUserId) return;
    const link = `${window.location.origin}/?invite=${founderStats.authUserId}`;
    try {
      await navigator.clipboard.writeText(link);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2500);
    }
  }

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/collaborators/dashboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setBalance(data.balance);
        setLedger(data.ledger);
        setWithdrawals(data.withdrawals);
        setSettings(data.settings || {});

        // Fetch affiliates
        try {
          const resAff = await fetch(`${BACKEND_URL}/api/collaborators/affiliates`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const dataAff = await resAff.json();
          if (dataAff.success) {
            setAffiliates(dataAff.affiliates || []);
          }
        } catch (errAff) {
          console.error('Error loading affiliates:', errAff);
        }
      } else {
        console.error('Error dashboard:', data.error);
        if (data.error?.includes('Access denied')) {
          setScreen('colaborador-candidatura');
        }
      }
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeUpgrade() {
    setSubmittingStripe(true);
    setStripeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/upgrade-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error || 'Erro ao iniciar Stripe Checkout.');
      }
    } catch (err) {
      setStripeError('Erro de conexão ao iniciar Stripe.');
    } finally {
      setSubmittingStripe(false);
    }
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setFastpayError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado.');

      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/receipt_${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('fastpay-proofs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('fastpay-proofs').getPublicUrl(data.path);
      setReceiptUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error('[receiptUpload] error:', err);
      setFastpayError(`Erro no upload: ${err.message || err}`);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleFastpaySubmit() {
    if (!receiptUrl) {
      setFastpayError('Faça o upload do comprovativo primeiro.');
      return;
    }

    setFastpayError(null);
    setFastpaySuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/upgrade-fastpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ receiptUrl })
      });
      const data = await res.json();
      if (data.success) {
        setFastpaySuccess('Comprovativo enviado com sucesso! Aguarde aprovação.');
        setTimeout(() => {
          loadDashboardData();
          setShowPlanBenefitsModal(false);
        }, 2000);
      } else {
        setFastpayError(data.error || 'Erro ao enviar comprovativo.');
      }
    } catch (err) {
      setFastpayError('Erro de conexão ao enviar.');
    }
  }

  async function handleWithdrawSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingWithdraw(true);
    setModalError(null);
    setModalSuccess(null);

    // Validate that the payout settings are configured
    const hasDetails = profile?.payoutInfo && (
      (profile.payoutMethod === 'paypal' && profile.payoutInfo.email) ||
      (profile.payoutMethod === 'iban' && profile.payoutInfo.iban)
    );

    if (!hasDetails) {
      setModalError('Por favor, configure seus dados de destino em "Configurar Carteira" antes de solicitar um saque.');
      setSubmittingWithdraw(false);
      return;
    }

    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 20) {
      setModalError('O valor mínimo de saque é R$ 20.00 / $ 20.00 / 20.000 Kz.');
      setSubmittingWithdraw(false);
      return;
    }

    if (amountNum > (Number(balance?.available_balance) || 0)) {
      setModalError('Saldo disponível insuficiente.');
      setSubmittingWithdraw(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();

      if (data.success) {
        setModalSuccess('Saque solicitado com sucesso!');
        setWithdrawAmount('');
        // Reload data to reflect new balances & ledger debits
        await loadDashboardData();
        setTimeout(() => setShowWithdrawModal(false), 2000);
      } else {
        setModalError(data.error || 'Erro ao solicitar saque.');
      }
    } catch (err) {
      setModalError('Erro de conexão.');
    } finally {
      setSubmittingWithdraw(false);
    }
  }

  // AOA Withdrawal Handler
  async function handleWithdrawAoaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingWithdrawAoa(true);
    setAoaModalError(null);
    setAoaModalSuccess(null);

    const minSaque = Number(settings['MINIMO_SAQUE_AOA'] || '20000');
    const amountNum = Number(withdrawAoaAmount);

    if (isNaN(amountNum) || amountNum < minSaque) {
      setAoaModalError(`O valor mínimo de saque AOA é Kz ${minSaque.toLocaleString('pt-AO')}.`);
      setSubmittingWithdrawAoa(false);
      return;
    }

    if (amountNum > (Number(balance?.available_balance_aoa) || 0)) {
      setAoaModalError('Saldo AOA disponível insuficiente.');
      setSubmittingWithdrawAoa(false);
      return;
    }

    if (withdrawAoaMethod === 'facipay_p2p' && !facipayAccount && !profile?.facipayAccount) {
      setAoaModalError('Configure o número da conta FaciPay em "Configurar Carteira" antes de usar este método.');
      setSubmittingWithdrawAoa(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/withdraw-aoa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ amount: amountNum, method: withdrawAoaMethod })
      });
      const data = await res.json();

      if (data.success) {
        setAoaModalSuccess('Saque AOA solicitado com sucesso!');
        setWithdrawAoaAmount('');
        await loadDashboardData();
        setTimeout(() => setShowWithdrawAoaModal(false), 2000);
      } else {
        setAoaModalError(data.error || 'Erro ao solicitar saque AOA.');
      }
    } catch (err) {
      setAoaModalError('Erro de conexão.');
    } finally {
      setSubmittingWithdrawAoa(false);
    }
  }

  const openWalletModal = () => {
    setTempPayoutMethod(profile?.payoutMethod || 'paypal');
    setPaypalEmail(profile?.payoutInfo?.email || '');
    setBankName(profile?.payoutInfo?.bankName || '');
    setBankHolder(profile?.payoutInfo?.bankHolder || '');
    setIban(profile?.payoutInfo?.iban || '');
    setFacipayAccount(profile?.facipayAccount || '');
    setWalletError(null);
    setWalletSuccess(null);
    setShowWalletModal(true);
  };

  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingWallet(true);
    setWalletError(null);
    setWalletSuccess(null);

    const payoutInfo: any = {};
    if (tempPayoutMethod === 'paypal') {
      if (!paypalEmail.trim()) {
        setWalletError('O e-mail do PayPal é obrigatório.');
        setSavingWallet(false);
        return;
      }
      payoutInfo.email = paypalEmail.trim();
    } else {
      if (!bankName.trim() || !bankHolder.trim() || !iban.trim()) {
        setWalletError('Banco, Titular da Conta e IBAN são obrigatórios.');
        setSavingWallet(false);
        return;
      }
      payoutInfo.bankName = bankName.trim();
      payoutInfo.bankHolder = bankHolder.trim();
      payoutInfo.iban = iban.trim();
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payoutMethod: tempPayoutMethod,
          payoutInfo
        })
      });
      const data = await res.json();

      if (data.success) {
        // Also save FaciPay account if provided
        if (facipayAccount.trim()) {
          await fetch(`${BACKEND_URL}/api/collaborators/facipay-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ facipayAccount: facipayAccount.trim() })
          }).catch(() => {});
        }
        setWalletSuccess('Carteira salva com sucesso!');
        setProfile(data.profile);
        await loadDashboardData();
        setTimeout(() => setShowWalletModal(false), 1500);
      } else {
        setWalletError(data.error || 'Erro ao salvar configurações de carteira.');
      }
    } catch (err) {
      setWalletError('Erro de conexão ao salvar.');
    } finally {
      setSavingWallet(false);
    }
  }

  const formatMoney = (val: number) => {
    // If payout method is IBAN, currency is likely AOA (Kwanza)
    const isAoa = profile?.payoutMethod === 'iban';
    const num = Number(val) || 0;
    if (isAoa) {
      return num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    }
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getLedgerStatusBadge = (status: string) => {
    switch (status) {
      case 'guarantee':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300"><ShieldCheck size={12} /> Garantia (D1-D3)</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300"><Clock size={12} /> Processando (D4-D6)</span>;
      case 'available':
        return <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300"><CheckCircle size={12} /> Disponível</span>;
      case 'pending':
        return <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">Aguardando</span>;
      case 'refunded':
        return <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Reembolsado</span>;
      case 'withdrawn':
        return <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">Sacado</span>;
      default:
        return <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">{status}</span>;
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">Concluído</span>;
      case 'pending':
        return <span className="rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">Aguardando</span>;
      case 'processing':
        return <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">Processando</span>;
      case 'rejected':
        return <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Recusado</span>;
      default:
        return <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-32 px-4 md:px-8 w-full min-h-screen page-wrapper">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant leading-[1.1] tracking-[-0.04em] flex flex-wrap items-center gap-3">
            Painel do Criador
            {profile?.plan === 'course_creator' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-400 font-display shadow-lg shadow-blue-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Membro Pro
              </span>
            )}
          </h1>
          <p className="mt-2 text-on-surface-variant font-sans text-sm sm:text-base">
            Olá, {profile?.displayName}! Gerencie seu saldo e acompanhe seu extrato.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowPlanBenefitsModal(true)}
            className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 font-semibold text-white hover:bg-primary/20 transition-all text-sm shadow-[0_0_15px_rgba(192,193,255,0.1)]"
          >
            <Award size={18} className="text-primary animate-pulse" />
            Benefícios do Plano Premium
          </button>
          <button
            onClick={openWalletModal}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-on-surface hover:bg-white/10 transition-all text-sm"
          >
            <Landmark size={18} className="text-primary" />
            Configurar Carteira
          </button>
          <button
            onClick={onGoToProducts}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-on-surface hover:bg-white/10 transition-all text-sm"
          >
            <FileText size={18} className="text-primary" />
            Meus Produtos
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={(Number(balance?.available_balance) || 0) < 50}
            title={(Number(balance?.available_balance) || 0) < 50 ? 'Saldo mínimo de $50.00 necessário para sacar' : 'Solicitar saque'}
            className="flex items-center gap-2 rounded-full bg-on-surface px-5 py-2.5 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusCircle size={18} />
            Solicitar Saque
          </button>
        </div>
      </div>

      {/* Plan Expiration & Grace Period Alerts */}
      {(() => {
        if (!profile || profile.plan !== 'course_creator' || !profile.planExpiresAt) return null;
        
        const now = new Date();
        const expiresAt = new Date(profile.planExpiresAt);
        const daysDiff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 0) {
          // Grace period check: 2 days threshold
          const graceThreshold = new Date(expiresAt.getTime() + 2 * 24 * 60 * 60 * 1000);
          if (now <= graceThreshold) {
            return (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 items-start animate-pulse">
                <AlertCircle className="text-red-400 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Período de Tolerância Ativo (Expiração Crítica)</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Sua assinatura do plano <strong>Course Creator</strong> via {profile.upgradeMethod === 'fastpay' ? 'FastPay' : 'Stripe'} expirou em {expiresAt.toLocaleDateString()}. 
                    Você tem um prazo limite de tolerância de até 2 dias para regularizar seu pagamento. 
                    Se não realizar a renovação hoje, seus cursos e hospedagens de vídeos serão desativados.
                  </p>
                </div>
              </div>
            );
          } else {
            return (
              <div className="mb-6 rounded-xl border border-red-600 bg-red-950/40 p-4 flex gap-3 items-start">
                <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Plano Expirado - Cursos Desativados</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Sua assinatura expirou e o período de tolerância encerrou. Seus cursos foram marcados como inativos. 
                    Realize o pagamento de renovação para reativar todos os seus conteúdos imediatamente.
                  </p>
                </div>
              </div>
            );
          }
        } else if (daysDiff <= 5) {
          return (
            <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex gap-3 items-start">
              <AlertCircle className="text-yellow-400 w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Sua Assinatura Expira em {daysDiff} {daysDiff === 1 ? 'dia' : 'dias'}</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Lembrete: Como seu plano foi ativado via {profile.upgradeMethod === 'fastpay' ? 'FastPay (Manual)' : 'Stripe'}, certifique-se de regularizar a renovação antes de {expiresAt.toLocaleDateString()} para que não ocorra a suspensão de uploads de vídeos dos seus produtos.
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Currency Filter Toggle */}
      <div className="mb-6 flex items-center gap-1 p-1 bg-surface-high rounded-full w-fit border border-white/10">
        <button
          onClick={() => setWalletView('usd')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            walletView === 'usd'
              ? 'bg-primary text-background shadow-[0_0_15px_rgba(192,193,255,0.2)]'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <DollarSign size={14} /> USD · Stripe
        </button>
        <button
          onClick={() => setWalletView('aoa')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            walletView === 'aoa'
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <Landmark size={12} /> AOA · FaciPay
        </button>
        <button
          onClick={() => setWalletView('affiliates')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            walletView === 'affiliates'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.2)]'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <Users size={14} /> Meus Afiliados
        </button>
        <button
          onClick={() => { setWalletView('founder'); loadFounderStats(); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            walletView === 'founder'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.25)]'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <Award size={14} /> Membro Fundador
        </button>
      </div>

      {/* ====== USD WALLET VIEW ====== */}
      {walletView === 'usd' && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-primary" />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ecossistema USD · Stripe</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 relative z-10">
              {/* Estado 1: Em Garantia (D1-D3) */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-amber-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">Dias 1-3</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Em Garantia</span>
                <span className="block text-xl font-bold text-white font-mono">
                  {(Number(balance?.guarantee_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Período de reembolso do cliente. Fundos bloqueados por segurança.</p>
              </div>

              {/* Estado 2: Em Processamento (D4-D6) */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-blue-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">Dias 4-6</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Em Processamento</span>
                <span className="block text-xl font-bold text-white font-mono">
                  {(Number(balance?.processing_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Aguardando liquidação Stripe. Liberado em breve.</p>
              </div>

              {/* Estado 3: Disponível para Saque */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-green-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">Dia 7+</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Disponível para Saque</span>
                <span className="block text-xl font-bold text-white font-mono">
                  {(Number(balance?.available_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                  {(Number(balance?.available_balance) || 0) >= 50
                    ? '✓ Saldo suficiente para saque (mín. $50.00)'
                    : `Mínimo $50.00 para sacar. Faltam $${Math.max(0, 50 - (Number(balance?.available_balance) || 0)).toFixed(2)}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Cards Resumo USD */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 relative z-10">
            <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/15">
                  <TrendingUp size={18} />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Histórico</span>
              </div>
              <span className="block text-sm font-medium text-on-surface-variant">Total Acumulado (USD)</span>
              <span className="block text-xl font-bold text-white font-mono mt-1">
                {(Number(balance?.accumulated_earnings) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary/10 text-tertiary border border-tertiary/15">
                  {profile?.payoutMethod === 'paypal' ? <Mail size={18} /> : <Landmark size={18} />}
                </div>
                <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">Pago</span>
              </div>
              <span className="block text-sm font-medium text-on-surface-variant">Total Sacado (USD)</span>
              <span className="block text-xl font-bold text-white font-mono mt-1">
                {(Number(balance?.withdrawn_amount) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ====== AOA WALLET VIEW ====== */}
      {walletView === 'aoa' && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏦</span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ecossistema AOA · FaciPay (Kwanza)</span>
              </div>
              <button
                onClick={() => {
                  setAoaModalError(null);
                  setAoaModalSuccess(null);
                  setWithdrawAoaAmount('');
                  setWithdrawAoaMethod('iban_aoa');
                  setShowWithdrawAoaModal(true);
                }}
                disabled={(Number(balance?.available_balance_aoa) || 0) < Number(settings['MINIMO_SAQUE_AOA'] || '20000')}
                title={(Number(balance?.available_balance_aoa) || 0) < Number(settings['MINIMO_SAQUE_AOA'] || '20000')
                  ? `Saldo mínimo de Kz ${Number(settings['MINIMO_SAQUE_AOA'] || '20000').toLocaleString('pt-AO')} necessário`
                  : 'Solicitar saque AOA'
                }
                className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 font-bold text-black text-xs hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlusCircle size={14} /> Solicitar Saque AOA
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 relative z-10">
              {/* AOA Estado 1: Em Garantia */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-amber-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">Dias 1-3</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Em Garantia (AOA)</span>
                <span className="block text-xl font-bold text-white font-mono">
                  Kz {(Number(balance?.guarantee_balance_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Período de reembolso. Fundos bloqueados por segurança.</p>
              </div>

              {/* AOA Estado 2: Em Processamento */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-blue-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">Dias 4-6</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Em Processamento (AOA)</span>
                <span className="block text-xl font-bold text-white font-mono">
                  Kz {(Number(balance?.processing_balance_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Aguardando liquidação FaciPay.</p>
              </div>

              {/* AOA Estado 3: Disponível */}
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-green-500/15">
                <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">Dia 7+</span>
                </div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1">Disponível para Saque (AOA)</span>
                <span className="block text-xl font-bold text-white font-mono">
                  Kz {(Number(balance?.available_balance_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                  {(Number(balance?.available_balance_aoa) || 0) >= Number(settings['MINIMO_SAQUE_AOA'] || '20000')
                    ? `✓ Saldo suficiente para saque (mín. Kz ${Number(settings['MINIMO_SAQUE_AOA'] || '20000').toLocaleString('pt-AO')})`
                    : `Mínimo Kz ${Number(settings['MINIMO_SAQUE_AOA'] || '20000').toLocaleString('pt-AO')} para sacar.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Cards Resumo AOA */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 relative z-10">
            <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">
                  <TrendingUp size={18} />
                </div>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Histórico</span>
              </div>
              <span className="block text-sm font-medium text-on-surface-variant">Total Acumulado (AOA)</span>
              <span className="block text-xl font-bold text-white font-mono mt-1">
                Kz {(Number(balance?.accumulated_earnings_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">
                  <Landmark size={18} />
                </div>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Pago</span>
              </div>
              <span className="block text-sm font-medium text-on-surface-variant">Total Sacado (AOA)</span>
              <span className="block text-xl font-bold text-white font-mono mt-1">
                Kz {(Number(balance?.withdrawn_amount_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ====== MEUS AFILIADOS VIEW ====== */}
      {walletView === 'affiliates' && (
        <CollaboratorAffiliatesPanel affiliates={affiliates} />
      )}

      {/* ====== MEMBRO FUNDADOR VIEW ====== */}
      {walletView === 'founder' && (
        <div className="w-full">
          {founderLoading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant">
              <RefreshCw size={20} className="animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header explainer */}
              <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <Award size={22} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Programa Membro Fundador</h3>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                      Convide novos criadores de conteúdo para a plataforma. Quando eles fizerem vendas, você ganha
                      <span className="text-yellow-400 font-bold"> 1% do valor bruto </span>
                      diretamente no seu saldo disponível — sem tocar na margem deles.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                        <CheckCircle size={10} /> Crédito imediato no saldo disponível
                      </span>
                      <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                        <DollarSign size={10} /> Sai da margem da CodeEngine
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite Link */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Seu Link de Convite</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-surface-high rounded-xl px-4 py-3 border border-white/10 font-mono text-xs text-on-surface-variant overflow-hidden">
                    <ExternalLink size={13} className="text-yellow-400 flex-shrink-0" />
                    <span className="truncate">
                      {founderStats?.authUserId
                        ? `${window.location.origin}/?invite=${founderStats.authUserId}`
                        : 'Carregando...'}
                    </span>
                  </div>
                  <button
                    onClick={copyInviteLink}
                    disabled={!founderStats?.authUserId}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                      inviteLinkCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90'
                    }`}
                  >
                    {inviteLinkCopied ? <CheckCircle size={15} /> : <ChevronRight size={15} />}
                    {inviteLinkCopied ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  Partilhe este link com criadores de conteúdo. Quando se registarem através dele e obtiverem aprovação como colaboradores, você começa a ganhar automaticamente.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-white font-mono">{founderStats?.totalInvited ?? 0}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Membros Convidados</div>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-white font-mono">{founderStats?.totalInvitedCollaborators ?? 0}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Viraram Colaboradores</div>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {(founderStats?.totalEarnedUsd || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">Ganho como Fundador (USD)</div>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-amber-500/20 text-center">
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {(founderStats?.totalEarnedAoa || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">Ganho como Fundador (AOA)</div>
                </div>
              </div>

              {/* Recent founder commissions */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Comissões Recentes de Fundador</h4>
                {!founderStats?.recentCommissions?.length ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    Nenhuma comissão de fundador recebida ainda. Convide colaboradores para começar!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-on-surface-variant font-semibold border-b border-white/10">
                          <th className="pb-3 text-xs uppercase tracking-wider">Data</th>
                          <th className="pb-3 text-xs uppercase tracking-wider">Descrição</th>
                          <th className="pb-3 text-xs uppercase tracking-wider text-right">Valor</th>
                          <th className="pb-3 text-xs uppercase tracking-wider text-right">Moeda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {founderStats.recentCommissions.map((item: any) => (
                          <tr key={item.id} className="text-on-surface">
                            <td className="py-3 text-on-surface-variant text-xs font-mono">
                              {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 text-white text-sm">{item.description}</td>
                            <td className="py-3 text-right font-mono font-semibold text-yellow-400">
                              +{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                item.currency === 'USD'
                                  ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              }`}>
                                {item.currency}
                              </span>
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
      )}

      {/* Main Grid: Extrato e Solicitações */}
      {walletView !== 'affiliates' && walletView !== 'founder' && (
        <div className="grid gap-6 lg:grid-cols-3 relative z-10">
        {/* Ledger Extrato */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="mb-6 text-lg font-bold text-white font-display">Extrato Contábil Recente</h3>
          {ledger.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant text-sm font-sans">Nenhum lançamento contábil registrado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-on-surface-variant font-semibold border-b border-white/10">
                    <th className="pb-3 text-xs uppercase tracking-wider">Data</th>
                    <th className="pb-3 text-xs uppercase tracking-wider">Descrição</th>
                    <th className="pb-3 text-xs uppercase tracking-wider">Tipo</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-right">Valor</th>
                    <th className="pb-3 text-xs uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledger.map((item) => (
                    <tr key={item.id} className="text-on-surface">
                      <td className="py-4 text-on-surface-variant text-xs font-mono">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 font-medium text-white">{item.description}</td>
                      <td className="py-4">
                        {item.type === 'credit' ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                            <ArrowUpRight size={14} /> Entrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                            <ArrowDownRight size={14} /> Saída
                          </span>
                        )}
                      </td>
                      <td className={`py-4 text-right font-mono font-semibold ${item.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {item.type === 'credit' ? '+' : '-'}{formatMoney(item.amount)}
                      </td>
                      <td className="py-4 text-right">
                        {getLedgerStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fila de Retiradas */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="mb-6 text-lg font-bold text-white font-display">Solicitações de Saque</h3>
          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant text-sm font-sans">Nenhuma solicitação de saque enviada.</div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white font-mono">{formatMoney(w.amount)}</span>
                    {getWithdrawalStatusBadge(w.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1 font-sans">
                    <span>Método: {String(w.payout_method_details?.method || '').toUpperCase()}</span>
                    <span className="font-mono">{new Date(w.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {w.status === 'completed' && w.receipt_url && (
                    <a
                      href={w.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      Ver Comprovante de Payout <ExternalLink size={12} />
                    </a>
                  )}
                  {w.status === 'rejected' && w.rejection_reason && (
                    <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-300">
                      <strong>Rejeitado:</strong> {w.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modal: Solicitar Saque */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl overlay-premium"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-display">Solicitar Saque USD</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setModalError(null);
                  setModalSuccess(null);
                }}
                className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>

            {modalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                <CheckCircle size={16} />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Saldo Disponível para Saque</label>
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {(Number(balance?.available_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Valor Bruto do Saque (USD)</label>
                <div className="relative rounded-xl border border-white/10 bg-surface-high">
                  <span className="absolute left-4 top-3.5 text-on-surface-variant text-sm font-bold font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="50"
                    required
                    placeholder="0.00"
                    value={withdrawAmount as any}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border-none pl-10 pr-4 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:ring-0 focus:border-none bg-transparent"
                  />
                </div>
                <span className="mt-1 block text-xs text-on-surface-variant">Mínimo: $50.00 USD.</span>
              </div>

              {/* Prévia de taxas em tempo real */}
              {withdrawAmount && Number(withdrawAmount) >= 50 && (() => {
                const gross = Number(withdrawAmount);
                const paypalFee = Number(settings?.PAYPAL_WITHDRAWAL_FEE_USD || '3.99');
                const swiftFee  = Number(settings?.TAXA_TRANSFERENCIA_INTERNACIONAL_USD || '25.00');
                const fee = profile?.payoutMethod === 'paypal' ? paypalFee : swiftFee;
                const net = Math.max(0, gross - fee);
                const feeLabel = profile?.payoutMethod === 'paypal'
                  ? `Taxa PayPal: -$${paypalFee.toFixed(2)}`
                  : `Taxa SWIFT (definida pelo admin): -$${swiftFee.toFixed(2)}`;

                return (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs space-y-2">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={12} className="text-primary" /> Resumo do Saque
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Valor bruto solicitado:</span>
                      <span className="font-mono font-semibold text-white">${gross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{feeLabel}</span>
                      <span className="font-mono font-semibold text-red-400">-${fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2">
                      <span className="font-bold text-white">Você receberá (estimativa):</span>
                      <span className="font-mono font-bold text-green-400">${net.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-on-surface-variant space-y-1">
                <div className="font-semibold text-white mb-1 uppercase tracking-wider">Dados de Destino:</div>
                {profile?.payoutMethod === 'paypal' ? (
                  <div>PayPal Email: <span className="font-medium text-white">{profile?.payoutInfo?.email}</span></div>
                ) : (
                  <>
                    <div>Banco: <span className="font-medium text-white">{profile?.payoutInfo?.bankName}</span></div>
                    <div>Titular: <span className="font-medium text-white">{profile?.payoutInfo?.bankHolder}</span></div>
                    <div>IBAN: <span className="font-medium text-white font-mono">{profile?.payoutInfo?.iban}</span></div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw || !withdrawAmount || Number(withdrawAmount) < 50}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-on-surface py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs"
              >
                {submittingWithdraw ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                ) : 'Confirmar Solicitação'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Solicitar Saque AOA */}
      {showWithdrawAoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Landmark size={18} className="text-amber-400" /> Solicitar Saque AOA
              </h3>
              <button
                onClick={() => { setShowWithdrawAoaModal(false); setAoaModalError(null); setAoaModalSuccess(null); }}
                className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>

            {aoaModalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                <CheckCircle size={16} /><span>{aoaModalSuccess}</span>
              </div>
            )}
            {aoaModalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                <AlertCircle size={16} /><span>{aoaModalError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawAoaSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Saldo Disponível AOA</label>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  Kz {(Number(balance?.available_balance_aoa) || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Método de Envio</label>
                <select
                  value={withdrawAoaMethod}
                  onChange={(e) => setWithdrawAoaMethod(e.target.value as any)}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                  <option value="iban_aoa">Conta Bancária (IBAN) — Taxa 1% + IVA</option>
                  <option value="facipay_p2p">Conta FaciPay (P2P) — Isento</option>
                  <option value="paypal_aoa">PayPal (Câmbio AOA→USD) — Taxa variável</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Valor do Saque (AOA)</label>
                <div className="relative rounded-xl border border-white/10 bg-surface-high">
                  <span className="absolute left-4 top-3.5 text-on-surface-variant text-sm font-bold font-mono">Kz</span>
                  <input
                    type="number"
                    step="1"
                    min={Number(settings['MINIMO_SAQUE_AOA'] || '20000')}
                    required
                    placeholder="0"
                    value={withdrawAoaAmount}
                    onChange={(e) => setWithdrawAoaAmount(e.target.value)}
                    className="w-full rounded-xl border-none pl-12 pr-4 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:ring-0 bg-transparent"
                  />
                </div>
                <span className="mt-1 block text-xs text-on-surface-variant">Mínimo: Kz {Number(settings['MINIMO_SAQUE_AOA'] || '20000').toLocaleString('pt-AO')}</span>
              </div>

              {/* Prévia de taxas AOA em tempo real */}
              {withdrawAoaAmount && Number(withdrawAoaAmount) >= Number(settings['MINIMO_SAQUE_AOA'] || '20000') && (() => {
                const gross = Number(withdrawAoaAmount);
                const ivaRate = Number(settings['TAXA_FACIPAY_IVA'] || '0.14');
                let fee = 0;
                let feeLabel = '';

                if (withdrawAoaMethod === 'iban_aoa') {
                  const ibanRate = Number(settings['TAXA_SAQUE_IBAN_AOA'] || '0.01');
                  fee = gross * ibanRate * (1 + ivaRate);
                  feeLabel = `Taxa IBAN (${(ibanRate*100).toFixed(0)}% + ${(ivaRate*100).toFixed(0)}% IVA)`;
                } else if (withdrawAoaMethod === 'facipay_p2p') {
                  fee = 0;
                  feeLabel = 'FaciPay P2P (Isento)';
                } else if (withdrawAoaMethod === 'paypal_aoa') {
                  const paypalRate = Number(settings['TAXA_CAMBIO_PAYPAL_AOA'] || '0.05');
                  fee = gross * paypalRate;
                  feeLabel = `Taxa Câmbio PayPal (${(paypalRate*100).toFixed(0)}%)`;
                }
                fee = Math.round(fee * 100) / 100;
                const net = Math.max(0, gross - fee);

                return (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs space-y-2">
                    <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={12} /> Resumo do Saque AOA
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Valor bruto solicitado:</span>
                      <span className="font-mono font-semibold text-white">Kz {gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{feeLabel}:</span>
                      <span className="font-mono font-semibold text-red-400">-Kz {fee.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-500/20 pt-2">
                      <span className="font-bold text-white">Você receberá (estimativa):</span>
                      <span className="font-mono font-bold text-green-400">Kz {net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={submittingWithdrawAoa || !withdrawAoaAmount || Number(withdrawAoaAmount) < Number(settings['MINIMO_SAQUE_AOA'] || '20000')}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-amber-500 py-3 font-bold text-black hover:bg-amber-400 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {submittingWithdrawAoa ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                ) : 'Confirmar Saque AOA'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Configurar Carteira */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl overlay-premium"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-display">Configurações de Carteira</h3>
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(false);
                  setWalletError(null);
                  setWalletSuccess(null);
                }}
                className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>

            {walletSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                <CheckCircle size={16} />
                <span>{walletSuccess}</span>
              </div>
            )}

            {walletError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                <AlertCircle size={16} />
                <span>{walletError}</span>
              </div>
            )}

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Método de Destino</label>
                <div className="grid grid-cols-2 gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setTempPayoutMethod('paypal')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                      tempPayoutMethod === 'paypal'
                        ? 'border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                        : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Mail size={16} />
                    PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempPayoutMethod('iban')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                      tempPayoutMethod === 'iban'
                        ? 'border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                        : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Landmark size={16} />
                    IBAN Bancário
                  </button>
                </div>
              </div>

              {tempPayoutMethod === 'paypal' ? (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">E-mail do PayPal</label>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@email.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Nome do Banco</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Banco de Fomento Angola (BFA)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Titular da Conta</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome completo do titular"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">IBAN</label>
                    <input
                      type="text"
                      required
                      placeholder="AO06.0000.0000.0000.0000.0"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* FaciPay Account (para saques AOA via P2P) */}
              <div className="mt-2 pt-4 border-t border-white/10">
                <label className="block text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={12} /> Conta FaciPay (Opcional — para saques AOA)
                </label>
                <input
                  type="text"
                  placeholder="Nº da conta FaciPay"
                  value={facipayAccount}
                  onChange={(e) => setFacipayAccount(e.target.value)}
                  className="w-full rounded-xl bg-surface-high border border-amber-500/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Se tiver conta FaciPay, pode sacar AOA via P2P sem taxas.</p>
              </div>

              <button
                type="submit"
                disabled={savingWallet}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-on-surface py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs mt-6"
              >
                {savingWallet ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                ) : 'Salvar Carteira'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Plan Benefits & Marketing Modal */}
      {showPlanBenefitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] -top-10 -right-10"></div>
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Award className="text-primary w-6 h-6" />
                <h3 className="font-display text-lg font-bold text-white">Programa Course Creator - CodeEngine</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanBenefitsModal(false)}
                className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-6 font-sans text-sm text-on-surface-variant overflow-y-auto max-h-[70vh] pr-2">
              <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
                <h4 className="text-white font-bold mb-1">Por que fazer o upgrade para o Course Creator?</h4>
                <p className="text-xs leading-relaxed">
                  O plano grátis (Ebook Creator) é excelente para iniciar com arquivos simples, mas os criadores profissionais necessitam de recursos avançados para reter seus alunos e construir cursos em vídeo profissionais com segurança.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Video className="text-primary w-4 h-4" />
                    <span>Hospedagem de Vídeos</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Hospede seus arquivos de vídeo diretamente na infraestrutura segura da CodeEngine. Esqueça links de terceiros e proteja suas aulas contra pirataria.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <CheckCircle className="text-primary w-4 h-4" />
                    <span>Taxas de Comissão Menores</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Colaboradores no plano premium desfrutam de taxas administrativas reduzidas em suas vendas na plataforma, maximizando seus lucros.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <TrendingUp className="text-primary w-4 h-4" />
                    <span>Destaque na Biblioteca</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Seus cursos ganham selo verificado e prioridade de busca na vitrine principal da CodeEngine para os membros da comunidade.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <ShieldCheck className="text-primary w-4 h-4" />
                    <span>Sem Limite de Upload</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Faça upload de arquivos maiores de até 2GB por curso ou e-book de forma segura e totalmente otimizada para download rápido.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-white/10 p-4 space-y-4 bg-black/20">
                <span className="block text-xs uppercase tracking-wider font-bold text-white text-center">Opções de Assinatura</span>
                
                {/* Stripe Card/USD Option */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Opção 1: Cartão de Crédito / Stripe</span>
                    <span className="text-sm font-bold text-primary font-mono">${settings.subscription_price_usd || '9.00'} USD/mês</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Cobrança recorrente automática. Liberação imediata.</p>
                  <button
                    type="button"
                    disabled={submittingStripe}
                    onClick={handleStripeUpgrade}
                    className="w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-white hover:bg-primary-high transition-colors uppercase tracking-wider"
                  >
                    {submittingStripe ? 'A iniciar...' : 'Pagar via Stripe'}
                  </button>
                  {stripeError && <p className="text-red-500 text-[11px] mt-1">{stripeError}</p>}
                </div>

                {/* FastPay/Local AOA Option */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Opção 2: FastPay / Pagamento em Angola</span>
                    <span className="text-sm font-bold text-primary font-mono">{(Number(settings.subscription_price_aoa) || 8000).toLocaleString('pt-AO')} Kz/mês</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Sem cobrança automática. Necessita de envio de comprovativo e aprovação do admin.</p>
                  
                  {profile?.upgradeStatus === 'pending_approval' ? (
                    <div className="bg-orange-500/20 text-orange-400 p-2.5 rounded-lg text-xs border border-orange-500/30 text-center">
                      ⏳ Seu comprovativo foi enviado e está em análise. O plano será liberado em breve!
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1 border-t border-white/5">
                      {profile?.upgradeStatus === 'rejected' && (
                        <div className="bg-red-500/20 text-red-400 p-2 rounded-lg text-xs border border-red-500/30 text-center font-semibold">
                          ❌ Seu comprovativo anterior foi rejeitado. Envie um comprovativo válido para reanálise.
                        </div>
                      )}
                      
                      <a
                        href={settings.fastpay_subscription_link || 'https://fastpay.co.ao/pay/codeengine-creator'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center rounded-lg bg-green-600 hover:bg-green-700 py-2 text-xs font-bold text-white transition-colors uppercase tracking-wider"
                      >
                        1. Pagar no FastPay (Abrir Link)
                      </a>
                      
                      <div className="space-y-1">
                        <label className="block text-[11px] text-gray-400">2. Faça o upload do Comprovativo:</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptUpload}
                          className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-high file:cursor-pointer"
                        />
                        {uploadingReceipt && <p className="text-primary text-[10px] animate-pulse">A carregar comprovativo...</p>}
                        {receiptUrl && <p className="text-green-500 text-[10px]">✅ Comprovativo carregado com sucesso!</p>}
                      </div>

                      <button
                        type="button"
                        disabled={!receiptUrl}
                        onClick={handleFastpaySubmit}
                        className="w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-white hover:bg-primary-high transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enviar Comprovativo para Aprovação
                      </button>
                      
                      {fastpaySuccess && <p className="text-green-500 text-xs text-center mt-1">{fastpaySuccess}</p>}
                      {fastpayError && <p className="text-red-500 text-xs text-center mt-1">{fastpayError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function CollaboratorAffiliatesPanel({ affiliates }: { affiliates: any[] }) {
  const [search, setSearch] = useState('');

  // Filter
  const filtered = affiliates.filter(aff => 
    aff.product_title?.toLowerCase().includes(search.toLowerCase()) ||
    aff.affiliate_name?.toLowerCase().includes(search.toLowerCase()) ||
    aff.affiliate_email?.toLowerCase().includes(search.toLowerCase())
  );

  // Totals
  const totalAffiliates = affiliates.length;
  const totalClicks = affiliates.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalConversions = affiliates.reduce((sum, a) => sum + (a.totalConversions || 0), 0);
  const avgCR = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : '0.0';

  const totalSalesUSD = affiliates.reduce((sum, a) => sum + (a.salesUSD || 0), 0);
  const totalSalesAOA = affiliates.reduce((sum, a) => sum + (a.salesAOA || 0), 0);
  const totalCommUSD = affiliates.reduce((sum, a) => sum + (a.commissionUSD || 0), 0);
  const totalCommAOA = affiliates.reduce((sum, a) => sum + (a.commissionAOA || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4 relative z-10">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-purple-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">Afiliados</span>
          </div>
          <span className="block text-xs font-semibold text-on-surface-variant mb-1">Afiliados Ativos</span>
          <span className="block text-xl font-bold text-white font-mono">{totalAffiliates}</span>
          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Membros que criaram links para seus produtos.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-blue-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">Desempenho</span>
          </div>
          <span className="block text-xs font-semibold text-on-surface-variant mb-1">Cliques / Vendas</span>
          <span className="block text-xl font-bold text-white font-mono">
            {totalClicks} <span className="text-xs text-on-surface-variant">/</span> {totalConversions}
          </span>
          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Conversão Média: <strong className="text-blue-400 font-mono">{avgCR}%</strong></p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-green-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">Volume</span>
          </div>
          <span className="block text-xs font-semibold text-on-surface-variant mb-1">Vendas Geradas</span>
          <div className="space-y-0.5 font-mono">
            <span className="block text-sm font-bold text-white">${totalSalesUSD.toFixed(2)}</span>
            <span className="block text-xs font-semibold text-green-400">Kz {totalSalesAOA.toLocaleString('pt-AO')}</span>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Faturamento bruto total gerado por terceiros.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-amber-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent size={18} />
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">Comissões</span>
          </div>
          <span className="block text-xs font-semibold text-on-surface-variant mb-1">Comissões de Afiliados</span>
          <div className="space-y-0.5 font-mono">
            <span className="block text-sm font-bold text-white">${totalCommUSD.toFixed(2)}</span>
            <span className="block text-xs font-semibold text-amber-400">Kz {totalCommAOA.toLocaleString('pt-AO')}</span>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Repasses gerados aos seus afiliados.</p>
        </div>
      </div>

      {/* List Table */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white font-display">Afiliados dos Meus Produtos</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Veja quem está a vender seus produtos e o desempenho individual.</p>
          </div>
          
          <div className="relative w-full md:max-w-xs">
            <Search size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar por produto ou afiliado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-high border border-white/10 text-xs font-semibold text-white placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all bg-transparent"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant text-sm font-sans">
            Nenhum afiliado encontrado. Certifique-se de habilitar o programa de afiliados nas configurações do seu produto!
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-on-surface-variant font-semibold border-b border-white/10">
                  <th className="pb-3 text-xs uppercase tracking-wider">Produto</th>
                  <th className="pb-3 text-xs uppercase tracking-wider">Afiliado</th>
                  <th className="pb-3 text-xs uppercase tracking-wider">Cliques / Vendas</th>
                  <th className="pb-3 text-xs uppercase tracking-wider">Taxa CR %</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-right">Volume Vendido</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-right">Comissão Afiliado</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-right">Data Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => {
                  const cr = item.clicks > 0 ? (item.totalConversions / item.clicks * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-all duration-150">
                      <td className="py-4 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                        <span className="line-clamp-1">{item.product_title}</span>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-white text-xs">{item.affiliate_name}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{item.affiliate_email}</div>
                      </td>
                      <td className="py-4 text-xs font-mono font-semibold text-on-surface-variant">
                        {item.clicks} clicks <span className="text-[10px] text-white/20">/</span> <span className="text-white">{item.totalConversions} vendas</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          Number(cr) >= 5 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          Number(cr) > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-white/5 text-on-surface-variant'
                        }`}>
                          {cr}%
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="font-mono font-bold text-xs text-white">
                          {item.salesUSD > 0 && `$${item.salesUSD.toFixed(2)}`}
                        </div>
                        <div className="font-mono font-semibold text-[10px] text-green-400 mt-0.5">
                          {item.salesAOA > 0 && `Kz ${item.salesAOA.toLocaleString('pt-AO')}`}
                        </div>
                        {item.salesUSD === 0 && item.salesAOA === 0 && (
                          <span className="text-[10px] text-on-surface-variant font-mono">-</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="font-mono font-bold text-xs text-purple-300">
                          {item.commissionUSD > 0 && `$${item.commissionUSD.toFixed(2)}`}
                        </div>
                        <div className="font-mono font-semibold text-[10px] text-amber-400 mt-0.5">
                          {item.commissionAOA > 0 && `Kz ${item.commissionAOA.toLocaleString('pt-AO')}`}
                        </div>
                        {item.commissionUSD === 0 && item.commissionAOA === 0 && (
                          <span className="text-[10px] text-on-surface-variant font-mono">-</span>
                        )}
                      </td>
                      <td className="py-4 text-right text-xs text-on-surface-variant font-mono">
                        {new Date(item.created_at).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
