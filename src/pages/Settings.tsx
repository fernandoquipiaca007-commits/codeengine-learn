import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Bell, Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../contexts/LocaleContext';
import { SUPPORTED_LOCALES, LOCALE_LABELS, AppLocale } from '../lib/locale';
import { Globe } from 'lucide-react';

interface SettingsProps {
  setScreen: (screen: string) => void;
}

export function Settings({ setScreen }: SettingsProps) {
  const { t } = useTranslation(['pages', 'common']);
  const { locale, setLocale } = useLocale();
  const [user, setUser] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      // Use local session check first (no network call)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setScreen('auth');
        return;
      }

      const authUser = session.user;
      setUser(authUser);

      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (member) {
        setMemberData(member);
        setName(member.profile_data?.name || authUser.email?.split('@')[0] || '');
        setEmailNotifications(member.profile_data?.email_notifications !== false);
      } else {
        // User is authenticated but no member record yet — don't redirect to auth
        setName(authUser.email?.split('@')[0] || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Only redirect if no session at all
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (!session) setScreen('auth');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('members')
        .update({
          profile_data: {
            ...memberData.profile_data,
            name,
            email_notifications: emailNotifications,
          },
        })
        .eq('id', memberData.id);

      if (error) throw error;

      setMessage({ type: 'success', text: t('pages:settings.saved') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('pages:settings.error') });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('auth:passwordsDoNotMatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('auth:weakPassword') });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: t('pages:settings.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('pages:settings.error') });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-sans text-lg text-on-surface-variant">{t('common:loading.default')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-10 max-w-[min(100%,720px)] mx-auto min-h-screen overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          {t('pages:settings.title')}
        </h1>
        <p className="font-sans text-sm sm:text-base md:text-lg text-on-surface-variant">
          {t('pages:settings.subtitle')}
        </p>
      </motion.header>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p className={`font-sans text-sm ${
            message.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">
              {t('pages:settings.personalInfo')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-display text-sm font-semibold text-on-surface mb-2">
                {t('pages:settings.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder={t('pages:contact.namePlaceholder')}
              />
            </div>

            <div>
              <label className="block font-display text-sm font-semibold text-on-surface mb-2">
                {t('pages:settings.email')}
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-container/50 border border-white/10">
                <Mail className="w-5 h-5 text-on-surface-variant" />
                <span className="font-sans text-sm text-on-surface-variant">
                  {user?.email}
                </span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant mt-2">
                {t('pages:settings.emailNote')}
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 rounded-full bg-primary text-on-primary font-display text-sm font-semibold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(192,193,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t('common:loading.pleaseWait') : t('pages:settings.saveChanges')}
            </button>
          </div>
        </motion.section>

        {/* Password Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">
              {t('pages:settings.changePassword')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-display text-sm font-semibold text-on-surface mb-2">
                {t('pages:settings.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-surface-container border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder={t('pages:settings.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-display text-sm font-semibold text-on-surface mb-2">
                {t('pages:settings.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder={t('pages:settings.confirmPasswordPlaceholder')}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full md:w-auto px-6 py-3 rounded-full bg-primary text-on-primary font-display text-sm font-semibold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(192,193,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {saving ? t('common:loading.pleaseWait') : t('pages:settings.updatePassword')}
            </button>
          </div>
        </motion.section>

        {/* Language Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">{t('common:settings.language')}</h2>
          </div>
          <p className="font-sans text-sm text-on-surface-variant mb-4">{t('common:settings.languageDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SUPPORTED_LOCALES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => void setLocale(lang)}
                className={`px-4 py-3 rounded-lg font-display text-sm font-semibold transition-all ${
                  locale === lang ? 'bg-primary text-on-primary' : 'bg-surface-container border border-white/10 text-on-surface'
                }`}
              >
                {LOCALE_LABELS[lang]}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">
              {t('pages:settings.emailNotifications')}
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="font-display text-sm font-semibold text-white group-hover:text-primary transition-colors">
                  {t('pages:settings.emailNotifications')}
                </p>
                <p className="font-sans text-xs text-on-surface-variant mt-1">
                  {t('pages:settings.emailNotificationsDesc')}
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-surface-container rounded-full peer-checked:bg-primary transition-colors"></div>
                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </div>
            </label>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
