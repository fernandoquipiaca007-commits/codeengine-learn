import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Dell/Documents/codeengine1.2/.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Product columns:', product);
  }
}

run();
