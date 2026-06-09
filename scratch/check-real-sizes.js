import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFileSize(path) {
  const { data, error } = await supabase.storage
    .from('product-covers')
    .download(path);
  if (error) {
    return `Error: ${error.message}`;
  }
  return `${data.size} bytes`;
}

async function run() {
  const pt = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/1780845272615_pt.png';
  const en = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const fr = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png';

  console.log('PT Cover Size:', await getFileSize(pt));
  console.log('EN Cover Size:', await getFileSize(en));
  console.log('FR Cover Size:', await getFileSize(fr));
}

run();
