import { supabase } from './supabase';
import { queryCache } from './queryCache';
import { fetchLocalizedProducts } from '../hooks/useLocalizedProduct';
import { canViewProduct } from './product-visibility';
import { resolveContentLocale } from './content-locale';
import { AppLocale } from './locale';
import { parsePageLayoutConfig } from './page-layout';
import { parseJsonField } from './safe-display';

/**
 * Prefetches the complete dataset for a product detail page.
 * Triggered on hover of product cards, priming the queryCache.
 */
export function prefetchProduct(productId: string | null, locale: string) {
  if (!productId) return;

  const targetLocale = locale || 'pt';

  // 1. Prefetch basic product detail page config & localization
  const productCacheKey = `product-detail-${productId}-${targetLocale}`;
  void queryCache.get(productCacheKey, async () => {
    let data: any = null;
    const active = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .maybeSingle();

    if (active.data) {
      data = active.data;
    } else {
      const fallback = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      data = fallback.data ?? null;
    }

    if (!data) return null;

    const contentLang = resolveContentLocale(targetLocale as AppLocale);
    const useShared = Boolean(data.use_shared_content);
    const translationLang = useShared ? 'pt' : contentLang;

    const { data: t } = await supabase
      .from('products_translations')
      .select('*')
      .eq('product_id', data.id)
      .eq('language', translationLang)
      .maybeSingle();

    const localized = t
      ? {
          ...data,
          title: t.title || data.title,
          description: t.description || data.description,
          cover_url: t.cover_url || data.cover_url,
          cover_storage_path: t.cover_url || data.cover_storage_path,
          preview_url: t.preview_url || data.preview_url,
          storage_url: t.storage_url || data.storage_url,
          file_storage_path: t.storage_url || data.file_storage_path,
          cta_text: t.cta_text || data.cta_text,
          language: translationLang,
          updated_at: t.cover_url ? t.updated_at : data.updated_at,
        }
      : {
          ...data,
          language: 'pt',
        };

    return {
      product: localized,
      pageLayout: parsePageLayoutConfig(localized.page_layout_config),
      customCopy: parseJsonField(t?.custom_copy || localized.custom_copy, {}),
    };
  }, { revalidate: false });

  // 2. Prefetch localized product info (for useLocalizedProduct hook)
  const localizedProductKey = `localized-product-${productId}-${targetLocale}`;
  void queryCache.get(localizedProductKey, async () => {
    const { data, error: rpcError } = await supabase.rpc('get_product_localized', {
      p_product_id: productId,
      p_lang: targetLocale,
    });

    if (rpcError) {
      const { data: translation } = await supabase
        .from('products_translations')
        .select('*')
        .eq('product_id', productId)
        .eq('language', targetLocale)
        .maybeSingle();

      const { data: fallback } = await supabase
        .from('products_translations')
        .select('*')
        .eq('product_id', productId)
        .eq('language', 'pt')
        .maybeSingle();

      const { data: base } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (!base) throw new Error('Product not found');

      const t = translation || fallback;
      return {
        id: base.id,
        product_id: base.id,
        language: targetLocale,
        title: t?.title || base.title,
        subtitle: t?.subtitle,
        description: t?.description || base.description,
        content: t?.content,
        cta_text: t?.cta_text || base.cta_text,
        cover_url: t?.cover_url || base.cover_url,
        cover_storage_path: t?.cover_url || base.cover_storage_path,
        preview_url: t?.preview_url || base.preview_url,
        storage_url: t?.storage_url || base.storage_url,
        file_storage_path: t?.storage_url || base.file_storage_path,
        custom_copy: t?.custom_copy || base.custom_copy,
        faq: t?.faq,
        testimonials: t?.testimonials,
        price: base.price,
        is_free: base.is_free,
        stripe_price_id: base.stripe_price_id,
        category_id: base.category_id,
        subcategory_id: base.subcategory_id,
        aoa_price: base.aoa_price,
        fastpay_link: base.fastpay_link,
        tags: base.tags,
        status: base.status,
        video_url: base.video_url,
        category_name: t?.category_name || null,
        updated_at: t?.cover_url ? t.updated_at : base.updated_at,
      };
    } else {
      return data;
    }
  }, { revalidate: false });

  // 3. Prefetch FAQs
  void queryCache.get(`product-faqs-${productId}`, async () => {
    const { data } = await supabase
      .from('product_faqs')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    return data || [];
  }, { revalidate: false });

  // 4. Prefetch Curriculum (modules & lessons)
  void queryCache.get(`course-curriculum-${productId}`, async () => {
    const [mRes, lRes] = await Promise.all([
      supabase.from('course_modules').select('*').eq('product_id', productId).order('display_order'),
      supabase.from('course_lessons').select('*').eq('product_id', productId).eq('is_active', true).order('display_order'),
    ]);
    return {
      modules: mRes.data || [],
      lessons: lRes.data || [],
    };
  }, { revalidate: false });

  // 5. Prefetch Benefits
  void queryCache.get(`product-benefits-${productId}`, async () => {
    const { data } = await supabase
      .from('product_benefits')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    return data || [];
  }, { revalidate: false });

  // 6. Prefetch Bonuses
  void queryCache.get(`product-bonuses-${productId}`, async () => {
    const { data } = await supabase
      .from('product_bonuses')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  }, { revalidate: false });

  // 7. Prefetch Campaign (for Campaigns/Bonuses Banner)
  void queryCache.get(`product-campaigns-${productId}`, async () => {
    const { data } = await supabase
      .from('product_campaigns')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  }, { revalidate: false });

  void queryCache.get(`product-bonuses-campaign-${productId}`, async () => {
    const { data } = await supabase
      .from('product_campaigns')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  }, { revalidate: false });

  // 8. Prefetch Custom Sections
  void queryCache.get(`product-custom-sections-${productId}`, async () => {
    const { data } = await supabase
      .from('product_custom_sections')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  }, { revalidate: false });

  // 9. Prefetch Videos
  void queryCache.get(`product-videos-${productId}`, async () => {
    const { data } = await supabase
      .from('product_videos')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  }, { revalidate: false });
}

/**
 * Prefetches the complete dataset for the library page.
 * Triggered on hover of Navbar library links, priming the queryCache.
 */
export function prefetchLibrary(locale: string, memberLevel: string, isLoggedIn: boolean) {
  const cacheKey = `library-data-${locale}-${memberLevel}-${isLoggedIn}`;
  void queryCache.get(cacheKey, async () => {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (categoriesError) throw categoriesError;

    const localized = await fetchLocalizedProducts(locale as any, 'active');
    const visible = (localized as any[]).filter((p) =>
      canViewProduct(p as any, memberLevel, isLoggedIn)
    );
    
    return {
      categories: categoriesData || [],
      products: visible,
    };
  }, { revalidate: false });
}
