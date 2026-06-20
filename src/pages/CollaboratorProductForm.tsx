import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X, FileText, Image, Video, Globe, Info, AlertTriangle, ShieldCheck, Plus, Trash, Globe2, Tag, Gift, Award, ListFilter, PlayCircle } from 'lucide-react';

interface CollaboratorProductFormProps {
  productId?: string | null;
  onClose: () => void;
  onSaveSuccess: () => void;
  collaboratorPlan: 'ebook_creator' | 'course_creator';
}

interface Category {
  id: string;
  name_pt?: string;
  name_en?: string;
  name_fr?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
}

interface CampaignState {
  banner_text: string;
  special_price: string;
  special_price_aoa: string;
  show_countdown: boolean;
  end_date: string;
  campaign_type: 'discount' | 'special_offer' | 'custom';
}

interface CouponState {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  max_uses: string;
  active: boolean;
  expiration_date: string;
}

interface FAQState {
  question: string;
  answer: string;
  display_order: number;
}

interface BonusState {
  title: string;
  description: string;
  original_value: string;
  display_order: number;
}

interface BenefitState {
  title: string;
  description: string;
  display_order: number;
}

interface TranslationFieldState {
  title: string;
  description: string;
  cta_text: string;
}

export function CollaboratorProductForm({
  productId,
  onClose,
  onSaveSuccess,
  collaboratorPlan
}: CollaboratorProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Dual Pricing (USD and AOA simultaneously)
  const [priceUSD, setPriceUSD] = useState('');
  const [priceAOA, setPriceAOA] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(''); // Youtube URL for free plan
  const [storageUrl, setStorageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ctaText, setCtaText] = useState('Comprar Agora');

  // Customizations
  const [activeTab, setActiveTab] = useState<'details' | 'campaigns' | 'coupons' | 'faqs' | 'bonuses' | 'benefits' | 'translations'>('details');

  const [campaign, setCampaign] = useState<CampaignState>({
    banner_text: '',
    special_price: '',
    special_price_aoa: '',
    show_countdown: false,
    end_date: '',
    campaign_type: 'discount'
  });

  const [coupons, setCoupons] = useState<CouponState[]>([]);
  const [faqs, setFaqs] = useState<FAQState[]>([]);
  const [bonuses, setBonuses] = useState<BonusState[]>([]);
  const [benefits, setBenefits] = useState<BenefitState[]>([]);

  const [translations, setTranslations] = useState<{
    en: TranslationFieldState;
    fr: TranslationFieldState;
  }>({
    en: { title: '', description: '', cta_text: 'Buy Now' },
    fr: { title: '', description: '', cta_text: 'Acheter Maintenant' }
  });

  // Validation feedback triggers
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // New item draft states
  const [newCoupon, setNewCoupon] = useState<CouponState>({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_uses: '',
    active: true,
    expiration_date: ''
  });

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newBonus, setNewBonus] = useState({ title: '', description: '', original_value: '' });
  const [newBenefit, setNewBenefit] = useState({ title: '', description: '' });

  // Licensing state
  const [licenseType, setLicenseType] = useState<'personal' | 'commercial'>('personal');
  const [isLifetime, setIsLifetime] = useState(true);
  const [durationDays, setDurationDays] = useState('365');

  // Upload progress/status
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'youtube' | 'vimeo' | 'wistia' | 'loom' | 'external'>('youtube');

  // Upgrade Plan Stripe Automation State
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProductDetails(productId);
    }
  }, [productId]);

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setSubcategoryId('');
    }
  }, [categoryId]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_pt, name_en, name_fr')
        .order('display_order', { ascending: true });

      if (!error && data) {
        // Filter categories: Only templates, ebooks, libraries, etc.
        // Prevent courses or premium categories unless on a course plan
        const filtered = data.filter(c => {
          const lowerId = c.id.toLowerCase();
          return !lowerId.includes('course') && !lowerId.includes('curso');
        });
        setCategories(filtered);
        if (filtered.length > 0 && !categoryId) {
          setCategoryId(filtered[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function fetchSubcategories(catId: string) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, description')
        .eq('category_id', catId)
        .order('display_order', { ascending: true });
      if (!error && data) {
        setSubcategories(data);
        // Retain current subcategory or default to empty
        if (data.length > 0) {
          // Keep current subcategoryId if it still exists in the newly fetched subcategories
          const exists = data.some(s => s.id === subcategoryId);
          if (!exists) {
            setSubcategoryId('');
          }
        } else {
          setSubcategoryId('');
        }
      }
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  }

  async function fetchProductDetails(id: string) {
    setFetchingProduct(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success && data.products) {
        const prod = data.products.find((p: any) => p.id === id);
        if (prod) {
          setTitle(prod.title || '');
          setDescription(prod.description || '');
          setCategoryId(prod.category_id || '');
          setSubcategoryId(prod.subcategory_id || '');
          setCoverUrl(prod.cover_url || '');
          setPreviewUrl(prod.preview_url || '');
          
          if (prod.video_url?.includes('youtube.com') || prod.video_url?.includes('youtu.be')) {
            setYoutubeVideoUrl(prod.video_url);
            setVideoSourceType('youtube');
            setVideoUrl('');
          } else if (prod.video_url?.includes('vimeo.com')) {
            setYoutubeVideoUrl(prod.video_url);
            setVideoSourceType('vimeo');
            setVideoUrl('');
          } else if (prod.video_url?.includes('wistia.com') || prod.video_url?.includes('wi.st')) {
            setYoutubeVideoUrl(prod.video_url);
            setVideoSourceType('wistia');
            setVideoUrl('');
          } else if (prod.video_url?.includes('loom.com')) {
            setYoutubeVideoUrl(prod.video_url);
            setVideoSourceType('loom');
            setVideoUrl('');
          } else if (prod.video_url && !prod.video_url.includes('supabase') && (prod.video_url.startsWith('http://') || prod.video_url.startsWith('https://'))) {
            setYoutubeVideoUrl(prod.video_url);
            setVideoSourceType('external');
            setVideoUrl('');
          } else {
            setVideoUrl(prod.video_url || '');
            setYoutubeVideoUrl('');
          }
          
          setStorageUrl(prod.storage_url || '');
          setTagsInput(prod.tags ? prod.tags.join(', ') : '');
          setCtaText(prod.cta_text || 'Comprar Agora');

          // Dual Pricing Values
          setPriceUSD(prod.price ? String(prod.price) : '');
          setPriceAOA(prod.aoa_price ? String(prod.aoa_price) : '');

          // Licensing
          const lic = prod.licensing_info || {};
          setLicenseType(lic.type === 'commercial' ? 'commercial' : 'personal');
          setIsLifetime(lic.lifetime !== false);
          setDurationDays(String(lic.duration_days || '365'));

          // Load Customizations
          if (prod.product_campaigns && prod.product_campaigns.length > 0) {
            const camp = prod.product_campaigns[0];
            setCampaign({
              banner_text: camp.badge_text || '',
              special_price: camp.special_price ? String(camp.special_price) : '',
              special_price_aoa: camp.special_price_aoa ? String(camp.special_price_aoa) : '',
              show_countdown: Boolean(camp.countdown_enabled),
              end_date: camp.countdown_end_date ? camp.countdown_end_date.substring(0, 16) : '',
              campaign_type: camp.campaign_type || 'discount'
            });
          }

          if (prod.product_coupons) {
            setCoupons(prod.product_coupons.map((c: any) => ({
              code: c.code || '',
              discount_type: c.discount_type || 'percent',
              discount_value: String(c.discount_value || '0'),
              max_uses: c.max_uses ? String(c.max_uses) : '',
              active: c.active !== false,
              expiration_date: c.expiration_date ? c.expiration_date.substring(0, 10) : ''
            })));
          }

          if (prod.product_faqs) {
            setFaqs(prod.product_faqs.map((f: any) => ({
              question: f.question || '',
              answer: f.answer || '',
              display_order: f.display_order || 0
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.product_bonuses) {
            setBonuses(prod.product_bonuses.map((b: any) => ({
              title: b.title || '',
              description: b.description || '',
              original_value: String(b.original_value || '0'),
              display_order: b.display_order || 0
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.product_benefits) {
            setBenefits(prod.product_benefits.map((b: any) => ({
              title: b.title || '',
              description: b.description || '',
              display_order: b.display_order || 0
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.products_translations) {
            const newTrans = {
              en: { title: '', description: '', cta_text: 'Buy Now' },
              fr: { title: '', description: '', cta_text: 'Acheter Maintenant' }
            };
            prod.products_translations.forEach((t: any) => {
              if (t.language === 'en') {
                newTrans.en = { title: t.title || '', description: t.description || '', cta_text: t.cta_text || 'Buy Now' };
              } else if (t.language === 'fr') {
                newTrans.fr = { title: t.title || '', description: t.description || '', cta_text: t.cta_text || 'Acheter Maintenant' };
              }
            });
            setTranslations(newTrans);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setFormError('Erro ao carregar os detalhes do produto.');
    } finally {
      setFetchingProduct(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: string, fieldSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = bucket;
    setUploadProgress(prev => ({ ...prev, [key]: 'Fazendo upload...' }));
    setFormError(null);

    // Free plan file validation
    if (collaboratorPlan === 'ebook_creator' && bucket === 'ebooks-private') {
      const allowedExts = ['pdf', 'epub', 'docx', 'zip'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(ext)) {
        setUploadProgress(prev => ({ ...prev, [key]: '' }));
        setFormError(`Formatos de arquivos para seu plano grátis são limitados a: ${allowedExts.join(', ').toUpperCase()}.`);
        return;
      }
      
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setUploadProgress(prev => ({ ...prev, [key]: '' }));
        setFormError('O tamanho máximo do arquivo de ebook é 50MB no plano grátis.');
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado.');

      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      if (bucket === 'ebooks-private') {
        fieldSetter(data.path);
        setUploadProgress(prev => ({ ...prev, [key]: 'Concluído! (Arquivo privado salvo)' }));
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        fieldSetter(urlData.publicUrl);
        setUploadProgress(prev => ({ ...prev, [key]: 'Concluído!' }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadProgress(prev => ({ ...prev, [key]: '' }));
      setFormError(`Erro ao fazer upload do ficheiro: ${err.message || err}`);
    }
  };

  const handleUpgradePlan = async () => {
    setIsUpgrading(true);
    setFormError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/upgrade-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setFormError(data.error || 'Erro ao iniciar checkout de upgrade.');
      }
    } catch (err) {
      setFormError('Erro de conexão ao iniciar checkout.');
    } finally {
      setIsUpgrading(false);
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);
    setFormError(null);

    const finalVideoUrl = collaboratorPlan === 'course_creator' ? videoUrl : youtubeVideoUrl;

    if (!title || !description || !categoryId || !priceUSD || !priceAOA || !coverUrl || !storageUrl) {
      setFormError('Por favor preencha todos os campos obrigatórios (incluindo preço em Angola e Internacional) e envie os arquivos necessários.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFormError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const licensingInfo = {
        type: licenseType,
        lifetime: isLifetime,
        duration_days: isLifetime ? null : Number(durationDays)
      };

      const payload = {
        title,
        description,
        categoryId,
        subcategoryId: subcategoryId || null,
        price: Number(priceUSD),
        aoaPrice: Number(priceAOA),
        coverUrl,
        previewUrl,
        videoUrl: finalVideoUrl,
        storageUrl,
        tags,
        ctaText,
        licensingInfo,
        campaign: campaign.banner_text ? campaign : null,
        coupons,
        faqs,
        bonuses,
        benefits,
        translations
      };

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const url = productId 
        ? `${BACKEND_URL}/api/collaborators/products/${productId}`
        : `${BACKEND_URL}/api/collaborators/products`;
      
      const method = productId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onSaveSuccess();
      } else {
        setFormError(data.error || 'Erro ao guardar o produto.');
      }
    } catch (err: any) {
      setFormError('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  // List manipulation helpers
  const addCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount_value) return;
    setCoupons(prev => [...prev, newCoupon]);
    setNewCoupon({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      max_uses: '',
      active: true,
      expiration_date: ''
    });
  };

  const removeCoupon = (index: number) => {
    setCoupons(prev => prev.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    if (!newFaq.question || !newFaq.answer) return;
    setFaqs(prev => [...prev, { ...newFaq, display_order: prev.length }]);
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, display_order: i })));
  };

  const addBonus = () => {
    if (!newBonus.title || !newBonus.description) return;
    setBonuses(prev => [...prev, { ...newBonus, display_order: prev.length }]);
    setNewBonus({ title: '', description: '', original_value: '' });
  };

  const removeBonus = (index: number) => {
    setBonuses(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, display_order: i })));
  };

  const addBenefit = () => {
    if (!newBenefit.title) return;
    setBenefits(prev => [...prev, { ...newBenefit, display_order: prev.length }]);
    setNewBenefit({ title: '', description: '' });
  };

  const removeBenefit = (index: number) => {
    setBenefits(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, display_order: i })));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-xl p-8 max-w-4xl mx-auto shadow-2xl overlay-premium text-white font-sans max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            {productId ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Os produtos salvos serão enviados como rascunhos para aprovação da administração.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-on-surface-variant hover:bg-white/5 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {formError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-4 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'details' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Info size={14} className="inline mr-1.5" /> Detalhes & Preços
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'campaigns' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Gift size={14} className="inline mr-1.5" /> Campanhas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'coupons' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Tag size={14} className="inline mr-1.5" /> Cupons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'faqs' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe size={14} className="inline mr-1.5" /> FAQs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'bonuses' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Award size={14} className="inline mr-1.5" /> Bônus
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('benefits')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'benefits' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <ListFilter size={14} className="inline mr-1.5" /> Vantagens
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('translations')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'translations' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe2 size={14} className="inline mr-1.5" /> Traduções
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'details' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Lado Esquerdo: Metadados */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Guia Completo de CSS Flexbox & Grid"
                  className={`w-full rounded-xl bg-surface-high border px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                    submitAttempted && !title ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {submitAttempted && !title && (
                  <span className="text-[10px] text-red-400 mt-1 block">O título do produto é obrigatório.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Descrição Detalhada *</label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o conteúdo, o que o aluno irá aprender e os requisitos."
                  className={`w-full rounded-xl bg-surface-high border px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none ${
                    submitAttempted && !description ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {submitAttempted && !description && (
                  <span className="text-[10px] text-red-400 mt-1 block">A descrição do produto é obrigatória.</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Categoria *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-high text-white">
                        {c.name_pt || c.name_en || c.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Subcategoria</label>
                  <select
                    value={subcategoryId}
                    onChange={e => setSubcategoryId(e.target.value)}
                    disabled={subcategories.length === 0}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors disabled:opacity-50"
                  >
                    <option value="">Nenhuma subcategoria</option>
                    {subcategories.map(s => (
                      <option key={s.id} value={s.id} className="bg-surface-high text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="flexbox, css, design"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Dual Price Integration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Preço Internacional (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceUSD}
                    onChange={e => setPriceUSD(e.target.value)}
                    placeholder="0.00"
                    className={`w-full rounded-xl bg-surface-high border px-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                      submitAttempted && !priceUSD ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {submitAttempted && !priceUSD && (
                    <span className="text-[10px] text-red-400 mt-1 block">O preço em USD é obrigatório.</span>
                  )}
                  {priceUSD && (
                    <span className="text-[10px] text-green-400 mt-1 block font-mono">
                      Retorno Líquido: ${(Number(priceUSD) * 0.85).toFixed(2)} (Taxa Stripe/Plataforma: -15%)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Preço Angola (AOA) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={priceAOA}
                    onChange={e => setPriceAOA(e.target.value)}
                    placeholder="0"
                    className={`w-full rounded-xl bg-surface-high border px-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                      submitAttempted && !priceAOA ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {submitAttempted && !priceAOA && (
                    <span className="text-[10px] text-red-400 mt-1 block">O preço em AOA é obrigatório.</span>
                  )}
                  {priceAOA && (
                    <span className="text-[10px] text-green-400 mt-1 block font-mono">
                      Retorno Líquido: Kz {(Number(priceAOA) * 0.76).toFixed(0)} (IVA -14%, Plataforma -10%)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Texto do Botão CTA (Compra)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  placeholder="Comprar Agora"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Stripe & FastPay Upgrade Widget inside the form */}
              {collaboratorPlan !== 'course_creator' && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4 mt-4">
                  <div className="flex items-start gap-2.5">
                    <Award className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Publique cursos em vídeo por apenas $9/mês (Aprox. 8.000 Kz)</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Faça o upgrade para o plano <strong>Course Creator</strong> para hospedar seus vídeos e cursos diretamente, obtendo taxa reduzida e outras vantagens exclusivas.
                      </p>
                    </div>
                  </div>

                  {/* Option A: Stripe */}
                  <div className="border-t border-white/5 pt-3">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Opção 1: Cartão de Crédito / Stripe (Cobrança Automática)</span>
                    <button
                      type="button"
                      disabled={isUpgrading}
                      onClick={handleUpgradePlan}
                      className="w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-white hover:bg-primary-high transition-colors disabled:opacity-50"
                    >
                      {isUpgrading ? 'Processando...' : 'Fazer Upgrade via Stripe ($9/mês)'}
                    </button>
                  </div>

                  {/* Option B: FastPay */}
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Opção 2: FastPay / IBAN Local (Sem Débito Automático)</span>
                    <div className="rounded-lg bg-black/30 p-2.5 text-[11px] text-on-surface-variant space-y-1 font-sans">
                      <p className="font-bold text-white">Coordenadas Bancárias (CodeEngine):</p>
                      <p>Banco: <strong className="text-white">BAI</strong></p>
                      <p>IBAN: <strong className="text-white">AO06.0040.0000.1234.5678.9012.3</strong></p>
                      <p>Valor: <strong className="text-white">8.000 Kz / mês</strong></p>
                      <p className="text-yellow-400/90 text-[10px] mt-1.5 font-semibold">
                        * Atenção: Pagamentos manuais via FastPay expiram a cada 30 dias. Um alerta vermelho será exibido antes do encerramento do plano para você reenviar o comprovativo.
                      </p>
                    </div>
                    <a
                      href="https://wa.me/244900000000?text=Olá,%20gostaria%20de%20ativar%20o%20plano%20Course%20Creator%20via%20FastPay"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center rounded-lg bg-green-600/95 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      Enviar Comprovativo FastPay via WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Lado Direito: Arquivos & Licenciamento */}
            <div className="space-y-5">
              {/* Upload Capa */}
              <div className="rounded-xl border border-dashed p-4 bg-white/5">
                <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Image size={16} className="text-on-surface-variant" /> Imagem de Capa (PNG/JPG) *
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => handleFileUpload(e, 'product-covers', setCoverUrl)}
                  className={`block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer ${
                    submitAttempted && !coverUrl ? 'border border-red-500/50 p-2 rounded-xl' : ''
                  }`}
                />
                {submitAttempted && !coverUrl && (
                  <span className="text-[10px] text-red-400 mt-1 block">A imagem de capa é obrigatória.</span>
                )}
                {uploadProgress['product-covers'] && (
                  <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-covers']}</span>
                )}
                {coverUrl && (
                  <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                    <img src={coverUrl} className="w-full h-full object-cover" alt="Preview Capa" />
                  </div>
                )}
              </div>

              {/* Upload Ficheiro do Produto */}
              <div className="rounded-xl border border-dashed p-4 bg-white/5">
                <span className="block text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <FileText size={16} className="text-on-surface-variant" /> Arquivo do Produto (Download Seguro) *
                </span>
                <span className="block text-xs text-on-surface-variant mb-2 font-sans">
                  {collaboratorPlan === 'ebook_creator' 
                    ? 'Limitação do plano grátis: Apenas PDF, EPUB, DOCX, ZIP (Máx. 50MB)'
                    : 'Qualquer formato de arquivo permitido (Máx. 2GB)'}
                </span>
                <input
                  type="file"
                  onChange={e => handleFileUpload(e, 'ebooks-private', setStorageUrl)}
                  className={`block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer ${
                    submitAttempted && !storageUrl ? 'border border-red-500/50 p-2 rounded-xl' : ''
                  }`}
                />
                {submitAttempted && !storageUrl && (
                  <span className="text-[10px] text-red-400 mt-1 block">O arquivo de download do produto é obrigatório.</span>
                )}
                {uploadProgress['ebooks-private'] && (
                  <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['ebooks-private']}</span>
                )}
                {storageUrl && (
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <ShieldCheck size={14} /> Arquivo carregado com sucesso.
                  </div>
                )}
              </div>

              {/* Upload Preview (Opcional) */}
              <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
                <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Globe size={16} className="text-on-surface-variant" /> Ficheiro de Amostra/Preview (PDF/Imagem - Opcional)
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={e => handleFileUpload(e, 'product-previews', setPreviewUrl)}
                  className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
                {uploadProgress['product-previews'] && (
                  <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-previews']}</span>
                )}
                {previewUrl && (
                  <div className="mt-2 text-xs text-on-surface-variant truncate">
                    URL pública da amostra gerada.
                  </div>
                )}
              </div>

              {/* Vídeo de Apresentação (Premium Direct Upload vs Free Youtube Link) */}
              <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
                <span className="block text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Video size={16} className="text-on-surface-variant" /> Vídeo de Introdução (Opcional)
                </span>
                {collaboratorPlan !== 'course_creator' ? (
                  <div className="space-y-2 mt-2">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Origem do Vídeo (Plano Grátis)</label>
                    <select
                      value={videoSourceType}
                      onChange={e => setVideoSourceType(e.target.value as any)}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="youtube">YouTube (Streaming Rápido)</option>
                      <option value="vimeo">Vimeo (Streaming Premium)</option>
                      <option value="wistia">Wistia (Vídeo Marketing)</option>
                      <option value="loom">Loom (Apresentação Rápida)</option>
                      <option value="external">Link Direto / MP4 Externo</option>
                    </select>

                    <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">URL do Vídeo</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Insira o link de compartilhamento..."
                        value={youtubeVideoUrl}
                        onChange={e => setYoutubeVideoUrl(e.target.value)}
                        className="flex-1 rounded-xl bg-surface-high border border-white/10 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                      <span className="flex items-center text-on-surface-variant"><PlayCircle size={18} /></span>
                    </div>
                    <span className="block text-[10px] text-primary leading-normal">
                      Como criador no plano gratuito, você pode hospedar seus vídeos em plataformas externas de streaming rápido. Para fazer upload e hospedagem direta na CodeEngine, faça o upgrade acima.
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={e => handleFileUpload(e, 'product-videos', setVideoUrl)}
                      className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer mt-2"
                    />
                    {uploadProgress['product-videos'] && (
                      <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-videos']}</span>
                    )}
                  </>
                )}
              </div>

              {/* Painel de Licenciamento */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                <span className="block text-sm font-bold text-white mb-3 font-display">Opções de Licenciamento</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Permissões de Uso</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLicenseType('personal')}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                          licenseType === 'personal'
                            ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                            : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Uso Pessoal
                      </button>
                      <button
                        type="button"
                        onClick={() => setLicenseType('commercial')}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                          licenseType === 'commercial'
                            ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                            : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Uso Comercial
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Duração do Acesso</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setIsLifetime(true)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                          isLifetime
                            ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                            : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Acesso Vitalício
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLifetime(false)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                          !isLifetime
                            ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                            : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Tempo Limitado
                      </button>
                    </div>

                    {!isLifetime && (
                      <input
                        type="number"
                        value={durationDays}
                        onChange={e => setDurationDays(e.target.value)}
                        placeholder="Dias de acesso (Ex: 365)"
                        className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-mono"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Customization Section */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-bold font-display">Campanha Promocional</h3>
            <p className="text-xs text-on-surface-variant">Configure um desconto temporário com um banner na página do produto.</p>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Texto do Banner / Badge</label>
              <input
                type="text"
                value={campaign.banner_text}
                onChange={e => setCampaign({ ...campaign, banner_text: e.target.value })}
                placeholder="Ex: 50% de Desconto de Lançamento!"
                className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Preço Promocional Internacional (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={campaign.special_price}
                  onChange={e => setCampaign({ ...campaign, special_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Preço Promocional Angola (AOA)</label>
                <input
                  type="number"
                  step="1"
                  value={campaign.special_price_aoa}
                  onChange={e => setCampaign({ ...campaign, special_price_aoa: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="show_countdown"
                checked={campaign.show_countdown}
                onChange={e => setCampaign({ ...campaign, show_countdown: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-surface-high focus:ring-primary"
              />
              <label htmlFor="show_countdown" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider cursor-pointer">
                Ativar contador regressivo (Cronômetro)
              </label>
            </div>

            {campaign.show_countdown && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Data de Encerramento</label>
                <input
                  type="datetime-local"
                  value={campaign.end_date}
                  onChange={e => setCampaign({ ...campaign, end_date: e.target.value })}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Coupons Customization Section */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="max-w-xl space-y-4">
              <h3 className="text-lg font-bold font-display">Cupons de Desconto</h3>
              <p className="text-xs text-on-surface-variant">Crie cupons personalizados para seus compradores.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Código do Cupom</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: SPECIAL50"
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Tipo de Desconto</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value as 'percent' | 'fixed' })}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Fixo ($ / Kz)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Valor do Desconto</label>
                  <input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                    placeholder="Ex: 50 ou 10"
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Limite de Usos (Opcional)</label>
                  <input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                    placeholder="Ex: 100"
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addCoupon}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Cupom
              </button>
            </div>

            {coupons.length > 0 && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-on-surface-variant font-bold uppercase">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Desconto</th>
                      <th className="px-4 py-3">Limite</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {coupons.map((c, i) => (
                      <tr key={i} className="text-white hover:bg-white/5">
                        <td className="px-4 py-3 font-bold">{c.code}</td>
                        <td className="px-4 py-3">{c.discount_value}{c.discount_type === 'percent' ? '%' : ' Fixo'}</td>
                        <td className="px-4 py-3">{c.max_uses || 'Ilimitado'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeCoupon(i)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-white/5 rounded"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* FAQs Customization Section */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="max-w-xl space-y-4">
              <h3 className="text-lg font-bold font-display">Perguntas Frequentes</h3>
              <p className="text-xs text-on-surface-variant">Esclareça dúvidas comuns dos compradores potenciais.</p>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Pergunta</label>
                <input
                  type="text"
                  value={newFaq.question}
                  onChange={e => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Ex: Como receberei o material?"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Resposta</label>
                <textarea
                  value={newFaq.answer}
                  onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Ex: Imediatamente por e-mail e na sua área de membros após a confirmação do pagamento."
                  rows={3}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar FAQ
              </button>
            </div>

            {faqs.length > 0 && (
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-white mb-1">Q: {f.question}</h4>
                      <p className="text-on-surface-variant text-xs">A: {f.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bonuses Customization Section */}
        {activeTab === 'bonuses' && (
          <div className="space-y-6">
            <div className="max-w-xl space-y-4">
              <h3 className="text-lg font-bold font-display">Bônus Exclusivos</h3>
              <p className="text-xs text-on-surface-variant">Incentive a compra incluindo brindes ou recursos extras.</p>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Título do Bônus</label>
                <input
                  type="text"
                  value={newBonus.title}
                  onChange={e => setNewBonus({ ...newBonus, title: e.target.value })}
                  placeholder="Ex: Planilha de Controle Financeiro"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={newBonus.description}
                  onChange={e => setNewBonus({ ...newBonus, description: e.target.value })}
                  placeholder="Ex: Planilha interativa para planejar e controlar todos os investimentos e despesas."
                  rows={2}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Valor Original Comparativo (USD)</label>
                <input
                  type="number"
                  value={newBonus.original_value}
                  onChange={e => setNewBonus({ ...newBonus, original_value: e.target.value })}
                  placeholder="Ex: 29.90"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addBonus}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Bônus
              </button>
            </div>

            {bonuses.length > 0 && (
              <div className="space-y-3">
                {bonuses.map((b, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-white mb-1">{b.title} <span className="text-[10px] text-green-400 font-mono">(${b.original_value})</span></h4>
                      <p className="text-on-surface-variant text-xs">{b.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBonus(i)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Benefits Customization Section */}
        {activeTab === 'benefits' && (
          <div className="space-y-6">
            <div className="max-w-xl space-y-4">
              <h3 className="text-lg font-bold font-display">Vantagens & Benefícios</h3>
              <p className="text-xs text-on-surface-variant">Liste as principais qualidades ou entregáveis do seu produto.</p>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Vantagem</label>
                <input
                  type="text"
                  value={newBenefit.title}
                  onChange={e => setNewBenefit({ ...newBenefit, title: e.target.value })}
                  placeholder="Ex: Acesso Vitalício com Atualizações Gratuitas"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Descrição Curta</label>
                <textarea
                  value={newBenefit.description}
                  onChange={e => setNewBenefit({ ...newBenefit, description: e.target.value })}
                  placeholder="Ex: Estude no seu próprio ritmo, sem prazos de validade ou expirações."
                  rows={2}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={addBenefit}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Vantagem
              </button>
            </div>

            {benefits.length > 0 && (
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-white mb-1">{b.title}</h4>
                      <p className="text-on-surface-variant text-xs">{b.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(i)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Translations Customization Section */}
        {activeTab === 'translations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-display">Informações em Outros Idiomas</h3>
            <p className="text-xs text-on-surface-variant">Facilite a venda internacional localizando o conteúdo.</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* English Section */}
              <div className="p-5 border border-white/10 rounded-xl bg-white/5 space-y-4">
                <span className="block text-sm font-bold text-white border-b border-white/10 pb-2">Inglês (English)</span>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={translations.en.title}
                    onChange={e => setTranslations({
                      ...translations,
                      en: { ...translations.en, title: e.target.value }
                    })}
                    placeholder="Ex: CSS Flexbox Complete Guide"
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Description *</label>
                  <textarea
                    value={translations.en.description}
                    onChange={e => setTranslations({
                      ...translations,
                      en: { ...translations.en, description: e.target.value }
                    })}
                    placeholder="Detailed explanation in English..."
                    rows={4}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">CTA Button Text</label>
                  <input
                    type="text"
                    value={translations.en.cta_text}
                    onChange={e => setTranslations({
                      ...translations,
                      en: { ...translations.en, cta_text: e.target.value }
                    })}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* French Section */}
              <div className="p-5 border border-white/10 rounded-xl bg-white/5 space-y-4">
                <span className="block text-sm font-bold text-white border-b border-white/10 pb-2">Francês (Français)</span>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Titre *</label>
                  <input
                    type="text"
                    value={translations.fr.title}
                    onChange={e => setTranslations({
                      ...translations,
                      fr: { ...translations.fr, title: e.target.value }
                    })}
                    placeholder="Ex: Guide complet de CSS Flexbox"
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Description *</label>
                  <textarea
                    value={translations.fr.description}
                    onChange={e => setTranslations({
                      ...translations,
                      fr: { ...translations.fr, description: e.target.value }
                    })}
                    placeholder="Detailed explanation in French..."
                    rows={4}
                    className="w-full rounded-xl bg-surface-high border border-white/15 px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Texte du Bouton CTA</label>
                  <input
                    type="text"
                    value={translations.fr.cta_text}
                    onChange={e => setTranslations({
                      ...translations,
                      fr: { ...translations.fr, cta_text: e.target.value }
                    })}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-on-surface hover:bg-white/10 transition-all text-sm font-display uppercase tracking-widest text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-on-surface px-6 py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            ) : <Save size={18} />}
            Guardar Rascunho
          </button>
        </div>
      </form>
    </div>
  );
}
