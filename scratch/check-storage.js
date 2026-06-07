import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const path = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  
  const { data, error } = await supabase.storage
    .from('product-covers')
    .download(path);

  if (error) {
    console.error('Error downloading file:', error);
  } else {
    console.log('File successfully downloaded!');
    console.log('Size (bytes):', data.size);
    console.log('Type:', data.type);
  }

  // Also check public URL
  const { data: publicUrlData } = supabase.storage
    .from('product-covers')
    .getPublicUrl(path);

  console.log('Public URL:', publicUrlData.publicUrl);
}

run();
