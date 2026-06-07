import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to query postgres information schema or some table
  // Since we cannot run raw SQL directly via client unless we call an RPC,
  // let's see if there are any tables we can guess or if we can query from existing ones.
  const tables = ['products', 'products_translations', 'categories', 'subcategories', 'purchases', 'members', 'downloads', 'news', 'news_translations'];
  console.log('Testing access to common tables:');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`- ${table}: Error (${error.message})`);
    } else {
      console.log(`- ${table}: Success (${data.length} rows)`);
    }
  }
}

run();
