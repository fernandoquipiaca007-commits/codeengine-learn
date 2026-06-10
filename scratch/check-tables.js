import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .rpc('get_tables'); // Let's try to query public tables directly

  if (error) {
    // If RPC is not available, query pg_catalog or query select from known translation tables
    console.log("RPC get_tables failed. Trying direct query of translations tables...");
    const { data: vtr, error: vtrErr } = await supabase.from('product_videos_translations').select('*').limit(1);
    console.log("product_videos_translations exists?", !vtrErr);
    
    const { data: btr, error: btrErr } = await supabase.from('product_benefits_translations').select('*').limit(1);
    console.log("product_benefits_translations exists?", !btrErr);
    return;
  }

  console.log('TABLES:', data);
}

run();
