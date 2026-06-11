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
    .from('products')
    .select('id, title, cover_url, cover_storage_path, use_shared_content')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Base product details:');
  console.log(JSON.stringify(data, null, 2));
}

run();
