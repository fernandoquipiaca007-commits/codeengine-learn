import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Clock, Save, FileText, Video, Terminal, Calendar, ArrowRight, ShieldCheck, Mail, Landmark } from 'lucide-react';
import { useUserCountry } from '../contexts/UserCountryContext';

interface CollaboratorApplyProps {
  setScreen: (screen: string) => void;
  onCandidacyApproved: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production.up.railway.app';

export function CollaboratorApply({ setScreen, onCandidacyApproved }: CollaboratorApplyProps) {
  const { isAngola } = useUserCountry();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidacyStatus, setCandidacyStatus] = useState<'not_applied' | 'pending' | 'approved' | 'rejected'>('not_applied');
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'iban'>('paypal');

  // Onboarding survey states
  const [surveyTypes, setSurveyTypes] = useState<string[]>([]);
  const [surveyVolume, setSurveyVolume] = useState('less_1gb');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAngola) {
      setPayoutMethod('paypal');
    }
  }, [isAngola]);

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

      // Read stored founder referral if present
      let inviteCode: string | null = null;
      try {
        const stored = JSON.parse(localStorage.getItem('ce_founder_ref') || 'null');
        if (stored && stored.expiry > Date.now()) {
          inviteCode = stored.userId;
        }
      } catch { /* ignore */ }

      // Detailed payout info will be configured in the Wallet settings after approval.
      const payoutInfo = {}; 

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
          survey,
          inviteCode
        })
      });
      const data = await res.json();

      if (data.success) {
        setCandidacyStatus('pending');
        setMessage({ type: 'success', text: data.message });
        try {
          localStorage.removeItem('ce_founder_ref');
        } catch { /* ignore */ }
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
          className="glass-panel p-8 rounded-2xl border border-white/10 shadow-xl bg-surface-container-low/30 backdrop-blur-xl text-white"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="mb-3 text-2xl font-bold font-display text-white">Candidatura em Análise</h2>
          <p className="mb-6 text-white/70">
            Recebemos seus dados profissionais e sua pesquisa estratégica de infraestrutura. 
            Nossa equipe administrativa está revisando sua solicitação para ativação do seu painel de criador.
          </p>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/50">
            Status: <span className="font-semibold text-primary">Aguardando Aprovação</span>
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
          className="glass-panel p-8 rounded-2xl border border-white/10 shadow-xl bg-surface-container-low/30 backdrop-blur-xl text-white"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-3 text-2xl font-bold font-display text-white">Candidatura Recusada</h2>
          <p className="mb-4 text-red-300 text-sm bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <strong>Motivo:</strong> {rejectReason}
          </p>
          <p className="mb-6 text-white/70 text-sm">
            Você pode corrigir suas informações ou ajustar sua proposta e enviar uma nova candidatura.
          </p>
          <button
            onClick={() => setCandidacyStatus('not_applied')}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm hover:bg-primary/95 transition-all text-sm"
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
        className="glass-panel p-8 rounded-2xl border border-white/10 shadow-xl bg-surface-container-low/30 backdrop-blur-xl text-white"
      >
        <div className="mb-8 border-b border-white/10 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl font-bold font-display text-white">Candidatar-se a Criador</h1>
          <p className="mt-2 text-white/60 text-sm">
            Publique seus e-books e cursos digitais no ecossistema da Codeengine
          </p>
        </div>

        {message && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-sm border ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-300 border-green-500/20' 
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados do Perfil */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">1. Perfil Profissional</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">Nome de Exibição / Canal</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Professor João Silva ou DevAcademy"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors font-sans text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">Área de Especialização / Especialidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Programação Web, Design Gráfico, Marketing Digital"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors font-sans text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">Minibiografia / Descrição</label>
                <textarea
                  placeholder="Conte um pouco sobre sua trajetória profissional e o conteúdo que deseja compartilhar."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors font-sans text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Preferências de Repasse */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">2. Preferências de Repasse Financeiro</h3>
            <p className="text-white/50 text-xs mb-3 font-sans">
              Selecione o método de pagamento preferencial. Você poderá configurar seus dados de recebimento (e-mail PayPal ou IBAN bancário) a qualquer momento na sua carteira após aprovação.
            </p>
            <div className={`grid gap-3 ${isAngola ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={() => setPayoutMethod('paypal')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  payoutMethod === 'paypal' 
                    ? 'border-primary bg-primary/20 text-white' 
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Mail size={18} />
                PayPal (Internacional)
              </button>
              {isAngola && (
                <button
                  type="button"
                  onClick={() => setPayoutMethod('iban')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                    payoutMethod === 'iban' 
                      ? 'border-primary bg-primary/20 text-white' 
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Landmark size={18} />
                  IBAN Bancário (Nacional)
                </button>
              )}
            </div>
          </div>

          {/* Seção 3: Pesquisa Estratégica de Storage */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">3. Estimativa de Armazenamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Que tipos de conteúdo você pretende publicar?</label>
                <div className="grid gap-2 sm:grid-cols-2 font-sans">
                  <button
                    type="button"
                    onClick={() => toggleContentType('ebooks')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                      surveyTypes.includes('ebooks')
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
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
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
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
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
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
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Calendar size={18} />
                    Ingressos para Eventos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Quantos GB de conteúdo estima publicar nos primeiros 90 dias?</label>
                <div className="grid gap-2 sm:grid-cols-2 font-sans">
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === 'less_1gb' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
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
                    surveyVolume === '1_5gb' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="1_5gb"
                      checked={surveyVolume === '1_5gb'}
                      onChange={() => setSurveyVolume('1_5gb')}
                      className="accent-primary"
                    />
                    1 a 5 GB (Softwares leves ou e-books)
                  </label>
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === '5_20gb' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="5_20gb"
                      checked={surveyVolume === '5_20gb'}
                      onChange={() => setSurveyVolume('5_20gb')}
                      className="accent-primary"
                    />
                    5 a 20 GB (Cursos pequenos/apostilas)
                  </label>
                  <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm transition-all ${
                    surveyVolume === 'more_20gb' ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="volume"
                      value="more_20gb"
                      checked={surveyVolume === 'more_20gb'}
                      onChange={() => setSurveyVolume('more_20gb')}
                      className="accent-primary"
                    />
                    Mais de 20 GB (Cursos em vídeo)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setScreen('member')}
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white/70 hover:bg-white/5 transition-all text-sm font-sans"
            >
              Voltar ao Perfil
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm hover:bg-primary/90 transition-all text-sm disabled:opacity-50 font-sans"
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
