import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read env keys from .env.local
const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

function getProductCoverUrl(product: any) {
  const supabaseUrl = url;
  let path = (product.cover_storage_path || product.cover_url || '').trim();

  if (
    product.language &&
    product.language !== 'pt' &&
    !product.use_shared_content &&
    product.cover_url
  ) {
    path = product.cover_url.trim();
  }

  if (!path) return '';

  let baseUrl = path;
  if (!path.startsWith('http') && supabaseUrl) {
    const cleanPath = path.replace(/^\//, '');
    const cleanBaseUrl = supabaseUrl.replace(/\/$/, '');
    baseUrl = `${cleanBaseUrl}/storage/v1/object/public/product-covers/${cleanPath}`;
  }

  if (product.updated_at) {
    try {
      const t = new Date(product.updated_at).getTime();
      if (!isNaN(t)) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        baseUrl = `${baseUrl}${separator}t=${t}`;
      }
    } catch {}
  }

  return baseUrl;
}

async function simulate(lang: string) {
  console.log(`\n--- Simulating load for language: ${lang} ---`);
  
  // 1. Fetch base product
  const { data: data, error: err1 } = await supabase
    .from('products')
    .select('*')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();
    
  if (err1) {
    console.error('Error fetching base product:', err1);
    return;
  }
  
  // 2. Fetch translation
  const { data: tr, error: err2 } = await supabase
    .from('products_translations')
    .select('*')
    .eq('product_id', data.id)
    .eq('language', lang)
    .maybeSingle();
    
  if (err2) {
    console.error(`Error fetching translation for ${lang}:`, err2);
  }
    
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
