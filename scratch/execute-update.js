import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs';

const supabase = createClient(supabaseUrl, supabaseKey);

function generatePublicUrl(bucket, path) {
  if (!path) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

async function run() {
  const productId = '680b90e6-f0d0-4e85-aa0d-e7b93e16a789';

  // Fetch the current base product info
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (fetchError) {
    console.error('Error fetching product:', fetchError);
    return;
  }

  console.log('Product fetched successfully');

  // Mimic the new updateProduct logic for Portuguese translation
  const ptCoverUrl = product.cover_storage_path ? (product.cover_storage_path.startsWith('http') ? product.cover_storage_path : generatePublicUrl('product-covers', product.cover_storage_path)) : null;
  const ptPreviewUrl = product.preview_storage_path ? (product.preview_storage_path.startsWith('http') ? product.preview_storage_path : generatePublicUrl('product-previews', product.preview_storage_path)) : null;
  const ptStorageUrl = product.file_storage_path;

  const translationPayload = {
    product_id: productId,
    language: 'pt',
    title: product.title,
    description: product.description,
    cta_text: product.cta_text || 'Comprar Agora',
    cover_url: ptCoverUrl,
    preview_url: ptPreviewUrl,
    storage_url: ptStorageUrl,
    updated_at: new Date().toISOString(),
  };

  console.log('Upserting pt translation with payload:', translationPayload);

  const { data, error } = await supabase
    .from('products_translations')
    .upsert(translationPayload, { onConflict: 'product_id,language' })
    .select();

  if (error) {
    console.error('Error upserting translation:', error);
  } else {
    console.log('PT translation upserted successfully:', data);
  }
}

run();
