import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Dell/Documents/codeengine1.2/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: products } = await supabase.from('products').select('*');
  
  for (const product of products || []) {
    console.log(`\n==================================================`);
    console.log(`Product: ${product.title}`);
    console.log(`Description (base): ${product.description}`);
    
    const { data: translations } = await supabase
      .from('products_translations')
      .select('*')
      .eq('product_id', product.id);

    console.log(`Translations:`);
    for (const tr of translations || []) {
      console.log(`  Language: ${tr.language}`);
      console.log(`  Title: ${tr.title}`);
      console.log(`  Description: ${tr.description}`);
    }
  }
}

run();
