import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

const artifactDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\c6af12eb-4de3-4f5b-a357-a8222694ea23';

async function downloadToArtifacts(storagePath, destName) {
  const { data, error } = await supabase.storage
    .from('product-covers')
    .download(storagePath);

  if (error) {
    console.error(`Error downloading ${storagePath}:`, error);
    return;
  }

  const destPath = path.join(artifactDir, destName);
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved ${storagePath} to ${destPath}`);
}

async function run() {
  const pt = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/1780643049527_pt.png';
  const en = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const fr = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png';

  await downloadToArtifacts(pt, 'pt_cover.png');
  await downloadToArtifacts(en, 'en_cover.png');
  await downloadToArtifacts(fr, 'fr_cover.png');
}

run();
