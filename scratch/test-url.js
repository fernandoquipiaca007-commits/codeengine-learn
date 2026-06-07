import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

function resolveContentLocale(uiLocale) {
  if (uiLocale === 'fr') return 'en';
  return uiLocale;
}

function getProductCoverUrl(product) {
  const path = product.cover_storage_path || product.cover_url;
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/product-covers/${path}`;
}

async function test(locale) {
  const productId = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789';
  
  const active = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  const data = active.data;
  const contentLang = resolveContentLocale(locale);
  const useShared = Boolean(data.use_shared_content);
  const translationLang = useShared ? 'pt' : contentLang;

  const { data: tr } = await supabase
    .from('products_translations')
    .select('*')
    .eq('product_id', data.id)
    .eq('language', translationLang)
    .maybeSingle();

  const { data: trFb } = !tr
    ? await supabase
        .from('products_translations')
        .select('*')
        .eq('product_id', data.id)
        .eq('language', 'pt')
        .maybeSingle()
    : { data: null };

  const t = tr || trFb;

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
      }
    : data;

  console.log(`\nLocale: ${locale} | translationLang: ${translationLang}`);
  console.log('t.cover_url:', t?.cover_url);
  console.log('localized.cover_url:', localized.cover_url);
  console.log('localized.cover_storage_path:', localized.cover_storage_path);
  console.log('Resolved Cover URL:', getProductCoverUrl(localized));
}

async function run() {
  await test('pt');
  await test('en');
  await test('fr');
}

run();
