import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
function Typewriter({ text, speed = 55 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) return;
    const t = setTimeout(() => {
      setDisplayed((p) => p + text[idx]);
      setIdx((p) => p + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [idx, text, speed]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse opacity-70">|</span>
    </span>
  );
}

/* ─── Particle dots canvas background ───────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number; da: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.1,
        da: (Math.random() - 0.5) * 0.004,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.da;
        if (p.alpha > 0.6 || p.alpha < 0.05) p.da *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,180,255,${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ─── Right panel quotes per mode/locale ────────────────────────────────── */
const QUOTES: Record<string, Record<string, { text: string; author: string }>> = {
  login: {
    pt: { text: 'Bem-vindo de volta. O conhecimento aguarda.', author: '— CodeEngine' },
    en: { text: 'Welcome back. Knowledge awaits you.', author: '— CodeEngine' },
    fr: { text: 'Bienvenue. Le savoir vous attend.', author: '— CodeEngine' },
  },
  signup: {
    pt: { text: 'A jornada começa aqui. Junte-se a nós.', author: '— CodeEngine' },
    en: { text: 'The journey starts here. Join us.', author: '— CodeEngine' },
    fr: { text: 'Le voyage commence ici. Rejoignez-nous.', author: '— CodeEngine' },
  },
  reset: {
    pt: { text: 'Recomeçar faz parte do processo.', author: '— CodeEngine' },
    en: { text: 'Starting over is part of the journey.', author: '— CodeEngine' },
    fr: { text: 'Recommencer fait partie du chemin.', author: '— CodeEngine' },
  },
};

/* ─── Auth Component ─────────────────────────────────────────────────────── */
export function Auth({ setScreen, initialMode = 'login' }: AuthProps) {
  const { t, i18n } = useTranslation('auth');
  const { setLocale } = useLocale();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [country, setCountry] = useState('AO');

  // OTP Password Recovery
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

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const lang = i18n.language?.split('-')[0] ?? 'pt';
  const quote = QUOTES[mode]?.[lang] ?? QUOTES[mode]?.['pt'];

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      sessionStorage.setItem('ce_google_signing_in', 'true');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
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
        let referredByUserId: string | null = null;
        try {
          const stored = JSON.parse(localStorage.getItem('ce_founder_ref') || 'null');
          if (stored && stored.expiry > Date.now()) {
            referredByUserId = stored.userId;
          } else {
            localStorage.removeItem('ce_founder_ref');
          }
        } catch { /* ignore */ }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              country,
              ...(referredByUserId ? { referred_by: referredByUserId } : {}),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (!signUpError && referredByUserId) {
          localStorage.removeItem('ce_founder_ref');
        }

        if (data.session?.access_token) {
          fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production.up.railway.app'}/api/auth/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
          }).catch(() => {});
        }

        if (data.session) {
          setSuccess('Cadastro realizado com sucesso! Entrando...');
          void setLocale(countryToLocale(country));
          setTimeout(() => {
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
          setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
        }

      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        if (data.user) {
          setSuccess(t('signInSuccess'));
          setTimeout(() => {
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
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production.up.railway.app';
        if (!codeSent) {
          const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || t('resetLinkError'));
          setCodeSent(true);
          setSuccess(t('resetCodeSent'));
        } else {
          if (newPassword !== confirmPassword) throw new Error(t('passwordsDoNotMatch'));
          if (newPassword.length < 6) throw new Error(t('passwordLengthError'));

          const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: verificationCode.trim(), newPassword }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || t('resetInvalidCode'));

          setSuccess(t('resetSuccess'));
          setTimeout(async () => {
            try {
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: newPassword });
              if (signInError) throw signInError;
              setScreen('member');
            } catch {
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

  const inputClass =
    'w-full pl-11 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-all duration-200 text-sm font-sans';

  const labelClass = 'block text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-1 font-display';

  // Compact spacing in signup to avoid scroll
  const isSignup = mode === 'signup';

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#050505] overflow-hidden">
      {/* ── LEFT: Form Panel ─────────────────────────────────────────────── */}
      <div className="relative flex w-full md:w-[46%] lg:w-[42%] flex-col items-center justify-center px-8 py-6 overflow-y-auto">
        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-72 bg-primary/10 rounded-full blur-[100px]" />

        <motion.div
          key={mode}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[360px]"
        >
          {/* Logo — real CodeEngine icon */}
          <div className={isSignup ? 'mb-4' : 'mb-6'}>
            <button
              onClick={() => setScreen('home')}
              className="flex items-center gap-2.5 group"
            >
              <img
                src="/icons/icon-512.png"
                alt="CodeEngine"
                className="w-9 h-9 rounded-xl object-cover group-hover:opacity-90 transition-opacity"
              />
              <span className="font-display text-sm font-semibold text-white/60 group-hover:text-white/90 transition-colors">
                CodeEngine
              </span>
            </button>
          </div>

          {/* Heading */}
          <div className={isSignup ? 'mb-4' : 'mb-6'}>
            <h1 className="font-display text-2xl font-bold text-white mb-0.5 leading-tight">
              {mode === 'login' && t('welcomeTitleLogin')}
              {mode === 'signup' && t('welcomeTitleSignup')}
              {mode === 'reset' && t('resetPasswordTitle')}
            </h1>
            <p className="font-sans text-sm text-white/40">
              {mode === 'login' && t('welcomeSubtitleLogin')}
              {mode === 'signup' && t('welcomeSubtitleSignup')}
              {mode === 'reset' && t('resetPasswordSubtitle')}
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-red-400">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-green-400">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className={isSignup ? 'space-y-2.5' : 'space-y-3.5'}>
            {/* Full Name — signup only */}
            {mode === 'signup' && (
              <div>
                <label className={labelClass}>{t('fullName')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                    placeholder={t('countryPlaceholder')}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Country — signup only */}
            {mode === 'signup' && (
              <div>
                <label className={labelClass}>{t('countryLabel')}</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className={`${inputClass} appearance-none cursor-pointer`}
                    disabled={loading}
                  >
                    <option value="AO" className="bg-[#111] text-white">{t('countries.AO')}</option>
                    <option value="PT" className="bg-[#111] text-white">{t('countries.PT')}</option>
                    <option value="BR" className="bg-[#111] text-white">{t('countries.BR')}</option>
                    <option value="FR" className="bg-[#111] text-white">{t('countries.FR')}</option>
                    <option value="US" className="bg-[#111] text-white">{t('countries.US')}</option>
                    <option value="OTHER" className="bg-[#111] text-white">{t('countries.OTHER')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={labelClass}>{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder={t('emailPlaceholder')}
                  disabled={loading || (mode === 'reset' && codeSent)}
                />
              </div>
            </div>

            {/* Password Recovery Additional Fields */}
            {mode === 'reset' && codeSent && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t('resetCodeLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className={`${inputClass} font-mono tracking-[0.2em]`}
                      placeholder={t('resetCodePlaceholder')}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('newPasswordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputClass} pr-11`}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('confirmNewPasswordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputClass} pr-11`}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Password — login & signup */}
            {mode !== 'reset' && (
              <div>
                <label className={labelClass}>{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-1.5 text-[10px] text-white/25 font-sans">{t('minCharactersRequirement')}</p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-display text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(192,193,255,0.25)] hover:shadow-[0_0_36px_rgba(192,193,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group mt-0.5"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-on-primary" />
              ) : (
                <>
                  {mode === 'login' && t('signIn')}
                  {mode === 'signup' && t('signUp')}
                  {mode === 'reset' && (codeSent ? t('resetPasswordAction') : t('sendCodeAction'))}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Google + OR separator */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center my-3">
                <div className="flex-grow border-t border-white/8" />
                <span className="px-3 text-[10px] font-sans font-semibold uppercase tracking-widest text-white/25">
                  {t('orContinueWith')}
                </span>
                <div className="flex-grow border-t border-white/8" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/4 py-2 px-4 font-sans text-sm font-medium text-white/80 transition-all hover:bg-white/8 hover:border-white/18 hover:text-white disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28-0.96,2.37-2.04,3.1v2.6h3.28c1.92,-1.78 3.03,-4.4 3.03,-7.4c0,-0.34-0.03,-0.68-0.09,-1Z" fill="#4285F4" />
                    <path d="M12,20.6c2.7,0 4.96,-0.9 6.62,-2.4l-3.28,-2.6c-0.9,0.6-2.07,0.97-3.34,0.97-2.57,0-4.75,-1.73-5.53,-4.06H3.1v2.7C4.74,18.4 8.1,20.6 12,20.6Z" fill="#34A853" />
                    <path d="M6.47,12.51c-0.2,-0.6-0.31,-1.24-0.31,-1.9c0,-0.66 0.11,-1.3 0.31,-1.9V6.01H3.1C2.4,7.41 2,9 2,10.61c0,1.61 0.4,3.2 1.1,4.6l3.37,-2.7Z" fill="#FBBC05" />
                    <path d="M12,4.8c1.47,0 2.78,0.5 3.82,1.5l2.87,-2.87C16.96,1.86 14.7,1 12,1 8.1,1 4.74,3.2 3.1,6.41l3.37,2.7C7.25,6.78 9.43,4.8 12,4.8Z" fill="#EA4335" />
                  </g>
                </svg>
                {mode === 'login' ? t('signInWith') : t('signUpWith')} {t('google')}
              </button>
            </>
          )}

          {/* Mode switcher */}
          <div className="mt-3 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('reset')}
                  className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors block w-full">
                  {t('forgotPassword')}
                </button>
                <div className="font-sans text-xs text-white/35">
                  {t('dontHaveAccount')}{' '}
                  <button onClick={() => setMode('signup')}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    {t('createAccount')}
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="font-sans text-xs text-white/35">
                {t('alreadyHaveAccount')}{' '}
                <button onClick={() => setMode('login')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  {t('signIn')}
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => { setMode('login'); setCodeSent(false); setVerificationCode(''); setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); }}
                className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {t('backToLogin')}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: Illustration Panel ─────────────────────────────────────── */}
      <div className="hidden md:flex relative flex-1 flex-col overflow-hidden">
        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Micro-dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient light blooms */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-indigo-500/6 rounded-full blur-[100px] pointer-events-none" />

        {/* Illustration image — full fill */}
        <div className="absolute inset-0">
          <img
            src="/login.png"
            alt="CodeEngine illustration"
            className="w-full h-full object-cover object-center opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Bottom gradient overlay for quote readability */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#050505]/95 via-[#050505]/50 to-transparent pointer-events-none" />

        {/* Vertical separator line */}
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        {/* Quote */}
        <div className="relative z-10 mt-auto px-10 pb-10">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={`${mode}-${lang}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-1.5 text-center"
            >
              <p className="text-base font-medium text-white/90 drop-shadow-lg font-display">
                &ldquo;<Typewriter key={`${mode}-${lang}`} text={quote.text} speed={55} />&rdquo;
              </p>
              <cite className="block text-xs font-light not-italic text-white/40 tracking-wider">
                {quote.author}
              </cite>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
