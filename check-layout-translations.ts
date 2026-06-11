import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis do .env.local
dotenv.config({ path: path.resolve('c:/Users/Dell/Documents/codeengine1.2/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: products } = await supabase.from('products').select('id, title, page_layout_config, custom_copy');
  
  for (const product of products || []) {
    console.log(`\nProduct: ${product.title}`);
    console.log('Layout Config:', JSON.stringify(product.page_layout_config, null, 2));
    console.log('Custom Copy:', JSON.stringify(product.custom_copy, null, 2));

    const { data: translations } = await supabase
      .from('products_translations')
      .select('language, title, custom_copy')
      .eq('product_id', product.id);

    console.log(`Translations:`);
    for (const tr of translations || []) {
      console.log(`  Language: ${tr.language}`);
      console.log(`  Title: ${tr.title}`);
      console.log(`  Custom Copy:`, JSON.stringify(tr.custom_copy, null, 2));
    }
  }
}

run();
