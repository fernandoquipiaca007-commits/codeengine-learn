import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env.backend') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getProductCoverUrl(product) {
  const supabaseUrl = process.env.SUPABASE_URL;
  let urlPath = product.cover_storage_path || product.cover_url;

  if (
    product.language &&
    product.language !== 'pt' &&
    !product.use_shared_content &&
    product.cover_url
  ) {
    urlPath = product.cover_url;
  }

  if (!urlPath) return '';

  let baseUrl = urlPath;
  if (!urlPath.startsWith('http') && supabaseUrl) {
    baseUrl = `${supabaseUrl}/storage/v1/object/public/product-covers/${urlPath}`;
  }

  if (product.updated_at) {
    const t = new Date(product.updated_at).getTime();
    if (!isNaN(t)) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      baseUrl = `${baseUrl}${separator}t=${t}`;
    }
  }

  return baseUrl;
}

async function simulate(lang) {
  console.log(`\nSimulating load for language: ${lang}`);
  
  // 1. Fetch base product
  const { data: data } = await supabase
    .from('products')
    .select('*')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();
    
  if (!data) {
    console.error('Base product not found');
    return;
  }
  
  // 2. Fetch translation
  const { data: tr } = await supabase
    .from('products_translations')
    .select('*')
    .eq('product_id', data.id)
    .eq('language', lang)
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
  
  // 3. Map localized properties (exactly like Product.tsx)
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
        language: lang,
        updated_at: t.cover_url ? t.updated_at : data.updated_at,
      }
    : {
        ...data,
        language: 'pt',
      };
      
  console.log('Mapped Localized Product:');
  console.log(`  Title: ${localized.title}`);
  console.log(`  Language: ${localized.language}`);
  console.log(`  Cover URL field: ${localized.cover_url}`);
  console.log(`  Cover Storage Path field: ${localized.cover_storage_path}`);
  console.log(`  Updated At field: ${localized.updated_at}`);
  
  const coverUrl = getProductCoverUrl(localized);
  console.log(`  Resolved Cover URL: ${coverUrl}`);
}

async function run() {
  await simulate('pt');
  await simulate('en');
  await simulate('fr');
}

run();
