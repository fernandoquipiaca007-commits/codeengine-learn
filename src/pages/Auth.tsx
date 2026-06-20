import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, AlertCircle, Globe, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { countryToLocale } from '../lib/locale';

interface AuthProps {
  setScreen: (screen: string) => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'signup' | 'reset';

export function Auth({ setScreen, initialMode = 'login' }: AuthProps) {
  const { t } = useTranslation('auth');
  const { setLocale } = useLocale();
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
  
  // 2-minute countdown timer state (persisted in localStorage)
  const [resendCountdown, setResendCountdown] = useState<number>(() => {
    const stored = localStorage.getItem('ce_resend_expiry');
    if (stored) {
      const expiry = parseInt(stored, 10);
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (resendCountdown > 0) {
      const expiry = Date.now() + resendCountdown * 1000;
      // Only write if not already set to avoid resetting the expiry time on each tick
      if (!localStorage.getItem('ce_resend_expiry')) {
        localStorage.setItem('ce_resend_expiry', expiry.toString());
      }
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      localStorage.removeItem('ce_resend_expiry');
    }
  }, [resendCountdown]);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      sessionStorage.setItem('ce_google_signing_in', 'true');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(err instanceof Error ? err.message : t('genericError'));
      setLoading(false);
    }
  }

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

        if (data.session) {
          setSuccess('Cadastro realizado com sucesso! Entrando...');
          // Immediately apply locale based on the country selected during signup
          void setLocale(countryToLocale(country));
          setTimeout(() => {
            // If user was trying to buy a product, go back to it (ProductActionButton will auto-trigger checkout)
            const raw = sessionStorage.getItem('pendingCheckout');
            if (raw) {
              try {
                const intent = JSON.parse(raw) as { productId: string };
                if (intent.productId) {
                  setScreen('product');
                  window.dispatchEvent(new CustomEvent('navigate-product', { detail: intent.productId }));
                  return;
                }
              } catch {}
            }
            setScreen('member');
          }, 1500);
        } else {
          setSuccess(t('signUpSuccess'));
          setTimeout(() => {
            setMode('login');
            setSuccess('');
          }, 2000);
        }

      } else if (mode === 'login') {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          setSuccess(t('signInSuccess'));
          setTimeout(() => {
            // Priority 1: pending checkout intent (user was trying to buy before logging in)
            const rawCheckout = sessionStorage.getItem('pendingCheckout');
            if (rawCheckout) {
              try {
                const intent = JSON.parse(rawCheckout) as { productId: string };
                if (intent.productId) {
                  setScreen('product');
                  window.dispatchEvent(new CustomEvent('navigate-product', { detail: intent.productId }));
                  return;
                }
              } catch {}
            }
            // Priority 2: generic pending product navigation
            const pendingProduct = sessionStorage.getItem('pendingProductId');
            if (pendingProduct) {
              sessionStorage.removeItem('pendingProductId');
              setScreen('product');
              window.dispatchEvent(new CustomEvent('navigate-product', { detail: pendingProduct }));
            } else {
              setScreen('member');
            }
          }, 1000);
        }
      } else if (mode === 'reset') {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        if (!codeSent) {
          const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || t('resetLinkError'));
          }

          localStorage.setItem('ce_resend_expiry', (Date.now() + 120 * 1000).toString());
          setResendCountdown(120);
          setCodeSent(true);
          setSuccess(t('resetCodeSent'));
        } else {
          if (newPassword !== confirmPassword) {
            throw new Error(t('passwordsDoNotMatch'));
          }
          if (newPassword.length < 6) {
            throw new Error(t('passwordLengthError'));
          }

          const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              code: verificationCode.trim(),
              newPassword,
            }),
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || t('resetInvalidCode'));
          }

          setSuccess(t('resetSuccess'));
          setTimeout(async () => {
            try {
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: newPassword,
              });
              if (signInError) throw signInError;
              setScreen('member');
            } catch {
              // If auto-login fails, redirect to login mode
              setSuccess('');
              window.location.reload();
            }
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : t('genericError'));
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
                {mode === 'login' && t('welcomeTitleLogin')}
                {mode === 'signup' && t('welcomeTitleSignup')}
                {mode === 'reset' && t('resetPasswordTitle')}
              </h1>
              <p className="font-sans text-base text-on-surface-variant">
                {mode === 'login' && t('welcomeSubtitleLogin')}
                {mode === 'signup' && t('welcomeSubtitleSignup')}
                {mode === 'reset' && t('resetPasswordSubtitle')}
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
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                      placeholder={t('countryPlaceholder')}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Country (only for signup) */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                    {t('countryLabel')}
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
                      <option value="AO" className="bg-surface-high text-white">{t('countries.AO')}</option>
                      <option value="PT" className="bg-surface-high text-white">{t('countries.PT')}</option>
                      <option value="BR" className="bg-surface-high text-white">{t('countries.BR')}</option>
                      <option value="FR" className="bg-surface-high text-white">{t('countries.FR')}</option>
                      <option value="US" className="bg-surface-high text-white">{t('countries.US')}</option>
                      <option value="OTHER" className="bg-surface-high text-white">{t('countries.OTHER')}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    placeholder={t('emailPlaceholder')}
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
                      {t('resetCodeLabel')}
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
                        placeholder={t('resetCodePlaceholder')}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                      {t('newPasswordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-12 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                      {t('confirmNewPasswordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-12 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password (not for reset) */}
              {mode !== 'reset' && (
                <div>
                  <label className="block font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3 bg-surface-high border border-white/10 rounded-lg text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-2 font-sans text-xs text-on-surface-variant/60">
                      {t('minCharactersRequirement')}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (mode === 'reset' && !codeSent && resendCountdown > 0)}
                className="w-full bg-primary text-on-primary font-display text-base font-bold px-6 py-4 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,193,255,0.3)] hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-on-primary"></div>
                ) : (
                  <>
                    {mode === 'login' && t('signIn')}
                    {mode === 'signup' && t('signUp')}
                    {mode === 'reset' && (
                      codeSent 
                        ? t('resetPasswordAction') 
                        : (resendCountdown > 0 
                            ? `Aguarde ${Math.floor(resendCountdown / 60)}:${(resendCountdown % 60).toString().padStart(2, '0')}` 
                            : t('sendCodeAction'))
                    )}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Resend Verification Code Timer / Button */}
              {mode === 'reset' && codeSent && (
                <div className="mt-4 text-center">
                  {resendCountdown > 0 ? (
                    <p className="font-sans text-sm text-on-surface-variant/80">
                      Você pode solicitar um novo código em: <span className="font-semibold text-primary">{Math.floor(resendCountdown / 60)}:{(resendCountdown % 60).toString().padStart(2, '0')}</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccess('');
                        try {
                          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
                          const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                          });

                          const result = await response.json();
                          if (!response.ok || !result.success) {
                            throw new Error(result.error || t('resetLinkError'));
                          }

                          localStorage.setItem('ce_resend_expiry', (Date.now() + 120 * 1000).toString());
                          setResendCountdown(120);
                          setSuccess(t('resetCodeSent'));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : t('genericError'));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="font-sans text-sm text-primary hover:text-primary/80 font-semibold transition-colors disabled:opacity-50"
                    >
                      Reenviar Código de Confirmação
                    </button>
                  )}
                </div>
              )}
            </form>

            {mode !== 'reset' && (
              <>
                <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="px-3 font-sans text-xs text-on-surface-variant/60 uppercase tracking-wider">
                    {t('orContinueWith')}
                  </span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-3.5 px-4 font-sans text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.28c1.92,-1.78 3.03,-4.4 3.03,-7.4c0,-0.34 -0.03,-0.68 -0.09,-1Z" fill="#4285F4" />
                      <path d="M12,20.6c2.7,0 4.96,-0.9 6.62,-2.4l-3.28,-2.6c-0.9,0.6 -2.07,0.97 -3.34,0.97 -2.57,0 -4.75,-1.73 -5.53,-4.06H3.1v2.7C4.74,18.4 8.1,20.6 12,20.6Z" fill="#34A853" />
                      <path d="M6.47,12.51c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9c0,-0.66 0.11,-1.3 0.31,-1.9V6.01H3.1C2.4,7.41 2,9 2,10.61c0,1.61 0.4,3.2 1.1,4.6l3.37,-2.7Z" fill="#FBBC05" />
                      <path d="M12,4.8c1.47,0 2.78,0.5 3.82,1.5l2.87,-2.87C16.96,1.86 14.7,1 12,1 8.1,1 4.74,3.2 3.1,6.41l3.37,2.7C7.25,6.78 9.43,4.8 12,4.8Z" fill="#EA4335" />
                    </g>
                  </svg>
                  {mode === 'login' ? t('signInWith') : t('signUpWith')} {t('google')}
                </button>
              </>
            )}

            {/* Mode Switcher */}
            <div className="mt-6 text-center space-y-3">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => setMode('reset')}
                    className="font-sans text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {t('forgotPassword')}
                  </button>
                  <div className="font-sans text-sm text-on-surface-variant">
                    {t('dontHaveAccount')}{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      {t('createAccount')}
                    </button>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div className="font-sans text-sm text-on-surface-variant">
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    {t('signIn')}
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
                  {t('backToLogin')}
                </button>
              )}
            </div>

            {/* Back to Home */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => setScreen('home')}
                className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                ← {t('backToHomeAction')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
