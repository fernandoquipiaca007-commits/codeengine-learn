import fetch from 'node-fetch';

const images = {
  pt: 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/1780643049527_pt.png',
  en: 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png',
  fr: 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/fr/fr.png'
};

async function test() {
  for (const [lang, url] of Object.entries(images)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`Lang: ${lang}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Content-Length: ${res.headers.get('content-length')}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
    } catch (err) {
      console.error(`Error for ${lang}:`, err.message);
    }
  }
}

test();
