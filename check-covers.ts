import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis do .env.local
dotenv.config({ path: path.resolve('c:/Users/Dell/Documents/codeengine1.2/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: products } = await supabase.from('products').select('id, title, cover_url');
  
  for (const product of products || []) {
    console.log(`\nProduct Base: ${product.title}`);
    console.log('Base Cover URL:', product.cover_url);

    const { data: translations } = await supabase
      .from('products_translations')
      .select('language, title, cover_url, cta_text')
      .eq('product_id', product.id);

    console.log(`Translations:`);
    for (const tr of translations || []) {
      console.log(`  Language: ${tr.language}`);
      console.log(`  Title: ${tr.title}`);
      console.log(`  Cover URL: ${tr.cover_url}`);
      console.log(`  CTA Text: ${tr.cta_text}`);
    }
  }
}

run();
