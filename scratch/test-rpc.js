import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const id = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789';
  const { data, error } = await supabase.rpc('get_product_localized', {
    p_product_id: id,
    p_lang: 'en'
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC English Product Output:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
