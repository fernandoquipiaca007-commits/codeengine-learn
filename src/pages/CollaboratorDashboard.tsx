import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, 
  DollarSign, Landmark, Mail, PlusCircle, AlertCircle, RefreshCw, ChevronRight, FileText, ExternalLink 
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Painel do Criador</h1>
          <p className="mt-1 text-gray-500">Olá, {profile?.displayName}! Gerencie seu saldo e acompanhe seu extrato.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openWalletModal}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all text-sm"
          >
            <Landmark size={18} />
            Configurar Carteira
          </button>
          <button
            onClick={onGoToProducts}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all text-sm"
          >
            <FileText size={18} />
            Meus Produtos
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={(Number(balance?.available_balance) || 0) < 20}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all text-sm disabled:opacity-50"
          >
            <PlusCircle size={18} />
            Solicitar Saque
          </button>
        </div>
      </div>

      {/* Cards de Saldo */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Disponível */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Liberado</span>
          </div>
          <span className="block text-sm font-medium text-gray-500">Saldo Disponível</span>
          <span className="block mt-1 text-2xl font-bold text-gray-950 font-display">
            {formatMoney(balance?.available_balance)}
          </span>
        </div>

        {/* Card 2: Pendente */}
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <Clock size={20} />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Carência</span>
          </div>
          <span className="block text-sm font-medium text-gray-500">Saldo Pendente</span>
          <span className="block mt-1 text-2xl font-bold text-gray-950 font-display">
            {formatMoney(balance?.pending_balance)}
          </span>
        </div>

        {/* Card 3: Acumulado Histórico */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Histórico</span>
          </div>
          <span className="block text-sm font-medium text-gray-500">Total Acumulado</span>
          <span className="block mt-1 text-2xl font-bold text-gray-950 font-display">
            {formatMoney(balance?.accumulated_earnings)}
          </span>
        </div>

        {/* Card 4: Já Sacado */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              {profile?.payoutMethod === 'paypal' ? <Mail size={20} /> : <Landmark size={20} />}
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Pago</span>
          </div>
          <span className="block text-sm font-medium text-gray-500">Total Sacado</span>
          <span className="block mt-1 text-2xl font-bold text-gray-950 font-display">
            {formatMoney(balance?.withdrawn_amount)}
          </span>
        </div>
      </div>

      {/* Main Grid: Extrato e Solicitações */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ledger Extrato */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900 font-display">Extrato Contábil Recente</h3>
          {ledger.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Nenhum lançamento contábil registrado ainda.</div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 font-medium">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.map((item) => (
                    <tr key={item.id} className="text-gray-700">
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 font-medium text-gray-900">{item.description}</td>
                      <td className="py-3">
                        {item.type === 'credit' ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <ArrowUpRight size={14} /> Entrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-semibold">
                            <ArrowDownRight size={14} /> Saída
                          </span>
                        )}
                      </td>
                      <td className={`py-3 text-right font-semibold ${item.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'credit' ? '+' : '-'}{formatMoney(item.amount)}
                      </td>
                      <td className="py-3 text-right">
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
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900 font-display">Solicitações de Saque</h3>
          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Nenhuma solicitação de saque enviada.</div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{formatMoney(w.amount)}</span>
                    {getWithdrawalStatusBadge(w.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Método: {String(w.payout_method_details?.method || '').toUpperCase()}</span>
                    <span>{new Date(w.created_at).toLocaleDateString('pt-BR')}</span>
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
                    <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 font-display">Solicitar Saque</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setModalError(null);
                  setModalSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Fechar
              </button>
            </div>

            {modalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle size={16} />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Saldo Disponível para Saque</label>
                <div className="text-xl font-bold text-green-600">{formatMoney(balance?.available_balance)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Saque</label>
                <div className="relative rounded-xl border border-gray-200">
                  <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-bold">
                    {profile?.payoutMethod === 'iban' ? 'Kz' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawAmount as any}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border-none pl-9 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-0"
                  />
                </div>
                <span className="mt-1 block text-xs text-gray-400">
                  Limite mínimo de resgate: {profile?.payoutMethod === 'iban' ? '20.000 Kz' : '$20.00'}.
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500 space-y-1">
                <div className="font-semibold text-gray-700 mb-1">Dados de Destino:</div>
                {profile?.payoutMethod === 'paypal' ? (
                  <div>PayPal Email: <span className="font-medium text-gray-900">{profile?.payoutInfo?.email}</span></div>
                ) : (
                  <>
                    <div>Banco: <span className="font-medium text-gray-900">{profile?.payoutInfo?.bankName}</span></div>
                    <div>Titular: <span className="font-medium text-gray-900">{profile?.payoutInfo?.bankHolder}</span></div>
                    <div>IBAN: <span className="font-medium text-gray-900">{profile?.payoutInfo?.iban}</span></div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw || !withdrawAmount}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all text-sm disabled:opacity-50"
              >
                {submittingWithdraw ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : 'Confirmar Solicitação'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Configurar Carteira */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 font-display">Configurações de Carteira</h3>
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(false);
                  setWalletError(null);
                  setWalletSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Fechar
              </button>
            </div>

            {walletSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle size={16} />
                <span>{walletSuccess}</span>
              </div>
            )}

            {walletError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{walletError}</span>
              </div>
            )}

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Destino</label>
                <div className="grid grid-cols-2 gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setTempPayoutMethod('paypal')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                      tempPayoutMethod === 'paypal'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Landmark size={16} />
                    IBAN Bancário
                  </button>
                </div>
              </div>

              {tempPayoutMethod === 'paypal' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do PayPal</label>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@email.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Banco de Fomento Angola (BFA)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titular da Conta</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome completo do titular"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      required
                      placeholder="AO06.0000.0000.0000.0000.0"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingWallet}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all text-sm disabled:opacity-50 font-sans"
              >
                {savingWallet ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : 'Salvar Carteira'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
