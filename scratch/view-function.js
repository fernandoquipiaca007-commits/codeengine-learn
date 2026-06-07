import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_product_localized', {
    p_product_id: '680b90e6-f0d0-4e85-aa0d-e7b93e16a789',
    p_lang: 'pt'
  });
  
  // Since we want to see the function source code, we can query pg_proc via an RPC if there's one,
  // or query it if we have permissions. Let's check if we can query pg_proc.
  const { data: proc, error: procError } = await supabase
    .from('pg_proc')
    .select('prosrc')
    .eq('proname', 'get_product_localized')
    .limit(1);
    
  if (procError) {
    console.error('Error querying pg_proc:', procError.message);
  } else {
    console.log('Function Source:', proc?.[0]?.prosrc);
  }
}

run();
