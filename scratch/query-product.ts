import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Dell/.gemini/antigravity/brain/c6af12eb-4de3-4f5b-a357-a8222694ea23/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dwgwhgqkywqgkywq.supabase.co'; // Fallback
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Let's read the keys from the actual file
import * as fs from 'fs';
const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run() {
  const { data: products } = await supabase.from('products').select('*');
  console.log('PRODUCTS:', JSON.stringify(products, null, 2));

  const { data: tr } = await supabase.from('products_translations').select('*');
  console.log('TRANSLATIONS:', JSON.stringify(tr, null, 2));
}

run();
