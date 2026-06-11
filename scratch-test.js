import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: products, error: pError } = await supabase.from('products').select('*');
  if (pError) {
    console.error('Error fetching products:', pError);
    return;
  }

  console.log(`Found ${products.length} products:`);
  for (const product of products) {
    console.log(`\n===================================`);
    console.log(`Product: ${product.title} (ID: ${product.id})`);
    console.log(`Cover Storage Path: ${product.cover_storage_path}`);
    console.log(`Cover URL: ${product.cover_url}`);
    console.log(`Use Shared Content: ${product.use_shared_content}`);

    const { data: translations, error: tError } = await supabase
      .from('products_translations')
      .select('*')
      .eq('product_id', product.id);

    if (tError) {
      console.error(`Error translations:`, tError);
      continue;
    }

    // Resolve as 'en'
    const locale = 'en';
    const tr = translations.find(t => t.language === 'en');
    const trFb = translations.find(t => t.language === 'pt');
    const t = tr || trFb;

    const localized = t
      ? {
          ...product,
          title: t.title || product.title,
          description: t.description || product.description,
          cover_url: t.cover_url || product.cover_url,
          cover_storage_path: t.cover_url || product.cover_storage_path,
          preview_url: t.preview_url || product.preview_url,
          storage_url: t.storage_url || product.storage_url,
          file_storage_path: t.storage_url || product.file_storage_path,
          cta_text: t.cta_text || product.cta_text,
          language: 'en',
          updated_at: t.cover_url ? t.updated_at : product.updated_at,
        }
      : {
          ...product,
          language: 'pt',
        };

    console.log(`\nLocalized Product (locale = 'en'):`);
    console.log(`  Title: ${localized.title}`);
    console.log(`  Cover URL (mapped): ${localized.cover_url}`);
    console.log(`  Cover Storage Path (mapped): ${localized.cover_storage_path}`);
    console.log(`  CTA Text (mapped): ${localized.cta_text}`);
    console.log(`  Language: ${localized.language}`);

    // Resolve Cover URL via getProductCoverUrl simulation
    const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
    let path = (localized.cover_storage_path || localized.cover_url || '').trim();
    if (
      localized.language &&
      localized.language !== 'pt' &&
      localized.cover_url
    ) {
      path = localized.cover_url.trim();
    }
    let resolvedCoverUrl = path;
    if (!path.startsWith('http') && supabaseUrl) {
      const cleanPath = path.replace(/^\//, '');
      resolvedCoverUrl = `${supabaseUrl}/storage/v1/object/public/product-covers/${cleanPath}`;
    }
    console.log(`  Resolved Cover URL: ${resolvedCoverUrl}`);

  }
}

run();
