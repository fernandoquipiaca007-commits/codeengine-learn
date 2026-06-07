import fetch from 'node-fetch';

async function checkUrl(name, url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${name}: HTTP Status = ${res.status} (${res.statusText})`);
  } catch (err) {
    console.error(`${name}: Failed to fetch:`, err.message);
  }
}

async function run() {
  const pt = 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/1780643049527_pt.png';
  const en = 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  const fr = 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png';

  console.log('--- Checking HTTP accessibility of public cover URLs ---');
  await checkUrl('PT Cover', pt);
  await checkUrl('EN Cover', en);
  await checkUrl('FR Cover', fr);
}

run();
