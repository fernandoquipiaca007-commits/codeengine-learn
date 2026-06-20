import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Bell, Eye, EyeOff, Save, AlertCircle, CheckCircle, Camera, Globe, RefreshCw, Download, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../contexts/LocaleContext';
import { SUPPORTED_LOCALES, LOCALE_LABELS, AppLocale } from '../lib/locale';
import { useRegisterSW } from 'virtual:pwa-register/react';

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

  // PWA app version & updates states
  const BUILD_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);

  // PWA install states
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  useEffect(() => {
    loadUserData();
    checkAppVersion();
  }, [needRefresh]);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(!!standalone);

    setInstallPrompt((window as any).deferredPwaPrompt || null);

    const handlePrompt = () => {
      setInstallPrompt((window as any).deferredPwaPrompt || null);
    };

    window.addEventListener('pwa-prompt-available', handlePrompt);
    window.addEventListener('pwa-prompt-dismissed', handlePrompt);
    
    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePrompt);
      window.removeEventListener('pwa-prompt-dismissed', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function handleInstallApp() {
    const prompt = installPrompt || (window as any).deferredPwaPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          setInstallPrompt(null);
          window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'));
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
        setShowInstallGuideModal(true);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  }

  async function checkAppVersion(manual = false) {
    if (needRefresh) {
      setUpdateAvailable(true);
      return;
    }
    if (manual) setCheckingVersion(true);
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_version')
        .maybeSingle();
      if (data?.value && data.value !== BUILD_VERSION) {
        setServerVersion(data.value);
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
        if (manual) {
          setMessage({ type: 'success', text: t('pages:settings.alreadyLatestVersion') });
          setTimeout(() => setMessage(null), 3000);
        }
      }
    } catch {
      // ignore
    } finally {
      setCheckingVersion(false);
    }
  }

  async function handleAppUpdate() {
    setSaving(true);
    const reloadKey = 'pwa_last_silent_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();

    if (lastReload && now - parseInt(lastReload, 10) < 10000) {
      console.warn('[PWA] Prevented rapid infinite reload loop in Settings.');
      setNeedRefresh(false);
      setUpdateAvailable(false);
      setSaving(false);
      return;
    }

    sessionStorage.setItem(reloadKey, now.toString());

    try {
      await updateServiceWorker(true);
      setNeedRefresh(false);
      
      // Fallback reload in case the controllerchange event does not fire (e.g. browser compatibility)
      setTimeout(() => {
        console.log('[PWA] Settings update fallback reload...');
        window.location.reload();
      }, 2500);
    } catch (err) {
      console.error('[PWA] Error activating update service worker from Settings:', err);
      window.location.reload();
    }
  }


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
        setAvatarUrl(member.profile_data?.avatar_url || null);
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('pages:settings.avatarMaxSizeError') });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      let activeMemberId = memberData?.id;
      let activeProfileData = memberData?.profile_data || {};

      if (!activeMemberId && user) {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (member) {
          activeMemberId = member.id;
          activeProfileData = member.profile_data || {};
          setMemberData(member);
        } else {
          const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert({
              auth_id: user.id,
              profile_data: { name: name || user.email?.split('@')[0] || '' }
            })
            .select()
            .single();
          
          if (createError || !newMember) {
            throw new Error(t('pages:settings.avatarInitProfileError'));
          }
          activeMemberId = newMember.id;
          activeProfileData = newMember.profile_data || {};
          setMemberData(newMember);
        }
      }

      if (!activeMemberId) {
        throw new Error(t('pages:settings.userNotAuthenticated'));
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${activeMemberId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const updatedProfile = {
        ...activeProfileData,
        avatar_url: publicUrl,
      };

      const { error: updateError } = await supabase
        .from('members')
        .update({
          profile_data: updatedProfile,
        })
        .eq('id', activeMemberId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMemberData({
        ...(memberData || {}),
        id: activeMemberId,
        auth_id: user.id,
        profile_data: updatedProfile,
      });

      setMessage({ type: 'success', text: t('pages:settings.avatarSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setMessage({ type: 'error', text: error.message || t('pages:settings.avatarError') });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setMessage(null);

    try {
      let activeMember = memberData;
      if (!activeMember && user) {
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (member) {
          activeMember = member;
          setMemberData(member);
        } else {
          const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert({
              auth_id: user.id,
              profile_data: { name: name || user.email?.split('@')[0] || '' }
            })
            .select()
            .single();
          
          if (createError || !newMember) {
            throw new Error(t('pages:settings.avatarInitProfileError'));
          }
          activeMember = newMember;
          setMemberData(newMember);
        }
      }

      if (!activeMember) {
        throw new Error(t('pages:settings.userNotAuthenticated'));
      }

      const { error } = await supabase
        .from('members')
        .update({
          profile_data: {
            ...activeMember.profile_data,
            name,
            email_notifications: emailNotifications,
          },
        })
        .eq('id', activeMember.id);

      if (error) throw error;

      setMemberData({
        ...activeMember,
        profile_data: {
          ...activeMember.profile_data,
          name,
          email_notifications: emailNotifications,
        }
      });

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
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen flex items-center justify-center">
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
            {/* Avatar Picker Widget */}
            <div className="flex flex-col items-center sm:flex-row gap-6 mb-8 p-4 rounded-xl bg-surface-container/30 border border-white/5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 flex items-center justify-center bg-surface-high relative shadow-[0_0_15px_rgba(192,193,255,0.1)]">
                  {avatarUrl && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center text-white text-3xl font-display font-bold">
                      {(name || '').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer hover:bg-primary/95 transition-colors shadow-lg border border-surface-high group-hover:scale-105 transform duration-200">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-display text-base font-semibold text-white">{t('pages:settings.profilePicture')}</h3>
                <p className="font-sans text-xs text-on-surface-variant max-w-[280px]">
                  {t('pages:settings.acceptedFormats')}
                </p>
              </div>
            </div>

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

        {/* PWA System Version & Updates Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">
              {t('pages:settings.appVersionSection')}
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container/30 border border-white/5">
              <div>
                <p className="font-display text-sm font-semibold text-white">{t('pages:settings.currentVersion')}</p>
                <p className="font-mono text-xs text-on-surface-variant mt-1">
                  v{BUILD_VERSION}
                </p>
              </div>
              {updateAvailable && serverVersion && (
                <div className="px-3 py-1 rounded bg-orange-500/10 border border-orange-500/25 text-orange-400 font-sans text-xs font-semibold">
                  {t('pages:settings.newVersionAvailable', { version: serverVersion })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => checkAppVersion(true)}
                disabled={checkingVersion || saving}
                className="px-6 py-3 rounded-full border border-white/10 text-on-surface font-display text-sm font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkingVersion && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                {t('pages:settings.checkUpdates')}
              </button>

              {updateAvailable && (
                <button
                  type="button"
                  onClick={handleAppUpdate}
                  disabled={saving}
                  className="px-6 py-3 rounded-full bg-primary text-on-primary font-display text-sm font-semibold hover:shadow-[0_0_20px_rgba(192,193,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 text-on-primary animate-[spin_3s_linear_infinite]" />
                  {t('pages:settings.updateApp')}
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* Dedicated PWA Installation Section - Always visible at the bottom per user request */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl font-bold text-white">
              {t('pages:settings.appInstallation')}
            </h2>
          </div>

          <div className="space-y-6">
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t('pages:settings.appInstallPromptDesc')}
            </p>

            {isStandalone && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-sans flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">{t('pages:settings.appInstalledTitle')}</p>
                  <p className="text-xs text-green-400/80">{t('pages:settings.appInstalledDesc')}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleInstallApp}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-display text-sm font-semibold hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                {t('common:actions.installApp')}
              </button>
            </div>
          </div>
        </motion.section>

        {/* Immersive Walkthrough/Installation Guide Modal Overlay */}
        {showInstallGuideModal && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl animate__animated animate__fadeIn">
              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">{t('pages:settings.installGuideTitle')}</h3>
                <p className="font-sans text-xs text-on-surface-variant mt-1">{t('pages:settings.installGuideSubtitle')}</p>
              </div>

              <div className="space-y-4">
                {/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream ? (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                    <p className="font-display font-bold text-primary text-sm flex items-center gap-2">
                      {t('pages:settings.installIosTitle')}
                    </p>
                    <ol className="list-decimal list-inside text-xs sm:text-sm text-on-surface-variant space-y-1 leading-relaxed">
                      <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installIosStep1') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installIosStep2') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installIosStep3') }} />
                      <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installIosStep4') }} />
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-surface-container/50 border border-white/5 space-y-2">
                      <p className="font-display font-bold text-white text-sm flex items-center gap-2">
                        {t('pages:settings.installDesktopTitle')}
                      </p>
                      <p 
                        className="text-xs sm:text-sm text-on-surface-variant leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t('pages:settings.installDesktopDesc') }}
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container/50 border border-white/5 space-y-2">
                      <p className="font-display font-bold text-white text-sm flex items-center gap-2">
                        {t('pages:settings.installAndroidTitle')}
                      </p>
                      <ol className="list-decimal list-inside text-xs sm:text-sm text-on-surface-variant space-y-1 leading-relaxed">
                        <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installAndroidStep1') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('pages:settings.installAndroidStep2') }} />
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="w-full mt-6 bg-primary text-on-primary py-3 rounded-xl font-display text-sm font-semibold uppercase tracking-wider hover:bg-primary/95 transition-colors"
              >
                {t('pages:settings.gotIt')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
