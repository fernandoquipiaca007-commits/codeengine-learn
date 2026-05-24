import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  setScreen: (screen: string) => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'signup' | 'reset';

export function Auth({ setScreen, initialMode = 'login' }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [country, setCountry] = useState('AO');

  // OTP Password Recovery States
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              country: country,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Send welcome email (non-blocking)
        if (data.session?.access_token) {
          fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/auth/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
          }).catch(() => {}); // fire-and-forget
        }

        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setSuccess('Conta criada com sucesso! Você já pode fazer login.');
        } else {
          setSuccess('Conta criada com sucesso! Você já pode fazer login.');
        }
        
        // Auto-switch to login mode after 2 seconds
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 2000);
      } else if (mode === 'login') {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          setSuccess('Login realizado com sucesso!');
          setTimeout(() => {
            // Check for pending referral product redirect
            const pendingProduct = sessionStorage.getItem('pendingProductId');
            if (pendingProduct) {
              sessionStorage.removeItem('pendingProductId');
              setScreen(`product`);
              // Use custom event to trigger product navigation
              window.dispatchEvent(new CustomEvent('navigate-product', { detail: pendingProduct }));
            } else {
              setScreen('member');
            }
          }, 1000);
        }
      } else if (mode === 'reset') {
        if (!codeSent) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
          if (resetError) throw resetError;

          setCodeSent(true);
          setSuccess('Código de verificação enviado! Verifique a sua caixa de entrada.');
        } else {
          if (newPassword !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
          }
          if (newPassword.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres.');
          }

          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode.trim(),
            type: 'recovery',
          });

          if (verifyError || !verifyData?.user) {
            throw verifyError || new Error('Código de verificação inválido.');
          }

          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateError) throw updateError;

          setSuccess('Senha redefinida com sucesso!');
          setTimeout(() => {
            setScreen('member');
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Glass Panel */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-display text-4xl font-bold text-white mb-2">
                {mode === 'login' && 'Bem-vindo de volta à CodeEngine Learn'}
                {mode === 'signup' && 'Junte-se à CodeEngine Learn'}
                {mode === 'reset' && 'Recuperar Senha'}
              </h1>
              <p className="font-sans text-base text-on-surface-variant">
                {mode === 'login' && 'Entre para acessar seu ecossistema de conhecimento'}
                {mode === 'signup' && 'Torne-se membro da comunidade premium'}
                {mode === 'reset' && 'Enviaremos um link de recuperação'}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-green-400">{success}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (only for signup) */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                      placeholder="Digite seu nome completo"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Country (only for signup) */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                    País
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50 transition-colors font-sans appearance-none select-premium text-left"
                      disabled={loading}
                    >
                      <option value="AO" className="bg-surface-high text-white">Angola</option>
                      <option value="PT" className="bg-surface-high text-white">Portugal</option>
                      <option value="BR" className="bg-surface-high text-white">Brasil</option>
                      <option value="FR" className="bg-surface-high text-white">França</option>
                      <option value="US" className="bg-surface-high text-white">Estados Unidos</option>
                      <option value="OTHER" className="bg-surface-high text-white">Outro</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    placeholder="seu@email.com"
                    disabled={loading || (mode === 'reset' && codeSent)}
                  />
                </div>
              </div>

              {/* Password Recovery Fields */}
              {mode === 'reset' && codeSent && (
                <div className="space-y-4 pt-2 animate__animated animate__fadeIn">
                  {/* Verification Code */}
                  <div>
                    <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                      Código de Verificação (6 dígitos)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans font-mono tracking-[0.2em]"
                        placeholder="123456"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password (not for reset) */}
              {mode !== 'reset' && (
                <div>
                  <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-2 font-sans text-xs text-on-surface-variant/60">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-display text-base font-bold px-6 py-4 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,193,255,0.3)] hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-on-primary"></div>
                ) : (
                  <>
                    {mode === 'login' && 'Entrar'}
                    {mode === 'signup' && 'Criar Conta'}
                    {mode === 'reset' && (codeSent ? 'Redefinir Senha' : 'Enviar Código')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-6 text-center space-y-3">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => setMode('reset')}
                    className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                  <div className="font-sans text-sm text-on-surface-variant">
                    Não tem uma conta?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      Criar conta
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div className="font-sans text-sm text-on-surface-variant">
                  Já tem uma conta?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Entrar
                  </button>
                </div>
              )}

              {mode === 'reset' && (
                <button
                  onClick={() => {
                    setMode('login');
                    setCodeSent(false);
                    setVerificationCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                  }}
                  className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Voltar para login
                </button>
              )}
            </div>

            {/* Back to Home */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => setScreen('home')}
                className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                ← Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
