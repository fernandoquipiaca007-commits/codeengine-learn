import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

function getProductCoverUrl(product) {
  const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
  let path = product.cover_storage_path || product.cover_url;

  if (
    product.language &&
    product.language !== 'pt' &&
    !product.use_shared_content &&
    product.cover_url
  ) {
    path = product.cover_url;
  }

  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/product-covers/${path}`;
}

async function run() {
  const locale = 'fr';
  console.log(`--- Fetching featured products for locale: ${locale} ---`);

  const { data, error } = await supabase
    .from('featured_products')
    .select(`
      id,
      product_id,
      order_position,
      custom_title,
      custom_subtitle,
      custom_description,
      custom_cover,
      custom_cta,
      products (
        id,
        title,
        description,
        price,
        cover_url,
        cover_storage_path,
        tags,
        status,
        updated_at,
        use_shared_content
      )
    `)
    .order('order_position', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const filteredRows = (data ?? []).filter((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return product && product.status === 'active';
  });

  const ids = filteredRows.map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return product.id;
  });

  let translations = [];
  if (ids.length > 0) {
    const { data: trs } = await supabase
      .from('products_translations')
      .select('*')
      .in('product_id', ids)
      .in('language', [locale, 'pt']);
    translations = trs ?? [];
  }

  console.log('\nTranslations fetched:', translations.map(t => ({ id: t.product_id, lang: t.language, title: t.title })));

  const result = filteredRows.map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    
    const t = translations.find((tr) => tr.product_id === product.id && tr.language === locale);
    const fb = translations.find((tr) => tr.product_id === product.id && tr.language === 'pt');
    const useShared = Boolean(product.use_shared_content);

    const title = useShared ? product.title : (t?.title || fb?.title || product.title);
    const description = useShared ? product.description : (t?.description || fb?.description || product.description);
    const cover_url = useShared ? product.cover_url : (t?.cover_url || fb?.cover_url || product.cover_url);
    const cover_storage_path = useShared ? product.cover_storage_path : (t?.cover_url || fb?.cover_url || product.cover_storage_path);

    const tags = product.tags ?? [];
    const resolvedCover = row.custom_cover?.trim() ||
      getProductCoverUrl({
        cover_url,
        cover_storage_path,
        language: useShared ? 'pt' : locale,
        use_shared_content: useShared,
        updated_at: product.updated_at
      });

    return {
      id: row.id,
      product_id: row.product_id,
      title: row.custom_title?.trim() || title,
      cover_url: resolvedCover,
      cover_storage_path: cover_storage_path,
      raw_product_cover_url: product.cover_url,
      raw_product_cover_storage_path: product.cover_storage_path,
      t_cover_url: t?.cover_url,
      fb_cover_url: fb?.cover_url,
    };
  });

  console.log('\nResolved featured products:', JSON.stringify(result, null, 2));
}

run();
