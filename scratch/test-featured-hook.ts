import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envFile = fs.readFileSync('c:/Users/Dell/Documents/codeengine1.2/.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run(locale: string) {
  const { data, error } = await supabase
    .from('featured_products')
    .select(
      `
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
    `
    )
    .eq('active', true)
    .order('order_position', { ascending: true })
    .limit(3);

  if (error) throw error;

  const filteredRows = (data ?? []).filter((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return product && product.status === 'active';
  });

  const ids = filteredRows.map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return product.id;
  });

  let translations: any[] = [];
  if (ids.length > 0) {
    const { data: trs } = await supabase
      .from('products_translations')
      .select('*')
      .in('product_id', ids)
      .in('language', [locale, 'pt']);
    translations = trs ?? [];
  }

  const result = filteredRows.map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product) return null;

    const t = translations.find((tr) => tr.product_id === product.id && tr.language === locale);
    const fb = translations.find((tr) => tr.product_id === product.id && tr.language === 'pt');
    const useShared = Boolean(product.use_shared_content);

    const title = useShared ? product.title : (t?.title || fb?.title || product.title);
    const description = useShared ? product.description : (t?.description || fb?.description || product.description);

    return {
      product_id: product.id,
      locale,
      t_title: t?.title,
      fb_title: fb?.title,
      resolved_title: title
    };
  });

  console.log(`LOCALE: ${locale}`, JSON.stringify(result, null, 2));
}

async function start() {
  await run('en');
  await run('fr');
  await run('pt');
}

start();
