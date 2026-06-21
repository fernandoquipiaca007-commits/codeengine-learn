import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, 
  DollarSign, Landmark, Mail, PlusCircle, AlertCircle, RefreshCw, ChevronRight, FileText, ExternalLink, Award, ShieldCheck, Video, PlayCircle
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
}

export function CollaboratorDashboard({ setScreen, onGoToProducts }: CollaboratorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  // Withdrawal Request Modal / State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Wallet Settings Modal / State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tempPayoutMethod, setTempPayoutMethod] = useState<'paypal' | 'iban'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [iban, setIban] = useState('');
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

  const openWalletModal = () => {
    setTempPayoutMethod(profile?.payoutMethod || 'paypal');
    setPaypalEmail(profile?.payoutInfo?.email || '');
    setBankName(profile?.payoutInfo?.bankName || '');
    setBankHolder(profile?.payoutInfo?.bankHolder || '');
    setIban(profile?.payoutInfo?.iban || '');
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
        setWalletSuccess('Carteira salva com sucesso!');
        setProfile(data.profile);
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
      case 'available':
        return <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Disponível</span>;
      case 'pending':
        return <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">Carência (D+7)</span>;
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
    <div className="pt-28 pb-32 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen page-wrapper">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant leading-[1.1] tracking-[-0.04em]">
            Painel do Criador
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
            disabled={(Number(balance?.available_balance) || 0) < 20}
            className="flex items-center gap-2 rounded-full bg-on-surface px-5 py-2.5 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] disabled:opacity-50"
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

      {/* Cards de Saldo */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {/* Card 1: Disponível */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Liberado</span>
          </div>
          <span className="block text-sm font-medium text-on-surface-variant">Saldo Disponível</span>
          <div className="mt-2 space-y-1">
            <span className="block text-xl font-bold text-white font-mono">
              {(Number(balance?.available_balance_aoa) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            <span className="block text-sm text-primary font-bold font-mono">
              {(Number(balance?.available_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>

        {/* Card 2: Pendente */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/15">
              <Clock size={20} />
            </div>
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Carência</span>
          </div>
          <span className="block text-sm font-medium text-on-surface-variant">Saldo Pendente</span>
          <div className="mt-2 space-y-1">
            <span className="block text-xl font-bold text-white font-mono">
              {(Number(balance?.pending_balance_aoa) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            <span className="block text-sm text-primary font-bold font-mono">
              {(Number(balance?.pending_balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>

        {/* Card 3: Acumulado Histórico */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/15">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Histórico</span>
          </div>
          <span className="block text-sm font-medium text-on-surface-variant">Total Acumulado</span>
          <div className="mt-2 space-y-1">
            <span className="block text-xl font-bold text-white font-mono">
              {(Number(balance?.accumulated_earnings_aoa) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            <span className="block text-sm text-primary font-bold font-mono">
              {(Number(balance?.accumulated_earnings) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>

        {/* Card 4: Já Sacado */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary/10 text-tertiary border border-tertiary/15">
              {profile?.payoutMethod === 'paypal' ? <Mail size={20} /> : <Landmark size={20} />}
            </div>
            <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">Pago</span>
          </div>
          <span className="block text-sm font-medium text-on-surface-variant">Total Sacado</span>
          <div className="mt-2 space-y-1">
            <span className="block text-xl font-bold text-white font-mono">
              {(Number(balance?.withdrawn_amount_aoa) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
            <span className="block text-sm text-primary font-bold font-mono">
              {(Number(balance?.withdrawn_amount) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Extrato e Solicitações */}
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

      {/* Modal: Solicitar Saque */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl overlay-premium"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-display">Solicitar Saque</h3>
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
                <div className="text-2xl font-bold text-green-400 font-mono">{formatMoney(balance?.available_balance)}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Valor do Saque</label>
                <div className="relative rounded-xl border border-white/10 bg-surface-high">
                  <span className="absolute left-4 top-3.5 text-on-surface-variant text-sm font-bold font-mono">
                    {profile?.payoutMethod === 'iban' ? 'Kz' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawAmount as any}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border-none pl-10 pr-4 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:ring-0 focus:border-none bg-transparent"
                  />
                </div>
                <span className="mt-1 block text-xs text-on-surface-variant">
                  Limite mínimo de resgate: {profile?.payoutMethod === 'iban' ? '20.000 Kz' : '$20.00'}.
                </span>
              </div>

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
                disabled={submittingWithdraw || !withdrawAmount}
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
