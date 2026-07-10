import { Client } from 'pg';

const connectionString = 'postgresql://postgres.ffdqqiunkzhtgbgaojay:JUNIOR.com0007@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('CONNECTED TO DATABASE SUCCESSFULLY.');

    // 1. Check sales_analytics columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_analytics'
    `);
    const cols = columnsRes.rows.map((row: any) => row.column_name);
    console.log('SALES_ANALYTICS COLUMNS:', cols);
    const hasTotalRevenue = cols.includes('total_revenue');
    const hasUniqueCustomers = cols.includes('unique_customers');
    console.log('hasTotalRevenue:', hasTotalRevenue);
    console.log('hasUniqueCustomers:', hasUniqueCustomers);

    // 2. Check products columns
    const prodColumnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    const prodCols = prodColumnsRes.rows.map((row: any) => row.column_name);
    const hasScheduledPublish = prodCols.includes('scheduled_publish_at');
    console.log('hasScheduledPublish:', hasScheduledPublish);

    // 3. Test insert purchase to verify trigger does not fail
    const memberRes = await client.query('SELECT id FROM members LIMIT 1');
    const productRes = await client.query('SELECT id FROM products LIMIT 1');
    
    if (memberRes.rows.length > 0 && productRes.rows.length > 0) {
      const memberId = memberRes.rows[0].id;
      const productId = productRes.rows[0].id;
      const testTxId = 'test_verify_' + Date.now();
      
      console.log(`TESTING PURCHASE INSERT with completed status for member: ${memberId}, product: ${productId}`);
      try {
        await client.query(`
          INSERT INTO purchases (member_id, product_id, amount_paid, payment_status, access_type, transaction_id, purchase_date, final_amount)
          VALUES ($1, $2, 0, 'completed', 'free', $3, NOW(), 0)
        `, [memberId, productId, testTxId]);
        console.log('✅ PURCHASE INSERT COMPLETED SUCCESSFULLY (No Trigger Errors)');
        
        // Clean up
        await client.query('DELETE FROM purchases WHERE transaction_id = $1', [testTxId]);
        console.log('✅ Cleaned up test purchase.');
      } catch (err: any) {
        console.error('❌ PURCHASE INSERT FAILED:', err.message);
      }
    } else {
      console.log('⚠️ Could not run test insert (no member or product found in DB).');
    }

    // 4. Test product scheduled publishing logic
    const collabRes = await client.query('SELECT id FROM collaborators LIMIT 1');
    const catRes = await client.query('SELECT id FROM categories LIMIT 1');
    
    if (collabRes.rows.length > 0 && catRes.rows.length > 0) {
      const collabId = collabRes.rows[0].id;
      const categoryId = catRes.rows[0].id;
      const pastPublishDate = new Date();
      pastPublishDate.setMinutes(pastPublishDate.getMinutes() - 10);
      const futurePublishDate = new Date();
      futurePublishDate.setMinutes(futurePublishDate.getMinutes() + 10);

      const pastTitle = 'Test Past Scheduled ' + Date.now();
      const futureTitle = 'Test Future Scheduled ' + Date.now();

      await client.query(`
        INSERT INTO products (title, description, price, status, approval_status, collaborator_id, category_id, scheduled_publish_at)
        VALUES ($1, 'test description', 0, 'draft', 'approved', $2, $3, $4)
      `, [pastTitle, collabId, categoryId, pastPublishDate.toISOString()]);

      await client.query(`
        INSERT INTO products (title, description, price, status, approval_status, collaborator_id, category_id, scheduled_publish_at)
        VALUES ($1, 'test description', 0, 'draft', 'approved', $2, $3, $4)
      `, [futureTitle, collabId, categoryId, futurePublishDate.toISOString()]);

      console.log('✅ Inserted past and future scheduled products.');

      // Run publish logic (LTE now)
      const nowStr = new Date().toISOString();
      const publishRes = await client.query(`
        UPDATE products 
        SET status = 'active', scheduled_publish_at = NULL 
        WHERE status = 'draft' 
          AND approval_status = 'approved' 
          AND scheduled_publish_at <= $1
        RETURNING id, title, status, scheduled_publish_at
      `, [nowStr]);

      console.log('PUBLISHED PRODUCTS:', publishRes.rows);
      
      const pastDb = await client.query('SELECT status, scheduled_publish_at FROM products WHERE title = $1', [pastTitle]);
      const futureDb = await client.query('SELECT status, scheduled_publish_at FROM products WHERE title = $1', [futureTitle]);

      console.log('Past Product Status (expected active, null):', pastDb.rows[0]);
      console.log('Future Product Status (expected draft, not null):', futureDb.rows[0]);

      // Cleanup
      await client.query('DELETE FROM products WHERE title IN ($1, $2)', [pastTitle, futureTitle]);
      console.log('✅ Cleaned up scheduled product tests.');
    } else {
      console.log('⚠️ Could not run scheduling tests (no collaborator or category found in DB).');
    }

  } catch (err: any) {
    console.error('ERROR during verification:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
