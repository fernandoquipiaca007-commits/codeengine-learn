

async function run() {
  const url = 'https://ffdqqiunkzhtgbgaojay.supabase.co/storage/v1/object/public/product-covers/680b90e6-f0d0-4e85-aa0d-e7b93e16a789/en/en.png';
  
  const res = await fetch(url, {
    method: 'HEAD'
  });

  console.log('Status:', res.status);
  console.log('Headers:');
  res.headers.forEach((value, name) => {
    console.log(`  ${name}: ${value}`);
  });
}

run();
