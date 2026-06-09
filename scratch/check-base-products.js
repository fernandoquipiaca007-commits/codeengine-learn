import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  console.log('BASE PRODUCTS:');
  for (const p of data) {
    console.log(`- ID: ${p.id}`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Description (first 100 chars): ${p.description?.substring(0, 100)}...`);
    console.log(`  Cover URL: ${p.cover_url}`);
  }
}

run();
