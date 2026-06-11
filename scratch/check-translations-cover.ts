import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('products_translations')
    .select('product_id, language, title, cover_url, custom_copy')
    .eq('product_id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Translations for product 680b90e6-f0d0-4e85-aa0d-e7b93e16a789:');
  console.log(JSON.stringify(data, null, 2));
}

run();
