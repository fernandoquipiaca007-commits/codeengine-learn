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

async function run() {
  const { data, error } = await supabase.rpc('get_policies'); // If custom function exists
  if (error) {
    // Fallback: Query system tables
    const { data: policies, error: sqlError } = await supabase.from('products_translations').select('count', { count: 'exact', head: true });
    console.log('Test select count on products_translations:', { count: policies, error: sqlError });
  } else {
    console.log('Policies:', data);
  }
}

run();
