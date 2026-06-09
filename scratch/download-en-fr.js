import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

const artifactDir = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\23def309-e9c8-4522-a936-2a55e8d881b3';

async function downloadToArtifacts(storagePath, destName) {
  let retries = 3;
  while (retries > 0) {
    try {
      const { data, error } = await supabase.storage
        .from('product-covers')
        .download(storagePath);

      if (error) throw error;

      const destPath = path.join(artifactDir, destName);
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      console.log(`Saved ${storagePath} to ${destPath}`);
      return;
    } catch (err) {
      console.error(`Error downloading ${storagePath} (retries left: ${retries - 1}):`, err.message || err);
      retries--;
      if (retries > 0) await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function run() {
  const en = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const fr = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png';

  await downloadToArtifacts(en, 'en_cover.png');
  await downloadToArtifacts(fr, 'fr_cover.png');
}

run();
