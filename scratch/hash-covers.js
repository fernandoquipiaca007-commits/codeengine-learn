import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

function getMd5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

async function getFileData(path) {
  const { data, error } = await supabase.storage
    .from('product-covers')
    .download(path);
  if (error) {
    throw new Error(`Error downloading ${path}: ${error.message}`);
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function run() {
  const pt = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/1780643049527_pt.png';
  const en = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const fr = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png';

  try {
    const ptBuf = await getFileData(pt);
    const enBuf = await getFileData(en);
    const frBuf = await getFileData(fr);

    console.log('PT MD5:', getMd5(ptBuf));
    console.log('EN MD5:', getMd5(enBuf));
    console.log('FR MD5:', getMd5(frBuf));
  } catch (e) {
    console.error(e);
  }
}

run();
