import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.L3KbY27ZeVrChAlU3hknsYLcdXZ9_0hWHwZVXK8yaEI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulate(locale) {
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
        cover_url,
        cover_storage_path,
        tags,
        status,
        updated_at,
        use_shared_content
      )
    `)
    .eq('active', true)
    .order('order_position', { ascending: true })
    .limit(3);

  if (error) {
    console.error(error);
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

  console.log(`\n=== SIMULATION FOR LOCALE: ${locale} ===`);
  filteredRows.forEach((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const t = translations.find((tr) => tr.product_id === product.id && tr.language === locale);
    const fb = translations.find((tr) => tr.product_id === product.id && tr.language === 'pt');
    const useShared = Boolean(product.use_shared_content);

    const title = useShared ? product.title : (t?.title || fb?.title || product.title);
    const description = useShared ? product.description : (t?.description || fb?.description || product.description);

    console.log({
      product_id: product.id,
      useShared,
      has_t: !!t,
      has_fb: !!fb,
      resolved_title: title,
      resolved_description_snippet: description?.slice(0, 120)
    });
  });
}

async function run() {
  await simulate('pt');
  await simulate('en');
  await simulate('fr');
}

run();
