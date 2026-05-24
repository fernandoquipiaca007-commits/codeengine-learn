import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'admin', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function run() {
  console.log('Updating products subcategory with service role key...');
  
  // Update teste2 (id: 3c17f7e7-5275-4ad1-ae42-031e154bfe6d) to subcategory Ai (id: d723cc46-adc7-4c1c-8047-da625df45d47)
  const { data, error } = await supabase
    .from('products')
    .update({ subcategory_id: 'd723cc46-adc7-4c1c-8047-da625df45d47' })
    .eq('id', '3c17f7e7-5275-4ad1-ae42-031e154bfe6d')
    .select();

  if (error) {
    console.error('Error updating product subcategory:', error);
    return;
  }
  
  console.log('Update success!', data);
}

run();
