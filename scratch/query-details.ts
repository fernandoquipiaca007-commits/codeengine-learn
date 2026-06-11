import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run() {
  const productId = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789';

  console.log('--- BENEFITS ---');
  const { data: benefits } = await supabase.from('product_benefits').select('*').eq('product_id', productId);
  console.log(JSON.stringify(benefits, null, 2));

  console.log('--- BONUSES ---');
  const { data: bonuses } = await supabase.from('product_bonuses').select('*').eq('product_id', productId);
  console.log(JSON.stringify(bonuses, null, 2));

  console.log('--- FAQs ---');
  const { data: faqs } = await supabase.from('product_faqs').select('*').eq('product_id', productId);
  console.log(JSON.stringify(faqs, null, 2));

  console.log('--- CUSTOM SECTIONS ---');
  const { data: customSections } = await supabase.from('product_custom_sections').select('*').eq('product_id', productId);
  console.log(JSON.stringify(customSections, null, 2));
}

run();
