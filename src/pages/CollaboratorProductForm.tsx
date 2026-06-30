import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X, FileText, Image, Video, Globe, Info, AlertTriangle, ShieldCheck, Plus, Trash, Globe2, Tag, Gift, Award, ListFilter, PlayCircle, BookOpen, Layers, DollarSign, Landmark, CheckCircle, Percent, Eye, ArrowLeft } from 'lucide-react';
import { CurriculumEditor } from '../components/collaborator/CurriculumEditor';
import { CustomSectionsLocalManager, CustomSectionState } from '../components/collaborator/CustomSectionsLocalManager';
import { CardFanCarousel } from '../components/ui/CardFanCarousel';
import { ScrollTiedBackground } from '../components/ui/ScrollTiedBackground';
import { ShaderCanvas, DEFAULT_SHADER_CONFIG, ShaderConfig } from '../components/ui/ShaderCanvas';
import { Product as ProductPage } from './Product';
import { useUserCountry } from '../contexts/UserCountryContext';
import { useLocale } from '../contexts/LocaleContext';
import { useTranslation } from 'react-i18next';

interface CollaboratorProductFormProps {
  productId?: string | null;
  onClose: () => void;
  onSaveSuccess: () => void;
  collaboratorPlan: 'ebook_creator' | 'course_creator';
}

interface Category {
  id: string;
  name: string;
  isPremiumLocked?: boolean;
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
  linked_product_id?: string | null;
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
  cover_url?: string;
  preview_url?: string;
  storage_url?: string;
}

export function CollaboratorProductForm({
  productId,
  onClose,
  onSaveSuccess,
  collaboratorPlan
}: CollaboratorProductFormProps) {
  const { isAngola } = useUserCountry();
  const { locale } = useLocale();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Dual Pricing (USD and AOA simultaneously)
  const [priceUSD, setPriceUSD] = useState('');
  const [profitUSD, setProfitUSD] = useState('');
  const [priceAOA, setPriceAOA] = useState('');
  const [profitAOA, setProfitAOA] = useState('');
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useState('0');

  // Currency Conversion States
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'AOA'>('USD');
  const [basePrice, setBasePrice] = useState('');
  const [usdToAoaRate, setUsdToAoaRate] = useState<number>(920);
  const [loadingRate, setLoadingRate] = useState(false);

  // ============================================================
  // LIMITES DE PREÇO
  // ============================================================
  const MAX_PRICE_USD = 900000;    // $900.000
  const MAX_PRICE_AOA = 9000000000000; // Kz 9.000.000.000.000
  const MIN_PRICE_AOA = 1000;      // Kz 1.000

  // ============================================================
  // USD PRICING: Two-Way Binding — 20% taxa, mín. $0.50
  // ============================================================
  const USD_FEE_RATE = 0.20;
  const USD_FEE_MIN  = 0.50;

  function calcUsdFeeAndProfit(price: number) {
    const fee    = Math.max(price * USD_FEE_RATE, USD_FEE_MIN);
    const profit = Math.max(0, price - fee);
    return { fee, profit };
  }

  function handlePriceChange(val: string) {
    const v = Number(val);
    let finalVal = val;
    if (val && v > MAX_PRICE_USD) { 
      setPriceUSD(String(MAX_PRICE_USD)); 
      finalVal = String(MAX_PRICE_USD); 
    } else { 
      setPriceUSD(val); 
    }
    setBasePrice(finalVal);
    if (finalVal && !isNaN(Number(finalVal)) && Number(finalVal) > 0) {
      const { profit } = calcUsdFeeAndProfit(Number(finalVal));
      setProfitUSD(profit.toFixed(2));
    } else {
      setProfitUSD('');
    }
  }

  function handleProfitChange(val: string) {
    setProfitUSD(val);
    const p = Number(val);
    if (val && !isNaN(p) && p > 0) {
      let newPrice: number;
      if (p <= 2.00) {
        newPrice = p + USD_FEE_MIN;
      } else {
        newPrice = p / (1 - USD_FEE_RATE);
      }
      if (newPrice > MAX_PRICE_USD) newPrice = MAX_PRICE_USD;
      const formatted = newPrice.toFixed(2);
      setPriceUSD(formatted);
      setBasePrice(formatted);
    } else {
      setPriceUSD('');
      setBasePrice('');
    }
  }

  const usdPriceSummary = (() => {
    if (!priceUSD || isNaN(Number(priceUSD)) || Number(priceUSD) <= 0) return null;
    const price = Number(priceUSD);
    if (price < 1.00) return null;
    const { fee, profit } = calcUsdFeeAndProfit(price);
    const feePercent = ((fee / price) * 100).toFixed(0);
    return { price, fee, profit, feePercent };
  })();

  // ============================================================
  // AOA PRICING: Two-Way Binding — Taxa CE (10%/15%) + FaciPay
  // ============================================================
  const AOA_CE_RATE = collaboratorPlan === 'course_creator' ? 0.15 : 0.10;
  const AOA_FACIPAY_RATE = 0.007;   // 0.7%
  const AOA_FACIPAY_MIN  = 300;     // Kz 300 piso
  const AOA_IVA          = 1.14;    // 14% IVA sobre FaciPay
  const AOA_FACIPAY_FIXED = AOA_FACIPAY_MIN * AOA_IVA; // 342 AOA
  const AOA_FACIPAY_PCTG  = AOA_FACIPAY_RATE * AOA_IVA; // 0.00798
  const AOA_TURNOVER      = 42857.14; // Ponto de viragem

  function calcAoaFees(price: number) {
    const ceFee      = price * AOA_CE_RATE;
    const facipayFee = Math.max(price * AOA_FACIPAY_RATE, AOA_FACIPAY_MIN) * AOA_IVA;
    const profit     = Math.max(0, price - ceFee - facipayFee);
    return { ceFee, facipayFee, profit };
  }

  function handlePriceAoaChange(val: string) {
    const v = Number(val);
    if (val && v > MAX_PRICE_AOA) { setPriceAOA(String(MAX_PRICE_AOA)); val = String(MAX_PRICE_AOA); }
    else { setPriceAOA(val); }
    if (val && !isNaN(v) && v > 0) {
      const { profit } = calcAoaFees(v);
      setProfitAOA(profit.toFixed(2));
    } else {
      setProfitAOA('');
    }
  }

  function handleProfitAoaChange(val: string) {
    setProfitAOA(val);
    const L = Number(val);
    if (val && !isNaN(L) && L > 0) {
      // Cenário A: P = (L + 342) / (1 - C)
      let P = (L + AOA_FACIPAY_FIXED) / (1 - AOA_CE_RATE);
      // Se P > ponto de viragem, usar cenário B
      if (P > AOA_TURNOVER) {
        P = L / (1 - AOA_CE_RATE - AOA_FACIPAY_PCTG);
      }
      if (P > MAX_PRICE_AOA) P = MAX_PRICE_AOA;
      setPriceAOA(Math.ceil(P).toString());
    } else {
      setPriceAOA('');
    }
  }

  const aoaPriceSummary = (() => {
    if (!priceAOA || isNaN(Number(priceAOA)) || Number(priceAOA) <= 0) return null;
    const price = Number(priceAOA);
    if (price < MIN_PRICE_AOA) return null;
    const { ceFee, facipayFee, profit } = calcAoaFees(price);
    const cePct = (AOA_CE_RATE * 100).toFixed(0);
    return { price, ceFee, facipayFee, profit, cePct };
  })();
  // Currency Conversion hook & helper
  useEffect(() => {
    async function fetchExchangeRate() {
      setLoadingRate(true);
      try {
        const cached = localStorage.getItem('codeengine_usd_aoa_rate');
        if (cached) {
          setUsdToAoaRate(Number(cached));
        }
        
        const res = await fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json');
        if (!res.ok) throw new Error('API response not ok');
        const data = await res.json();
        const rate = data.usd?.aoa;
        if (rate && !isNaN(rate) && rate > 0) {
          setUsdToAoaRate(rate);
          localStorage.setItem('codeengine_usd_aoa_rate', String(rate));
          console.log(`Loaded exchange rate: 1 USD = ${rate} AOA`);
        }
      } catch (err) {
        console.warn('Failed to fetch latest exchange rate, using cached/fallback:', err);
      } finally {
        setLoadingRate(false);
      }
    }
    fetchExchangeRate();
  }, []);

  function syncPrices(amount: string, currency: 'USD' | 'AOA', rateToUse = usdToAoaRate) {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setPriceUSD('');
      setPriceAOA('');
      setProfitUSD('');
      setProfitAOA('');
      return;
    }
    
    const val = Number(amount);
    if (currency === 'USD') {
      const usdVal = val > MAX_PRICE_USD ? MAX_PRICE_USD : val;
      const aoaVal = Math.round(usdVal * rateToUse);
      
      setPriceUSD(usdVal.toFixed(2));
      setPriceAOA(aoaVal.toString());
      
      const { profit: profUSD } = calcUsdFeeAndProfit(usdVal);
      setProfitUSD(profUSD.toFixed(2));
      
      const { profit: profAOA } = calcAoaFees(aoaVal);
      setProfitAOA(profAOA.toFixed(2));
    } else {
      const aoaVal = val > MAX_PRICE_AOA ? MAX_PRICE_AOA : val;
      const usdVal = Number((aoaVal / rateToUse).toFixed(2));
      
      setPriceUSD(usdVal.toFixed(2));
      setPriceAOA(aoaVal.toString());
      
      const { profit: profUSD } = calcUsdFeeAndProfit(usdVal);
      setProfitUSD(profUSD.toFixed(2));
      
      const { profit: profAOA } = calcAoaFees(aoaVal);
      setProfitAOA(profAOA.toFixed(2));
    }
  }


  const [coverUrl, setCoverUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(''); // Youtube URL for free plan
  const [storageUrl, setStorageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ctaText, setCtaText] = useState('Comprar Agora');

  // Customizations
  const [themeVideoPath, setThemeVideoPath] = useState('');
  const [themeVideoConfig, setThemeVideoConfig] = useState({
    videoOpacity: 0.25,
    overlayOpacity: 0.7,
    sectionOpacity: 0.1,
    blurAmount: 8
  });
  const [shaderConfig, setShaderConfig] = useState<ShaderConfig>(DEFAULT_SHADER_CONFIG);
  const [showPreview, setShowPreview] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'campaigns' | 'coupons' | 'faqs' | 'bonuses' | 'benefits' | 'translations' | 'curriculum' | 'sections' | 'theme'>('details');

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
  const [customSections, setCustomSections] = useState<CustomSectionState[]>([]);
  const [collaboratorProducts, setCollaboratorProducts] = useState<any[]>([]);
  const [isFree, setIsFree] = useState(false);

  const [translations, setTranslations] = useState<{
    pt: TranslationFieldState;
    en: TranslationFieldState;
    fr: TranslationFieldState;
  }>({
    pt: { title: '', description: '', cta_text: 'Comprar Agora', cover_url: '', preview_url: '', storage_url: '' },
    en: { title: '', description: '', cta_text: 'Buy Now', cover_url: '', preview_url: '', storage_url: '' },
    fr: { title: '', description: '', cta_text: 'Acheter Maintenant', cover_url: '', preview_url: '', storage_url: '' }
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
  const [newBonus, setNewBonus] = useState({ title: '', description: '', original_value: '', linked_product_id: '' });
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
    fetchCollaboratorProducts();
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

  async function fetchCollaboratorProducts() {
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
        // Exclude current product being edited
        const filtered = data.products.filter((p: any) => p.id !== productId);
        setCollaboratorProducts(filtered);
      }
    } catch (e) {
      console.error('Error fetching collaborator products for linked bonuses:', e);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('display_order', { ascending: true });

      if (!error && data) {
        // Map categories and flag course-related ones as locked for free users
        const mapped = data.map(c => {
          const lowerName = (c.name || '').toLowerCase();
          const isCourse = lowerName.includes('course') || lowerName.includes('curso');
          if (isCourse && collaboratorPlan === 'ebook_creator') {
            return {
              ...c,
              name: `${c.name} (Premium)`,
              isPremiumLocked: true
            };
          }
          return {
            ...c,
            isPremiumLocked: false
          };
        });
        
        setCategories(mapped);
        
        // Find first unlocked category as default if categoryId is empty
        if (mapped.length > 0 && !categoryId) {
          const firstUnlocked = mapped.find(c => !c.isPremiumLocked) || mapped[0];
          setCategoryId(firstUnlocked.id);
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
        .select('id, category_id, name, description')
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
          setThemeVideoPath(prod.theme_video_path || '');
          if (prod.theme_video_config) {
            setThemeVideoConfig({
              videoOpacity: prod.theme_video_config.videoOpacity ?? 0.25,
              overlayOpacity: prod.theme_video_config.overlayOpacity ?? 0.7,
              sectionOpacity: prod.theme_video_config.sectionOpacity ?? 0.1,
              blurAmount: prod.theme_video_config.blurAmount ?? 8
            });
          }

          // Dual Pricing Values
          setPriceUSD(prod.price ? String(prod.price) : '');
          setPriceAOA(prod.aoa_price ? String(prod.aoa_price) : '');
          const loadedBaseCurrency = prod.base_currency || (isAngola && prod.aoa_price ? 'AOA' : 'USD');
          setBaseCurrency(loadedBaseCurrency);
          if (prod.is_free) {
            setBasePrice('0');
          } else {
            const loadedBasePrice = loadedBaseCurrency === 'USD' ? (prod.price ? String(prod.price) : '') : (prod.aoa_price ? String(prod.aoa_price) : '');
            setBasePrice(loadedBasePrice);
          }
          setIsFree(Boolean(prod.is_free));
          setAffiliateEnabled(Boolean(prod.affiliate_enabled));
          setAffiliateCommissionPct(prod.affiliate_commission_pct ? String(prod.affiliate_commission_pct) : '0');

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
              display_order: b.display_order || 0,
              linked_product_id: b.linked_product_id || null,
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.product_benefits) {
            setBenefits(prod.product_benefits.map((b: any) => ({
              title: b.title || '',
              description: b.description || '',
              display_order: b.display_order || 0
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.product_custom_sections) {
            setCustomSections(prod.product_custom_sections.map((s: any) => ({
              id: s.id,
              section_type: s.section_type || 'text',
              title: s.title || '',
              content: s.content || '',
              display_order: s.display_order || 0,
              is_active: s.is_active !== false
            })).sort((a: any, b: any) => a.display_order - b.display_order));
          }

          if (prod.products_translations) {
            const newTrans = {
              pt: { title: '', description: '', cta_text: 'Comprar Agora', cover_url: '', preview_url: '', storage_url: '' },
              en: { title: '', description: '', cta_text: 'Buy Now', cover_url: '', preview_url: '', storage_url: '' },
              fr: { title: '', description: '', cta_text: 'Acheter Maintenant', cover_url: '', preview_url: '', storage_url: '' }
            };
            prod.products_translations.forEach((t: any) => {
              const langKey = t.language as 'pt' | 'en' | 'fr';
              if (newTrans[langKey]) {
                newTrans[langKey] = {
                  title: t.title || '',
                  description: t.description || '',
                  cta_text: t.cta_text || (langKey === 'pt' ? 'Comprar Agora' : langKey === 'fr' ? 'Acheter Maintenant' : 'Buy Now'),
                  cover_url: t.cover_url || '',
                  preview_url: t.preview_url || '',
                  storage_url: t.storage_url || ''
                };
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
      const allowedExts = ['pdf', 'epub', 'docx', 'zip', 'mp3', 'wav', 'm4a'];
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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Utilizador não autenticado.');

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

      if (bucket !== 'avatars') {
        try {
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const token = session?.access_token;
          if (!token) throw new Error('Sessão expirada. Autentique-se novamente.');

          const presignedResponse = await fetch(`${BACKEND_URL}/api/admin/storage/presigned-upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              bucketName: bucket,
              filePath: fileName,
              contentType: file.type || 'application/octet-stream'
            })
          });

          if (!presignedResponse.ok) {
            const errData = await presignedResponse.json().catch(() => ({}));
            throw new Error(errData.error || `Erro de assinatura de upload (${presignedResponse.status})`);
          }

          const { uploadUrl, dbPath } = await presignedResponse.json();
          if (!uploadUrl) {
            throw new Error('Pre-signed URL não retornada pelo servidor.');
          }

          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            body: file
          });

          if (!putRes.ok) {
            throw new Error(`R2 upload failed with status ${putRes.status}`);
          }

          fieldSetter(dbPath);
          const successMsg = bucket === 'ebooks-private' ? 'Concluído! (Arquivo privado salvo)' : 'Concluído!';
          setUploadProgress(prev => ({ ...prev, [key]: successMsg }));
          return;
        } catch (r2Err: any) {
          console.warn('R2 upload failed, falling back to Supabase:', r2Err);
        }
      }

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

  const handleTranslationFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: string,
    lang: 'en' | 'fr',
    field: 'cover_url' | 'preview_url' | 'storage_url'
  ) => {
    await handleFileUpload(e, bucket, (url) => {
      setTranslations(prev => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [field]: url
        }
      }));
    });
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

    // USD é obrigatório para TODOS os colaboradores. AOA é obrigatório apenas para angolanos.
    const isPriceValid = isFree || (priceUSD && (!isAngola || priceAOA));

    if (!title || !description || !categoryId || !isPriceValid || !coverUrl || !storageUrl) {
      setFormError('Por favor preencha todos os campos obrigatórios. O preço em USD (dólar) é obrigatório para todos os colaboradores.');
      setLoading(false);
      return;
    }


    if (!isFree) {
      if (Number(priceUSD) <= 0 || Number(priceUSD) > MAX_PRICE_USD) {
        setFormError(`O preço em USD deve ser maior que $0 e menor ou igual a $${MAX_PRICE_USD.toLocaleString('pt-AO')}.`);
        setLoading(false);
        return;
      }
      if (isAngola && (Number(priceAOA) < MIN_PRICE_AOA || Number(priceAOA) > MAX_PRICE_AOA)) {
        setFormError(`O preço em AOA deve estar entre Kz ${MIN_PRICE_AOA.toLocaleString('pt-AO')} e Kz ${MAX_PRICE_AOA.toLocaleString('pt-AO')}.`);
        setLoading(false);
        return;
      }
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
        price: isFree ? 0 : Number(priceUSD),
        aoaPrice: isFree ? 0 : (isAngola ? Number(priceAOA) : 0),
        basePrice: isFree ? 0 : Number(basePrice),
        baseCurrency,
        convertedPrice: isFree ? 0 : (baseCurrency === 'USD' ? Number(priceAOA) : Number(priceUSD)),
        exchangeRateUsed: usdToAoaRate,
        isFree,
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
        customSections,
        affiliateEnabled,
        affiliateCommissionPct: Number(affiliateCommissionPct) || 0,
        themeVideoPath: themeVideoPath || null,
        themeVideoConfig,
        primaryLanguage: locale,
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

  async function handleSaveTheme() {
    if (!productId) return;
    setThemeSaving(true);
    setThemeSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão inválida');
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ themeVideoPath, themeVideoConfig })
      });
      const data = await res.json();
      if (data.success) {
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 3000);
      }
    } catch (_) {}
    finally { setThemeSaving(false); }
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
    setNewBonus({ title: '', description: '', original_value: '', linked_product_id: '' });
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

  const translationLanguages = locale === 'en'
    ? [
        { code: 'pt' as const, name: 'Português (Portuguese)', titleLabel: 'Título', descLabel: 'Descrição', ctaLabel: 'Texto do Botão CTA', exTitle: 'Ex: Guia Completo de CSS Flexbox', ctaDefault: 'Comprar Agora' },
        { code: 'fr' as const, name: 'Francês (Français)', titleLabel: 'Titre', descLabel: 'Description', ctaLabel: 'Texte du Bouton CTA', exTitle: 'Ex: Guide complet de CSS Flexbox', ctaDefault: 'Acheter Maintenant' }
      ]
    : locale === 'fr'
    ? [
        { code: 'pt' as const, name: 'Português (Portuguese)', titleLabel: 'Título', descLabel: 'Descrição', ctaLabel: 'Texto do Botão CTA', exTitle: 'Ex: Guia Completo de CSS Flexbox', ctaDefault: 'Comprar Agora' },
        { code: 'en' as const, name: 'Inglês (English)', titleLabel: 'Title', descLabel: 'Description', ctaLabel: 'CTA Button Text', exTitle: 'Ex: CSS Flexbox Complete Guide', ctaDefault: 'Buy Now' }
      ]
    : [
        { code: 'en' as const, name: 'Inglês (English)', titleLabel: 'Title', descLabel: 'Description', ctaLabel: 'CTA Button Text', exTitle: 'Ex: CSS Flexbox Complete Guide', ctaDefault: 'Buy Now' },
        { code: 'fr' as const, name: 'Francês (Français)', titleLabel: 'Titre', descLabel: 'Description', ctaLabel: 'Texte du Bouton CTA', exTitle: 'Ex: Guide complet de CSS Flexbox', ctaDefault: 'Acheter Maintenant' }
      ];

  return (
    <div className="collab-compact-wrapper h-full">
    <div className="text-white font-sans w-full h-full flex flex-col">
      <div className="p-2 sm:p-3 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white font-display">
            {productId ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h2>
          <p className="text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5">
            Os produtos salvos serão enviados como rascunhos para aprovação da administração.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-on-surface transition-all cursor-pointer whitespace-nowrap"
          >
            Sair sem Salvar
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-100 disabled:opacity-50 text-xs font-bold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
            ) : <Save size={12} />}
            <span>Salvar Rascunho</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div 
        className="px-2 py-1 shrink-0 border-b border-white/10 flex flex-row overflow-x-auto whitespace-nowrap bg-surface-container/10 gap-1 scrollbar-none flex-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'details' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Info size={13} className="inline mr-1" /> Detalhes & Preços
        </button>

        {(() => {
          const selectedCategory = categories.find(c => c.id === categoryId);
          const isCourse = selectedCategory ? (
            selectedCategory.name.toLowerCase().includes('curso') ||
            selectedCategory.name.toLowerCase().includes('course') ||
            selectedCategory.name.toLowerCase().includes('série') ||
            selectedCategory.name.toLowerCase().includes('serie') ||
            selectedCategory.name.toLowerCase().includes('vídeo') ||
            selectedCategory.name.toLowerCase().includes('video') ||
            selectedCategory.name.toLowerCase().includes('tutorial')
          ) : false;

          return isCourse && (
            <button
              type="button"
              onClick={() => {
                if (productId) {
                  setActiveTab('curriculum');
                } else {
                  alert('Por favor, salve os detalhes básicos do produto primeiro antes de editar a grade curricular.');
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'curriculum' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              } ${!productId ? 'opacity-50' : ''}`}
            >
              <BookOpen size={13} className="inline mr-1" /> Grade Curricular {!productId && '(Salvar 1º)'}
            </button>
          );
        })()}

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'sections' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={13} className="inline mr-1" /> Seções Extras
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'campaigns' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Gift size={13} className="inline mr-1" /> Campanhas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'coupons' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Tag size={13} className="inline mr-1" /> Cupons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'faqs' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe size={13} className="inline mr-1" /> FAQs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bonuses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'bonuses' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Award size={13} className="inline mr-1" /> Bônus
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('benefits')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'benefits' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <ListFilter size={13} className="inline mr-1" /> Vantagens
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('translations')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'translations' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe2 size={13} className="inline mr-1" /> Traduções
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'theme' ? 'bg-white/10 text-white' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <Video size={13} className="inline mr-1" /> Tema 3D
        </button>
      </div>

      <form id="product-form" onSubmit={handleSave} className="flex-grow flex flex-col overflow-hidden min-h-0">
        <div className="flex-grow overflow-y-auto p-2 sm:p-3 space-y-3 sm:space-y-4">
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
                  rows={3}
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
                    onChange={e => {
                      const selected = categories.find(c => c.id === e.target.value);
                      if (selected?.isPremiumLocked) {
                        alert("Esta categoria requer o Plano Premium (Course Creator). Por favor, ative a sua assinatura premium no painel para publicar Cursos Online.");
                      } else {
                        setCategoryId(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-high text-white">
                        {c.name}
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

              {/* Free Option */}
              <div className="flex items-center gap-2 mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={isFree}
                  onChange={e => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) {
                      setPriceUSD('0');
                      setPriceAOA('0');
                    } else {
                      setPriceUSD('');
                      setPriceAOA('');
                    }
                  }}
                  className="rounded border-white/10 bg-surface-high focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isFree" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Tornar este produto grátis (free)
                </label>
              </div>

              {/* USD and AOA Pricing Section */}
              {isAngola ? (
                <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white">Configuração de Preços</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Base Currency Selection */}
                    <div>
                      <label htmlFor="base_currency" className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Moeda Base {!isFree && <span className="text-red-400">*</span>}
                      </label>
                      <select
                        id="base_currency"
                        value={baseCurrency}
                        disabled={isFree}
                        onChange={(e) => {
                          const newCurr = e.target.value as 'USD' | 'AOA';
                          setBaseCurrency(newCurr);
                          syncPrices(basePrice, newCurr);
                        }}
                        className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="USD" className="bg-surface-high text-white">USD (Dólar)</option>
                        <option value="AOA" className="bg-surface-high text-white">AOA (Kwanza)</option>
                      </select>
                    </div>

                    {/* Base Price Input */}
                    <div>
                      <label htmlFor="base_price" className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Preço Principal ({baseCurrency}) {!isFree && <span className="text-red-400">*</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-on-surface-variant text-sm font-mono">
                          {baseCurrency === 'USD' ? '$' : 'Kz'}
                        </span>
                        <input
                          type="number"
                          id="base_price"
                          step={baseCurrency === 'USD' ? '0.01' : '1'}
                          min="0"
                          required={!isFree}
                          disabled={isFree}
                          value={isFree ? '0.00' : basePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBasePrice(val);
                            syncPrices(val, baseCurrency);
                          }}
                          placeholder="0.00"
                          className={`w-full rounded-xl bg-surface-high border pl-8 pr-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                            submitAttempted && !isFree && !basePrice ? 'border-red-500/50' : 'border-white/10'
                          } ${isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Converted Price Display */}
                  {!isFree && (
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        Preço Convertido ({baseCurrency === 'USD' ? 'AOA' : 'USD'})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-on-surface-variant/70 text-sm font-mono">
                          {baseCurrency === 'USD' ? 'Kz' : '$'}
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={
                            baseCurrency === 'USD'
                              ? priceAOA
                                ? Number(priceAOA).toLocaleString('pt-AO')
                                : '0'
                              : priceUSD
                              ? Number(priceUSD).toFixed(2)
                              : '0.00'
                          }
                          className="w-full rounded-xl bg-surface-high/50 border border-white/5 pl-8 pr-4 py-3 text-sm text-white/50 font-bold font-mono cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant/70 mt-1">
                        Taxa de câmbio usada: 1 USD = {usdToAoaRate.toLocaleString('pt-AO')} AOA
                      </p>
                    </div>
                  )}

                  {/* Pricing Summaries */}
                  {!isFree && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {/* USD Summary Card */}
                      {usdPriceSummary && (
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                          <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FileText size={12} /> Resumo Internacional (USD)
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Preço cobrado:</span>
                            <span className="font-mono font-bold text-white">${usdPriceSummary.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Taxa plataforma ({usdPriceSummary.feePercent}%, min. $0.50):</span>
                            <span className="font-mono font-semibold text-red-400">-${usdPriceSummary.fee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-primary/20 pt-2 flex items-center">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <CheckCircle size={12} className="text-green-400" /> Lucro estimado:
                            </span>
                            <span className="font-mono font-bold text-green-400">${usdPriceSummary.profit.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* AOA Summary Card */}
                      {aoaPriceSummary && (
                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <FileText size={12} /> Resumo Nacional (AOA)
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Preço cobrado:</span>
                            <span className="font-mono font-bold text-white">Kz {aoaPriceSummary.price.toLocaleString('pt-AO')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Taxa CodeEngine ({aoaPriceSummary.cePct}%):</span>
                            <span className="font-mono font-semibold text-red-400">-Kz {aoaPriceSummary.ceFee.toLocaleString('pt-AO')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Taxa Facipay:</span>
                            <span className="font-mono font-semibold text-red-400">-Kz {aoaPriceSummary.facipayFee.toLocaleString('pt-AO')}</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-amber-500/20 pt-2 flex items-center">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <CheckCircle size={12} className="text-green-400" /> Lucro estimado:
                            </span>
                            <span className="font-mono font-bold text-green-400">Kz {aoaPriceSummary.profit.toLocaleString('pt-AO')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isFree && priceUSD && Number(priceUSD) < 1 && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> O preço mínimo internacional é $1.00.
                    </p>
                  )}
                  {!isFree && priceAOA && Number(priceAOA) < MIN_PRICE_AOA && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> O preço mínimo nacional é Kz {MIN_PRICE_AOA.toLocaleString('pt-AO')}.
                    </p>
                  )}
                  {submitAttempted && !isFree && !basePrice && (
                    <p className="text-[11px] text-red-400">O preço principal é obrigatório.</p>
                  )}
                </div>
              ) : (
                /* Original USD-only UI for international creators */
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} className="text-primary" /> Preço Internacional (USD) {!isFree && <span className="text-red-400">*</span>}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Input A: Preço do Produto */}
                    <div>
                      <label className="block text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">Preço que o cliente paga</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-on-surface-variant text-sm font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required={!isFree}
                          disabled={isFree}
                          value={isFree ? '0.00' : priceUSD}
                          onChange={e => handlePriceChange(e.target.value)}
                          placeholder="0.00"
                          className={`w-full rounded-xl bg-surface-high border pl-8 pr-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                            submitAttempted && !isFree && !priceUSD ? 'border-red-500/50' : 'border-white/10'
                          } ${isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">Mínimo: $1.00</p>
                    </div>

                    {/* Input B: Lucro Desejado (inverso) */}
                    <div>
                      <label className="block text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">Quero lucrar (inverso)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-on-surface-variant text-sm font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isFree}
                          value={isFree ? '0.00' : profitUSD}
                          onChange={e => handleProfitChange(e.target.value)}
                          placeholder="0.00"
                          className={`w-full rounded-xl bg-surface-high border border-white/10 pl-8 pr-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                            isFree ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">Digite o lucro → preço é calculado</p>
                    </div>
                  </div>

                  {/* Card de resumo em tempo real */}
                  {!isFree && usdPriceSummary && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FileText size={12} /> Resumo da Precificação
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">Preço que o cliente paga:</span>
                        <span className="font-mono font-bold text-white">${usdPriceSummary.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">Taxa da plataforma ({usdPriceSummary.feePercent}%, mín. $0.50):</span>
                        <span className="font-mono font-semibold text-red-400">-${usdPriceSummary.fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-primary/20 pt-2 flex items-center">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-green-400" /> Seu lucro estimado:
                        </span>
                        <span className="font-mono font-bold text-green-400">${usdPriceSummary.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  {!isFree && priceUSD && Number(priceUSD) < 1 && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> O preço mínimo do produto é $1.00.
                    </p>
                  )}
                  {submitAttempted && !isFree && !priceUSD && (
                    <p className="text-[11px] text-red-400">O preço em USD é obrigatório.</p>
                  )}
                </div>
              )}

              {/* Affiliate Program Settings */}
              <div className="space-y-4 border-t border-white/10 pt-4 mt-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="affiliateEnabled"
                    checked={affiliateEnabled}
                    onChange={e => {
                      setAffiliateEnabled(e.target.checked);
                      if (!e.target.checked) setAffiliateCommissionPct('0');
                    }}
                    className="rounded border-white/10 bg-surface-high focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="affiliateEnabled" className="text-sm font-semibold text-white cursor-pointer select-none flex items-center gap-1.5">
                    <Percent size={14} className="text-primary" /> Habilitar Programa de Afiliados para este produto
                  </label>
                </div>

                {affiliateEnabled && (
                  <div className="space-y-3 pl-6 border-l border-white/10 ml-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Comissão do Afiliado (%)</label>
                      <div className="relative max-w-[200px]">
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={affiliateCommissionPct}
                          onChange={e => {
                            let val = parseInt(e.target.value) || 0;
                            if (val > 80) val = 80;
                            if (val < 0) val = 0;
                            setAffiliateCommissionPct(String(val));
                          }}
                          placeholder="0"
                          className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-on-surface-variant text-sm font-bold">%</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">Defina entre 0% e 80% do valor de venda.</p>
                    </div>

                    {/* Live payout breakdown calculations */}
                    {!isFree && (priceUSD || (isAngola && priceAOA)) && (
                      <div className="rounded-xl bg-surface-high border border-white/10 p-4 space-y-3 max-w-xl text-xs">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={12} className="text-primary" /> Divisão Estimada de Ganhos por Venda
                        </div>
                        
                        <div className={`grid grid-cols-1 ${isAngola ? 'sm:grid-cols-2' : ''} gap-4`}>
                          {/* USD Breakdown */}
                          {priceUSD && Number(priceUSD) > 0 && (
                            <div className={`space-y-1.5 ${isAngola ? 'border-r border-white/5 pr-2' : ''}`}>
                              <span className="text-[10px] font-bold text-white block">Divisão USD:</span>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Preço de Venda:</span>
                                <span className="font-mono text-white">${Number(priceUSD).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Comissão Afiliado ({affiliateCommissionPct}%):</span>
                                <span className="font-mono text-amber-400">-${(Number(priceUSD) * (Number(affiliateCommissionPct) / 100)).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Taxa CodeEngine Learn (10%):</span>
                                <span className="font-mono text-red-400">-${Math.max(Number(priceUSD) * 0.1, 0.5).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-green-400 border-t border-white/5 pt-1.5">
                                <span>Líquido Produtor:</span>
                                <span className="font-mono">${
                                  Math.max(0, Number(priceUSD) - (Number(priceUSD) * (Number(affiliateCommissionPct) / 100)) - Math.max(Number(priceUSD) * 0.1, 0.5)).toFixed(2)
                                }</span>
                              </div>
                            </div>
                          )}

                          {/* AOA Breakdown */}
                          {isAngola && priceAOA && Number(priceAOA) > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-white block">Divisão AOA:</span>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Preço de Venda:</span>
                                <span className="font-mono text-white">Kz {Number(priceAOA).toLocaleString('pt-AO')}</span>
                              </div>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Comissão Afiliado ({affiliateCommissionPct}%):</span>
                                <span className="font-mono text-amber-400">-Kz {Math.floor(Number(priceAOA) * (Number(affiliateCommissionPct) / 100)).toLocaleString('pt-AO')}</span>
                              </div>
                              <div className="flex justify-between text-on-surface-variant">
                                <span>Taxas da Plataforma (CE+FP):</span>
                                <span className="font-mono text-red-400">-Kz {
                                  Math.floor((Number(priceAOA) * 0.08) + (Math.max(Number(priceAOA) * 0.02, 100) * 1.14)).toLocaleString('pt-AO')
                                }</span>
                              </div>
                              <div className="flex justify-between font-semibold text-green-400 border-t border-white/5 pt-1.5">
                                <span>Líquido Produtor:</span>
                                <span className="font-mono">Kz {
                                  Math.max(0, 
                                    Number(priceAOA) - 
                                    Math.floor(Number(priceAOA) * (Number(affiliateCommissionPct) / 100)) - 
                                    Math.floor((Number(priceAOA) * 0.08) + (Math.max(Number(priceAOA) * 0.02, 100) * 1.14))
                                  ).toLocaleString('pt-AO')
                                }</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                      Como criador no plano gratuito, você pode hospedar seus vídeos em plataformas externas de streaming rápido. Para fazer upload e hospedagem direta na CodeEngine, faça o upgrade clicando no botão "Plano Premium" do Painel.
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
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
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

            {/* Campaign Preview Column */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-center">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Visualização da Campanha na Loja</h4>
              <div className="rounded-xl border border-white/10 bg-surface-high p-4 space-y-3 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-primary/20 to-transparent blur-md pointer-events-none" />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-background uppercase tracking-wider">
                    {campaign.banner_text || 'EXEMPLO DE CAMPANHA'}
                  </span>
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm truncate">{title || 'Título do Produto'}</h5>
                  <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">Sua oferta promocional será exibida em destaque com tags exclusivas.</p>
                </div>
                <div className="flex gap-4 items-baseline pt-1">
                  {campaign.special_price ? (
                    <div className="flex flex-col">
                      <span className="text-[9px] text-on-surface-variant line-through">${priceUSD || '0.00'}</span>
                      <span className="text-sm font-bold text-green-400 font-mono">${campaign.special_price}</span>
                    </div>
                  ) : null}
                  {campaign.special_price_aoa ? (
                    <div className="flex flex-col">
                      <span className="text-[9px] text-on-surface-variant line-through">Kz {priceAOA || '0'}</span>
                      <span className="text-sm font-bold text-green-400 font-mono">Kz {campaign.special_price_aoa}</span>
                    </div>
                  ) : null}
                </div>
                {campaign.show_countdown && (
                  <div className="text-[10px] text-primary font-mono border-t border-white/5 pt-2 flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span>Expira em: {campaign.end_date ? new Date(campaign.end_date).toLocaleString() : 'Data e Hora'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons Customization Section */}
        {activeTab === 'coupons' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
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
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Cupom
              </button>
            </div>

            <div>
              {coupons.length > 0 ? (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 shadow-lg">
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
                          <td className="px-4 py-3 font-bold text-primary">{c.code}</td>
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
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/5 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <Percent className="w-8 h-8 text-on-surface-variant mb-3 opacity-60" />
                  <h4 className="text-sm font-semibold text-white">Nenhum cupom ativo</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">Preencha o formulário ao lado e clique em "Adicionar Cupom" para criar descontos exclusivos.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQs Customization Section */}
        {activeTab === 'faqs' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
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
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar FAQ
              </button>
            </div>

            <div>
              {faqs.length > 0 ? (
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
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded shrink-0"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/5 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <Info className="w-8 h-8 text-on-surface-variant mb-3 opacity-60" />
                  <h4 className="text-sm font-semibold text-white">Nenhum FAQ cadastrado</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">Dúvidas frequentes ajudam a aumentar a conversão. Adicione perguntas e respostas ao lado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bonuses Customization Section */}
        {activeTab === 'bonuses' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display">Bônus Exclusivos</h3>
              <p className="text-xs text-on-surface-variant">Incentive a compra incluindo brindes ou recursos extras.</p>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Vincular Produto Interno como Bônus (Opcional)</label>
                <select
                  value={newBonus.linked_product_id || ''}
                  onChange={e => {
                    const selectedProd = collaboratorProducts.find(p => p.id === e.target.value);
                    setNewBonus({
                      ...newBonus,
                      linked_product_id: e.target.value,
                      title: newBonus.title || (selectedProd ? `Acesso Bônus: ${selectedProd.title}` : ''),
                      description: newBonus.description || (selectedProd ? `Libera acesso completo ao produto "${selectedProd.title}" gratuitamente.` : ''),
                      original_value: newBonus.original_value || (selectedProd ? String(selectedProd.price) : '')
                    });
                  }}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Selecione um produto para vincular --</option>
                  {collaboratorProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (${p.price})</option>
                  ))}
                </select>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Selecione um produto. Ao comprar o produto atual, o cliente receberá acesso de download para este bônus automaticamente na sua biblioteca.
                </p>
              </div>

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
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Bônus
              </button>
            </div>

            <div>
              {bonuses.length > 0 ? (
                <div className="space-y-3">
                  {bonuses.map((b, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-4 text-sm">
                      <div>
                        <h4 className="font-bold text-white mb-1 flex flex-wrap items-center gap-1.5">
                          <span>{b.title}</span>
                          <span className="text-[10px] text-green-400 font-mono">(${b.original_value})</span>
                          {b.linked_product_id && (
                            <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 rounded px-1 py-0.5 font-bold uppercase">
                              Auto-Entrega
                            </span>
                          )}
                        </h4>
                        <p className="text-on-surface-variant text-xs mt-1">{b.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBonus(i)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded shrink-0"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/5 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <Gift className="w-8 h-8 text-on-surface-variant mb-3 opacity-60" />
                  <h4 className="text-sm font-semibold text-white">Nenhum bônus configurado</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">Brindes e bônus aumentam o valor percebido do produto e aceleram a decisão de compra. Adicione um bônus ao lado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits Customization Section */}
        {activeTab === 'benefits' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display">Vantagens & Benefícios</h3>
              <p className="text-xs text-on-surface-variant">Liste as principais qualidades ou entregáveis do seu produto.</p>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Vantagem</label>
                <input
                  type="text"
                  value={newBenefit.title}
                  onChange={e => setNewBenefit({ ...newBenefit, title: e.target.value })}
                  placeholder="Ex: Acesso Vitalício com Atualizações Gratuitas"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Descrição Curta</label>
                <textarea
                  value={newBenefit.description}
                  onChange={e => setNewBenefit({ ...newBenefit, description: e.target.value })}
                  placeholder="Ex: Estude no seu próprio ritmo, sem prazos de validade ou expirações."
                  rows={2}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none resize-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <button
                type="button"
                onClick={addBenefit}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold transition-all"
              >
                <Plus size={14} /> Adicionar Vantagem
              </button>
            </div>

            <div>
              {benefits.length > 0 ? (
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
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/5 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <Award className="w-8 h-8 text-on-surface-variant mb-3 opacity-60" />
                  <h4 className="text-sm font-semibold text-white">Nenhuma vantagem adicionada</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">Preencha o formulário ao lado e clique em "Adicionar Vantagem" para destacar os benefícios do produto.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Translations Customization Section */}
        {activeTab === 'translations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-display">Informações em Outros Idiomas</h3>
            <p className="text-xs text-on-surface-variant">Facilite a venda internacional localizando o conteúdo.</p>

            <div className="grid gap-6 md:grid-cols-2">
              {translationLanguages.map(lang => (
                <div key={lang.code} className="p-5 border border-white/10 rounded-xl bg-white/5 space-y-4">
                  <span className="block text-sm font-bold text-white border-b border-white/10 pb-2">{lang.name}</span>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{lang.titleLabel} *</label>
                    <input
                      type="text"
                      value={translations[lang.code]?.title || ''}
                      onChange={e => setTranslations({
                        ...translations,
                        [lang.code]: { ...translations[lang.code], title: e.target.value }
                      })}
                      placeholder={lang.exTitle}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{lang.descLabel} *</label>
                    <textarea
                      value={translations[lang.code]?.description || ''}
                      onChange={e => setTranslations({
                        ...translations,
                        [lang.code]: { ...translations[lang.code], description: e.target.value }
                      })}
                      placeholder={`${lang.descLabel}...`}
                      rows={4}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{lang.ctaLabel}</label>
                    <input
                      type="text"
                      value={translations[lang.code]?.cta_text || ''}
                      onChange={e => setTranslations({
                        ...translations,
                        [lang.code]: { ...translations[lang.code], cta_text: e.target.value }
                      })}
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  {/* Upload Capa */}
                  <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
                    <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                      <Image size={16} className="text-on-surface-variant" /> {lang.code === 'pt' ? 'Imagem de Capa' : lang.code === 'fr' ? 'Image de Couverture' : 'Cover Image'} ({lang.name})
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={e => handleTranslationFileUpload(e, 'product-covers', lang.code, 'cover_url')}
                      className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                    {translations[lang.code]?.cover_url && (
                      <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                        <img src={translations[lang.code].cover_url} className="w-full h-full object-cover" alt="Preview Capa" />
                      </div>
                    )}
                  </div>

                  {/* Upload Ficheiro */}
                  <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
                    <span className="block text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                      <FileText size={16} className="text-on-surface-variant" /> {lang.code === 'pt' ? 'Ficheiro do Produto' : lang.code === 'fr' ? 'Fichier du Produit' : 'Product File'} ({lang.name})
                    </span>
                    <input
                      type="file"
                      onChange={e => handleTranslationFileUpload(e, 'ebooks-private', lang.code, 'storage_url')}
                      className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                    {translations[lang.code]?.storage_url && (
                      <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                        <ShieldCheck size={14} /> {lang.code === 'pt' ? 'Ficheiro carregado com sucesso' : lang.code === 'fr' ? 'Fichier téléchargé avec succès' : 'File uploaded successfully'} ({lang.name}).
                      </div>
                    )}
                  </div>

                  {/* Upload Preview */}
                  <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
                    <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                      <Globe size={16} className="text-on-surface-variant" /> {lang.code === 'pt' ? 'Ficheiro de Amostra/Preview' : lang.code === 'fr' ? 'Fichier de Preview' : 'Preview File'} ({lang.name} - {lang.code === 'pt' ? 'Opcional' : lang.code === 'fr' ? 'Optionnel' : 'Optional'})
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={e => handleTranslationFileUpload(e, 'product-previews', lang.code, 'preview_url')}
                      className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                    {translations[lang.code]?.preview_url && (
                      <div className="mt-2 text-xs text-on-surface-variant truncate">
                        {lang.code === 'pt' ? 'Ficheiro de preview carregado' : lang.code === 'fr' ? 'Fichier de preview téléchargé' : 'Preview file uploaded'} ({lang.name}).
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Sections tab */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            <CustomSectionsLocalManager sections={customSections} onChange={setCustomSections} />
          </div>
        )}

        {/* Curriculum Editor tab */}
        {activeTab === 'curriculum' && productId && (
          <div className="space-y-4">
            <CurriculumEditor productId={productId} />
          </div>
        )}

        {/* Theme Editor tab */}
        {activeTab === 'theme' && (
          <div className="space-y-3">
            <div className="glass-panel p-3 rounded-xl border border-white/10 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Tema Visual da Página de Vendas</h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Selecione um tema de fundo dinâmico para a página do seu produto. Temas de vídeo interativos reagem dinamicamente à rolagem da tela (scroll scrubbing) para criar uma experiência cinematográfica incrível.
                  </p>
                </div>
                {themeVideoPath && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all shadow-md active:scale-95 shrink-0 self-start sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar Prévia
                  </button>
                )}
              </div>

              <CardFanCarousel 
                currentPath={themeVideoPath}
                currentConfig={themeVideoConfig}
                onSelectPreset={(preset) => {
                  setThemeVideoPath(preset.videoPath);
                  setThemeVideoConfig(preset.config);
                }}
              />

              {themeVideoPath && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  {/* Controles de Visibilidade e Opacidade */}
                  <div className="grid gap-3 sm:grid-cols-2 bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-white">
                        <span>Opacidade do Vídeo</span>
                        <span className="text-primary font-mono">{Math.round(themeVideoConfig.videoOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.05" 
                        max="1" 
                        step="0.05" 
                        value={themeVideoConfig.videoOpacity}
                        onChange={(e) => setThemeVideoConfig(prev => ({ ...prev, videoOpacity: Number(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="block text-[9px] text-on-surface-variant">Controla quão visível o vídeo de fundo fica na página.</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-white">
                        <span>Escuridão da Máscara (Overlay)</span>
                        <span className="text-primary font-mono">{Math.round(themeVideoConfig.overlayOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.95" 
                        step="0.05" 
                        value={themeVideoConfig.overlayOpacity}
                        onChange={(e) => setThemeVideoConfig(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="block text-[9px] text-on-surface-variant">Controla a escuridão do filtro sobre o vídeo de fundo para garantir contraste do texto.</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-white">
                        <span>Opacidade dos Painéis (Glassmorphism)</span>
                        <span className="text-primary font-mono">{Math.round(themeVideoConfig.sectionOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.02" 
                        max="0.5" 
                        step="0.01" 
                        value={themeVideoConfig.sectionOpacity}
                        onChange={(e) => setThemeVideoConfig(prev => ({ ...prev, sectionOpacity: Number(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="block text-[9px] text-on-surface-variant">Controla a opacidade dos painéis (menor opacidade = componentes mais invisíveis/transparentes).</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-white">
                        <span>Intensidade do Desfoque (Blur)</span>
                        <span className="text-primary font-mono">{themeVideoConfig.blurAmount}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        step="1" 
                        value={themeVideoConfig.blurAmount}
                        onChange={(e) => setThemeVideoConfig(prev => ({ ...prev, blurAmount: Number(e.target.value) }))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="block text-[9px] text-on-surface-variant">Intensidade do desfoque dos painéis com efeito de vidro fosco.</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[11px] font-semibold text-white">Prévia do Vídeo de Fundo</span>
                    <div className="aspect-video w-full max-w-[240px] rounded-lg overflow-hidden bg-black border border-white/10 relative">
                      <video 
                        src={`/${themeVideoPath}`} 
                        className="w-full h-full object-cover" 
                        controls 
                        muted
                        playsInline
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        </div>

      </form>

      {showPreview && (
        <div className="fixed inset-0 w-full h-full z-[100] bg-black overflow-y-auto font-sans">
          {/* Live Background */}
          <ScrollTiedBackground
            videoPath={themeVideoPath}
            videoOpacity={themeVideoConfig.videoOpacity}
            overlayOpacity={themeVideoConfig.overlayOpacity}
            backgroundStyle={(themeVideoConfig as any).backgroundStyle}
          />
          
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="fixed top-4 left-4 z-[110] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white backdrop-blur-md transition-all shadow-md active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>

          {/* ── Floating Controls Panel ── */}
          <div className="fixed top-4 right-4 z-[110] w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-[10px] font-black">3D</span>
                </div>
                <span className="text-white text-xs font-bold tracking-wide font-display uppercase">Tema Visual</span>
              </div>
              {/* Save Theme Button */}
              {productId && (
                <button
                  type="button"
                  onClick={handleSaveTheme}
                  disabled={themeSaving}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold transition-all active:scale-95 disabled:opacity-60"
                >
                  {themeSaving ? (
                    <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  ) : themeSaved ? (
                    <>
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Guardar
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Shader preview strip */}
            <div className="h-20 w-full relative">
              <ShaderCanvas config={shaderConfig} className="absolute inset-0" />
            </div>

            {/* Controls */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">

              {/* Overlay escuridão (texto sempre legível) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Escuridão da Sobreposição</span>
                  <span className="text-primary font-mono">{Math.round(themeVideoConfig.overlayOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.4" max="0.95" step="0.05"
                  value={themeVideoConfig.overlayOpacity}
                  onChange={e => setThemeVideoConfig(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
                <span className="text-[9px] text-on-surface-variant">Mín. 40% para garantir legibilidade.</span>
              </div>

              {/* Painéis (glassmorphism) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Opacidade dos Painéis</span>
                  <span className="text-primary font-mono">{Math.round(themeVideoConfig.sectionOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.02" max="0.5" step="0.01"
                  value={themeVideoConfig.sectionOpacity}
                  onChange={e => setThemeVideoConfig(prev => ({ ...prev, sectionOpacity: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              {/* Blur dos painéis */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Desfoque dos Painéis</span>
                  <span className="text-primary font-mono">{themeVideoConfig.blurAmount}px</span>
                </div>
                <input type="range" min="0" max="24" step="1"
                  value={themeVideoConfig.blurAmount}
                  onChange={e => setThemeVideoConfig(prev => ({ ...prev, blurAmount: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              <div className="border-t border-white/10 pt-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Efeito 3D Shader</span>
              </div>

              {/* Intensidade Glitch */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Intensidade Glitch</span>
                  <span className="text-primary font-mono">{Math.round(shaderConfig.glitchIntensity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05"
                  value={shaderConfig.glitchIntensity}
                  onChange={e => setShaderConfig(prev => ({ ...prev, glitchIntensity: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              {/* RGB Shift */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Deslocamento RGB</span>
                  <span className="text-primary font-mono">{Math.round(shaderConfig.rgbShift * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05"
                  value={shaderConfig.rgbShift}
                  onChange={e => setShaderConfig(prev => ({ ...prev, rgbShift: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              {/* Scanlines */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Densidade Scanlines</span>
                  <span className="text-primary font-mono">{shaderConfig.scanlineDensity}</span>
                </div>
                <input type="range" min="10" max="200" step="10"
                  value={shaderConfig.scanlineDensity}
                  onChange={e => setShaderConfig(prev => ({ ...prev, scanlineDensity: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              {/* Opacidade Scanlines */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-white">
                  <span>Opacidade Scanlines</span>
                  <span className="text-primary font-mono">{Math.round(shaderConfig.scanlineOpacity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05"
                  value={shaderConfig.scanlineOpacity}
                  onChange={e => setShaderConfig(prev => ({ ...prev, scanlineOpacity: Number(e.target.value) }))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-primary bg-white/10"
                />
              </div>

              {/* Cor Base */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-white">Cor Base do Shader</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={`#${Math.round(shaderConfig.baseColor[0] * 255).toString(16).padStart(2,'0')}${Math.round(shaderConfig.baseColor[1] * 255).toString(16).padStart(2,'0')}${Math.round(shaderConfig.baseColor[2] * 255).toString(16).padStart(2,'0')}`}
                    onChange={e => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1,3), 16) / 255;
                      const g = parseInt(hex.slice(3,5), 16) / 255;
                      const b = parseInt(hex.slice(5,7), 16) / 255;
                      setShaderConfig(prev => ({ ...prev, baseColor: [r, g, b] }));
                    }}
                    className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
                  />
                  <span className="text-[9px] text-on-surface-variant">Clique para abrir o seletor de cor</span>
                </div>
              </div>

              {/* Presets rápidos */}
              <div className="border-t border-white/10 pt-2 space-y-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-wide">Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Digital', cfg: DEFAULT_SHADER_CONFIG },
                    { label: 'Sutil', cfg: { glitchIntensity: 0.05, rgbShift: 0.1, scanlineDensity: 40, scanlineOpacity: 0.2, baseColor: [0.58, 0.60, 1.0] as [number,number,number] } },
                    { label: 'Cyberpunk', cfg: { glitchIntensity: 0.8, rgbShift: 0.9, scanlineDensity: 120, scanlineOpacity: 0.8, baseColor: [1.0, 0.1, 0.6] as [number,number,number] } },
                    { label: 'VCR', cfg: { glitchIntensity: 0.5, rgbShift: 0.3, scanlineDensity: 60, scanlineOpacity: 0.9, baseColor: [0.5, 1.0, 0.5] as [number,number,number] } },
                  ].map(p => (
                    <button key={p.label} type="button"
                      onClick={() => setShaderConfig(p.cfg)}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white transition-all"
                    >{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Real Product Page Preview */}
          <div
            style={{
              '--glass-opacity': themeVideoConfig.sectionOpacity,
              '--glass-blur': `${themeVideoConfig.blurAmount}px`
            } as React.CSSProperties}
            className="relative z-10"
          >
            <ProductPage productId={productId} />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
