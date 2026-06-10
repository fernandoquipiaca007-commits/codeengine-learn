import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('products_translations')
    .select('product_id, language, custom_copy');

  if (error) {
    console.error(error);
    return;
  }

  console.log('PRODUCTS TRANSLATIONS CUSTOM COPY:');
  for (const t of data) {
    console.log(`- Product ID: ${t.product_id}, Language: ${t.language}`);
    console.log(`  Custom Copy:`, JSON.stringify(t.custom_copy, null, 2));
  }
}

run();
