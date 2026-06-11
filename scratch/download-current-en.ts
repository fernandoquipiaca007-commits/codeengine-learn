import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

async function run() {
  const url = 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const dest = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\c6af12eb-4de3-4f5b-a357-a8222694ea23\\downloaded_en_cover.png';
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    console.log('Downloaded EN Cover from URL:', url);
    console.log('Saved to:', dest);
    console.log('MD5 Hash:', hash);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
