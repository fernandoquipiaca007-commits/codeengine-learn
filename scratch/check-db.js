import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env.backend') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p, error: pErr } = await supabase
    .from('products')
    .select('id, title, use_shared_content')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();
    
  if (pErr) {
    console.error('Error:', pErr);
    return;
  }
  
  console.log(`Product: ${p.title}`);
  console.log(`Use Shared Content: ${p.use_shared_content}`);
}

check();
