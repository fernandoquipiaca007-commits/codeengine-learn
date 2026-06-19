import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Clock, Save, FileText, Video, Terminal, Calendar, ArrowRight, ShieldCheck, Mail, Landmark } from 'lucide-react';

interface CollaboratorApplyProps {
  setScreen: (screen: string) => void;
  onCandidacyApproved: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function CollaboratorApply({ setScreen, onCandidacyApproved }: CollaboratorApplyProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidacyStatus, setCandidacyStatus] = useState<'not_applied' | 'pending' | 'approved' | 'rejected'>('not_applied');
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'iban'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankIban, setBankIban] = useState('');

  // Onboarding survey states
  const [surveyTypes, setSurveyTypes] = useState<string[]>([]);
  const [surveyVolume, setSurveyVolume] = useState('less_1gb');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCandidacyStatus();
  }, []);

  async function fetchCandidacyStatus() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/collaborators/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setCandidacyStatus(data.status);
        if (data.status === 'approved') {
          onCandidacyApproved();
        } else if (data.status === 'rejected') {
          setRejectReason(data.rejectReason || 'Sua candidatura não atendeu aos critérios da plataforma.');
        }
      }
    } catch (err) {
      console.error('Error fetching candidacy status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScreen('auth');
        return;
      }

      const payoutInfo = payoutMethod === 'paypal' 
        ? { email: paypalEmail }
        : { bankName, bankHolder, iban: bankIban };

      const survey = {
        contentTypes: surveyTypes,
        estimatedVolume: surveyVolume
      };

      const res = await fetch(`${BACKEND_URL}/api/collaborators/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          displayName,
          bio,
          specialty,
          payoutMethod,
          payoutInfo,
          survey
        })
      });

      const data = await res.json();
      if (data.success) {
        setCandidacyStatus('pending');
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao enviar candidatura.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  }

  const toggleContentType = (type: string) => {
    setSurveyTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (candidacyStatus === 'pending') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 font-display">Candidatura em Análise</h2>
          <p className="mb-6 text-gray-600">
            Recebemos seus dados profissionais e sua pesquisa estratégica de infraestrutura. 
            Nossa equipe administrativa está revisando sua solicitação para ativação do seu painel de criador.
          </p>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            Status: <span className="font-semibold text-blue-600">Aguardando Aprovação</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (candidacyStatus === 'rejected') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 font-display">Candidatura Recusada</h2>
          <p className="mb-4 text-red-600 text-sm bg-red-50 p-4 rounded-xl">
            <strong>Motivo:</strong> {rejectReason}
          </p>
          <p className="mb-6 text-gray-600 text-sm">
            Você pode corrigir suas informações ou ajustar sua proposta e enviar uma nova candidatura.
          </p>
          <button
            onClick={() => setCandidacyStatus('not_applied')}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all"
          >
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md"
      >
        <div className="mb-8 border-b border-gray-100 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Candidatar-se a Colaborador</h1>
          <p className="mt-2 text-gray-500">
            Publique seus e-books e cursos digitais no ecossistema da Codeengine
          </p>
        </div>

        {message && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados do Perfil */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 border-l-4 border-primary pl-2">1. Perfil Profissional</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição / Canal</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Professor João Silva ou DevAcademy"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Área de Especialização / Especialidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Programação Web, Design Gráfico, Marketing Digital"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minibiografia / Descrição</label>
                <textarea
                  placeholder="Conte um pouco sobre sua trajetória profissional e o conteúdo que deseja compartilhar."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Dados de Pagamento (PayPal / IBAN) */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 border-l-4 border-primary pl-2">2. Preferências de Repasse Financeiro</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Payout Preferido</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPayoutMethod('paypal')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  payoutMethod === 'paypal' 
                    ? 'border-primary bg-primary-light text-primary' 
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Mail size={18} />
                PayPal (Internacional)
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethod('iban')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  payoutMethod === 'iban' 
                    ? 'border-primary bg-primary-light text-primary' 
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Landmark size={18} />
                IBAN Bancário (Angola)
              </button>
            </div>

            {payoutMethod === 'paypal' ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da Conta PayPal</label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@paypal.com"
                  value={paypalEmail}
                  onChange={e => setPaypalEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: BFA, BAI, BIC"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titular da Conta</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Fernando Quipiaca"
                      value={bankHolder}
                      onChange={e => setBankHolder(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número IBAN</label>
                    <input
                      type="text"
                      required
                      placeholder="AO06.0000.0000..."
                      value={bankIban}
                      onChange={e => setBankIban(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Seção 3: Pesquisa Estratégica de Storage */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 border-l-4 border-primary pl-2">3. Estimativa de Armazenamento (Onboarding)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Que tipos de conteúdo você pretende publicar?</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => toggleContentType('ebooks')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                      surveyTypes.includes('ebooks')
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText size={18} />
                    Apenas e-books / PDFs / Apostilas
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleContentType('courses')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                      surveyTypes.includes('courses')
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Video size={18} />
                    Cursos em vídeo / Aulas
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleContentType('tools')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                      surveyTypes.includes('tools')
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Terminal size={18} />
                    Ferramentas digitais / Plugins
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleContentType('events')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                      surveyTypes.includes('events')
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={18} />
                    Ingressos para Eventos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantos GB de conteúdo estima publicar nos primeiros 90 dias?</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === 'less_1gb' ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="less_1gb"
                      checked={surveyVolume === 'less_1gb'}
                      onChange={() => setSurveyVolume('less_1gb')}
                      className="accent-primary"
                    />
                    Menos de 1 GB (Apenas textos e PDFs)
                  </label>
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === '1_5gb' ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="1_5gb"
                      checked={surveyVolume === '1_5gb'}
                      onChange={() => setSurveyVolume('1_5gb')}
                      className="accent-primary"
                    />
                    1 a 5 GB (Softwares leves ou e-books densos)
                  </label>
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === '5_20gb' ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="5_20gb"
                      checked={surveyVolume === '5_20gb'}
                      onChange={() => setSurveyVolume('5_20gb')}
                      className="accent-primary"
                    />
                    5 a 20 GB (Cursos pequenos ou apostilas com áudio)
                  </label>
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === 'more_20gb' ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="more_20gb"
                      checked={surveyVolume === 'more_20gb'}
                      onChange={() => setSurveyVolume('more_20gb')}
                      className="accent-primary"
                    />
                    Mais de 20 GB (Múltiplos cursos em vídeo)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setScreen('member')}
              className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-all text-sm"
            >
              Voltar ao Perfil
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm hover:bg-primary-hover transition-all text-sm disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : <Save size={18} />}
              Enviar Candidatura
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
