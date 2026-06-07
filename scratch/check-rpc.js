import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env.backend') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Calling RPC get_product_localized for English...');
  const { data, error } = await supabase.rpc('get_product_localized', {
    p_product_id: '680b90e6-f0d0-4e85-aa0d-e7b93e16a789',
    p_lang: 'en'
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Result:', data);
}

check();
