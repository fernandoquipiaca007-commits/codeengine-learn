import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('products_translations')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
  } else if (data.length > 0) {
    console.log('PRODUCTS_TRANSLATIONS FIELDS:');
    console.log(Object.keys(data[0]));
    console.log(data[0]);
  } else {
    console.log('No translations found');
  }
}

run();
