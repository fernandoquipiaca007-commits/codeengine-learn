import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: p, error: pe } = await supabase
    .from('products')
    .select('*')
    .eq('id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789')
    .single();

  if (pe) {
    console.error('Products error:', pe);
  } else {
    console.log('--- PRODUCTS TABLE ---');
    console.log('cover_url:', p.cover_url);
    console.log('cover_storage_path:', p.cover_storage_path);
  }

  const { data: pt, error: pte } = await supabase
    .from('products_translations')
    .select('*')
    .eq('product_id', '680b90e6-f0d0-4e85-aa0d-e7b93e16a789');

  if (pte) {
    console.error('Translations error:', pte);
  } else {
    console.log('\n--- TRANSLATIONS TABLE ---');
    pt.forEach(t => {
      console.log(`- Lang: ${t.language}`);
      console.log(`  title: ${t.title}`);
      console.log(`  cover_url: ${t.cover_url}`);
    });
  }
}

run();
