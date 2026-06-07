import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log(`Clearing custom fields in featured_products`);

  const { data: rows, error: fetchError } = await supabase
    .from('featured_products')
    .select('id');

  if (fetchError) {
    console.error('Error fetching featured_products:', fetchError);
    return;
  }

  console.log(`Found ${rows.length} rows to update.`);

  for (const row of rows) {
    const { data, error } = await supabase
      .from('featured_products')
      .update({
        custom_title: null,
        custom_subtitle: null,
        custom_description: null,
        custom_cover: null,
        custom_cta: null
      })
      .eq('id', row.id)
      .select();

    if (error) {
      console.error(`Error updating featured product ${row.id}:`, error);
    } else {
      console.log(`Updated row ${row.id} successfully:`, JSON.stringify(data, null, 2));
    }
  }
}

run();
