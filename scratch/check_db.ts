import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching products from database...');
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, title, category_id, subcategory_id, status');
  
  if (pError) {
    console.error('Error fetching products:', pError);
    return;
  }
  
  console.log('Fetched products count:', products?.length);
  console.log('Products:', JSON.stringify(products, null, 2));

  console.log('\nFetching categories...');
  const { data: categories, error: cError } = await supabase
    .from('categories')
    .select('id, name');
  
  if (cError) {
    console.error('Error fetching categories:', cError);
    return;
  }
  console.log('Categories:', JSON.stringify(categories, null, 2));

  console.log('\nFetching subcategories...');
  const { data: subcategories, error: sError } = await supabase
    .from('subcategories')
    .select('id, name, category_id');
  
  if (sError) {
    console.error('Error fetching subcategories:', sError);
    return;
  }
  console.log('Subcategories:', JSON.stringify(subcategories, null, 2));
}

run();
