import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Dell/Documents/codeengine1.2/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: products } = await supabase.from('products').select('id, title, use_shared_content');
  for (const product of products || []) {
    console.log(`Product: ${product.title}`);
    console.log(`  use_shared_content: ${product.use_shared_content}`);
  }
}

run();
