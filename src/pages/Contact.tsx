import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Users, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactProps {
  setScreen: (screen: string) => void;
}

export function Contact({ setScreen }: ContactProps) {
  const { t } = useTranslation('pages');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'support',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const categories = [
    { value: 'support', label: t('contact.categories.support'), icon: MessageSquare },
    { value: 'partnership', label: t('contact.categories.partnership'), icon: Users },
    { value: 'content', label: t('contact.categories.content'), icon: FileText },
    { value: 'other', label: t('contact.categories.other'), icon: Mail }
  ];

  const WHATSAPP_NUMBER = '244957459336';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const categoryLabel =
        categories.find((c) => c.value === formData.category)?.label || formData.category;
      const text = [
        `*Contato CodeEngine Learn*`,
        ``,
        `Nome: ${formData.name}`,
        `Email: ${formData.email}`,
        `Categoria: ${categoryLabel}`,
        `Assunto: ${formData.subject}`,
        ``,
        formData.message,
      ].join('\n');

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'support',
        message: '',
      });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="pt-40 pb-24 px-4 sm:px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <header className="mb-24 flex flex-col items-start max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6 animate__animated animate__fadeInDown">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-widest uppercase text-primary">
              {t('contact.heroTitle')}
            </span>
          </div>

          <h1 className="animate__animated animate__slideInRight font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant mb-6">
            {t('contact.heroTitle')}
          </h1>

          <p className="animate__animated animate__fadeInUp font-sans text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
            {t('contact.heroSubtitle')}
          </p>
        </motion.div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Categories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-6">
            {t('contact.howCanWeHelp')}
          </h2>
          
          {categories.map((category, index) => (
            <div
              key={category.value}
              className="glass-card rounded-xl p-6 relative group hover:scale-105 transition-transform duration-300"
            >
              <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-6 h-6 text-primary" />
                </div>
                
                <div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">
                    {category.label}
                  </h3>
                  <p className="font-sans text-sm text-on-surface-variant">
                    {category.value === 'support' && t('contact.categories.supportDesc')}
                    {category.value === 'partnership' && t('contact.categories.partnershipDesc')}
                    {category.value === 'content' && t('contact.categories.contentDesc')}
                    {category.value === 'other' && t('contact.categories.otherDesc')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Info Box */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-white mb-4">
              {t('contact.responseTime')}
            </h3>
            <p className="font-sans text-sm text-on-surface-variant mb-4">
              {t('contact.responseTimeDesc')}
            </p>
            <p className="font-sans text-xs text-on-surface-variant">
              {t('contact.premiumSupport')}
            </p>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="glass-panel rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,193,255,0.15)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0"></div>
            
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="font-display text-3xl font-bold text-white mb-4">
                  {t('contact.formSuccess.title')}
                </h3>
                <p className="font-sans text-lg text-on-surface-variant mb-8">
                  {t('contact.formSuccess.desc')}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
                >
                  {t('contact.formSuccess.button')}
                </button>
              </motion.div>
            ) : status === 'error' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="font-display text-3xl font-bold text-white mb-4">
                  {t('contact.formError.title')}
                </h3>
                <p className="font-sans text-lg text-on-surface-variant mb-8">
                  {t('contact.formError.desc')}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="font-display text-sm font-semibold tracking-widest uppercase px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all"
                >
                  {t('contact.formError.button')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block font-display text-sm font-semibold text-white mb-2">
                      {t('contact.name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('contact.namePlaceholder')}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-display text-sm font-semibold text-white mb-2">
                      {t('contact.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block font-display text-sm font-semibold text-white mb-2">
                      {t('contact.category')}
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-surface">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Subject */}
                  <div>
                    <label className="block font-display text-sm font-semibold text-white mb-2">
                      {t('contact.subject')}
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('contact.subjectPlaceholder')}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block font-display text-sm font-semibold text-white mb-2">
                    {t('contact.message')}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full md:w-auto font-display text-sm font-semibold tracking-widest uppercase px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary hover:shadow-[0_0_40px_rgba(192,193,255,0.5)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                      {t('contact.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('contact.send')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-24"
      >
        <h2 className="font-display text-4xl font-bold text-white mb-12 text-center">
          {t('contact.faq.title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {t('contact.faq.questions', { returnObjects: true }).map((faq: { q: string; a: string }, index: number) => (
            <div
              key={index}
              className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-300"
            >
              <h3 className="font-display text-lg font-semibold text-white mb-3">
                {faq.q}
              </h3>
              <p className="font-sans text-sm text-on-surface-variant">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
