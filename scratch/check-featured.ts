import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read env keys from .env.local
const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('featured_products')
    .select(`
      id,
      product_id,
      order_position,
      custom_title,
      custom_subtitle,
      custom_description,
      custom_cover,
      custom_cta,
      active
    `);
    
  if (error) {
    console.error('Error fetching featured products:', error);
    return;
  }
  
  console.log('Featured Products in DB:');
  console.log(JSON.stringify(data, null, 2));
}

run();
