const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Checking favorites table ---');
  const { data, error } = await supabase.from('favorites').select('*').limit(1);
  if (error) {
    console.log('favorites check error:', error.message, error.code);
  } else {
    console.log('favorites exists! Columns:', data.length > 0 ? Object.keys(data[0]) : 'No rows');
    console.log('Sample row:', data[0]);
  }
}

run();
