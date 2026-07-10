import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Clock, Save, FileText, Video, Terminal, Calendar, ArrowRight, ShieldCheck, Mail, Landmark } from 'lucide-react';
import { useUserCountry } from '../contexts/UserCountryContext';

interface CollaboratorApplyProps {
  setScreen: (screen: string) => void;
  onCandidacyApproved: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

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
        setCandidacyStatus('approved');
        try {
          localStorage.removeItem('ce_founder_ref');
        } catch { /* ignore */ }
        onCandidacyApproved();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar perfil.' });
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
          <h1 className="text-3xl font-bold font-display text-white">Conte mais sobre você</h1>
          <p className="mt-2 text-white/60 text-sm">
            Complete seu perfil profissional para começar a publicar no ecossistema da Codeengine
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
            <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">Perfil Profissional</h3>
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
              Salvar Perfil
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
