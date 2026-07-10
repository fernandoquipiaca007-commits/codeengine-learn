# Codebase Investigation & Technical Recommendations Report

This report documents the results of the codebase investigation for the creator module, publishing system, and UI/UX issues, providing concrete recommendations and code patches for implementation.

---

## 1. Simplified Creator Registration Flow

### 1.1 Frontend Changes (`src/pages/CollaboratorApply.tsx`)
- **File Location**: `src/pages/CollaboratorApply.tsx`
- **Observations**: 
  - The form currently asks for payout methods (`paypal` vs `iban`) on lines 272-306, and storage estimates on lines 308-425.
  - The component renders a pending candidacy state on lines 151-173 and a rejected state on lines 175-202.
- **Recommendations**:
  - Remove Section 2 ("Preferências de Repasse Financeiro") and Section 3 ("Estimativa de Armazenamento") from the JSX render function.
  - Change the header title from "Candidatar-se a Criador" to **"Conte mais sobre você"**.
  - When the form is submitted (`handleSubmit` on line 74), the backend is called. Upon receiving `success: true`, the frontend should directly trigger `onCandidacyApproved()` and redirect the user using `setScreen('colaborador')`.
  - Remove or deactivate the pending/rejected render states.

### 1.2 Backend Changes (`backend/api/collaborators/routes.ts`)
- **File Location**: `backend/api/collaborators/routes.ts`
- **Observations**: 
  - `/api/collaborators/apply` (lines 23-108) currently sets the collaborator record's status to `'pending'` (line 85) and does not update the member's role or initialize their balance.
- **Recommendations**:
  - Update `status` to `'approved'` during the insert.
  - Set `approved_at` to the current timestamp.
  - Update the user's role to `'criador'` in the `members` table.
  - Initialize the `collaborator_balances` table.
- **Proposed Code Block for `/api/collaborators/apply`**:
```typescript
    // Insert collaborator candidate as APPROVED
    const { data: collaborator, error } = await supabaseAdmin
      .from('collaborators')
      .insert({
        member_id: member.id,
        display_name: displayName,
        bio: bio || '',
        specialty: specialty || '',
        status: 'approved', // Auto-approved
        plan: 'ebook_creator',
        payout_method: payoutMethod,
        payout_info: payoutInfo || {},
        onboarding_survey: survey,
        approved_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[applyCollaborator] error:', error);
      return res.status(500).json({ success: false, error: 'Erro ao salvar candidatura.' });
    }

    // Update member role in profile_data to 'criador'
    const updatedProfile = { ...(member.profile_data || {}), role: 'criador' };
    await supabaseAdmin
      .from('members')
      .update({ profile_data: updatedProfile })
      .eq('id', member.id);

    // Initialize collaborator balance in the database
    await supabaseAdmin
      .from('collaborator_balances')
      .insert({
        collaborator_id: collaborator.id,
        accumulated_earnings: 0.00,
        available_balance: 0.00,
        pending_balance: 0.00,
        withdrawn_amount: 0.00
      });
```

### 1.3 JIT Helper Changes (`backend/lib/access.ts`)
- **File Location**: `backend/lib/access.ts`
- **Observations**: 
  - `ensureCollaboratorExists` (lines 172-222) auto-creates or auto-approves a collaborator but does not initialize their balance or update the member's profile role.
- **Recommendations**:
  - Update the function to automatically insert a row in `collaborator_balances` if it is a new collaborator record.
  - Update the member's role to `'criador'` as a safety guarantee.

---

## 2. Auto-Publishing and Scheduling of Products

### 2.1 Database Schema Changes
- **Target**: `products` table
- **Proposed Migration**:
```sql
-- Migration to add scheduling columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_scheduled_publish_at ON public.products(scheduled_publish_at) WHERE status = 'draft';
```

### 2.2 Product Creation Changes (`backend/api/collaborators/routes.ts`)
- **File Location**: `backend/api/collaborators/routes.ts`
- **Observations**:
  - `POST /api/collaborators/products` (lines 1012-1234) initializes product status to `'draft'` and approval status to `'pending_review'` (lines 1080, 1082).
- **Recommendations**:
  - Accept `scheduledPublishAt` (from request body) in the product creation endpoint.
  - If `scheduledPublishAt` is set and is in the future:
    - Set `status: 'draft'`, `approval_status: 'approved'`, and `scheduled_publish_at: scheduledPublishAt`.
  - If `scheduledPublishAt` is NOT set:
    - Set `status: 'active'`, `approval_status: 'approved'`, and `scheduled_publish_at: null`.
    - Immediately sync the USD product with Stripe.
    - Notify the admin (see Section 2.4).
- **Proposed Code Block modification**:
```typescript
    const { 
      // ... existing body fields
      scheduledPublishAt
    } = req.body;

    const isScheduled = scheduledPublishAt && new Date(scheduledPublishAt) > new Date();

    const productInsert = {
      // ... existing product fields
      status: isScheduled ? 'draft' : 'active',
      approval_status: 'approved', // Auto-approved by default
      scheduled_publish_at: isScheduled ? new Date(scheduledPublishAt).toISOString() : null,
      // ...
    };

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert(productInsert)
      .select()
      .single();
    
    if (error) return res.status(500).json({ success: false, error: 'Erro ao cadastrar.' });

    // If active immediately, run Stripe sync and notify admin
    if (!isScheduled) {
      if (!isFree && baseCurrency === 'USD') {
        // Sync with Stripe
        const productResult = await createStripeProduct({
          name: product.title,
          description: product.description,
          images: product.cover_url ? [product.cover_url] : [],
          metadata: { supabase_product_id: product.id, collaborator_id: collaborator.id }
        });
        if (productResult.success) {
          const priceResult = await createStripePrice({
            productId: productResult.productId!,
            amount: Number(product.price),
            currency: 'usd',
            metadata: { supabase_product_id: product.id }
          });
          if (priceResult.success) {
            await supabaseAdmin
              .from('products')
              .update({
                stripe_product_id: productResult.productId,
                stripe_price_id: priceResult.priceId,
                stripe_checkout_url: `https://checkout.stripe.com/pay/${priceResult.priceId}`
              })
              .eq('id', product.id);
          }
        }
      }
      
      // Notify Admin
      await notifyAdminsNewProduct(product.id, product.title, collaborator.display_name);
    }
```

### 2.3 Product Editing Changes (`backend/api/collaborators/routes.ts`)
- **File Location**: `backend/api/collaborators/routes.ts`
- **Observations**:
  - `PUT /api/collaborators/products/:id` (lines 1237-1350) resets status to `'draft'` and approval status to `'pending_review'` on lines 1277-1278.
- **Recommendations**:
  - Remove these two lines:
    ```typescript
    approval_status: 'pending_review', // Resets to pending review on edits
    status: 'draft',                   // Resets to draft until re-approved
    ```
  - Preserve the existing status and approval status when edited.

### 2.4 Admin Notification Setup
- **Recommendations**:
  - Implement a helper function `notifyAdminsNewProduct` that queries active admin users and inserts a notification in the `notifications` table:
```typescript
export async function notifyAdminsNewProduct(productId: string, productTitle: string, creatorName: string) {
  try {
    // Get active admins
    const { data: adminUsers } = await supabaseAdmin
      .from('admin_users')
      .select('auth_user_id')
      .eq('active', true);
      
    if (!adminUsers || adminUsers.length === 0) return;
    
    // Find matching member IDs
    const adminAuthIds = adminUsers.map(au => au.auth_user_id);
    const { data: adminMembers } = await supabaseAdmin
      .from('members')
      .select('id')
      .in('auth_id', adminAuthIds);
      
    if (!adminMembers) return;
    
    for (const admin of adminMembers) {
      await supabaseAdmin.from('notifications').insert({
        member_id: admin.id,
        type: 'admin_new_product',
        message: `Novo produto publicado por ${creatorName}: "${productTitle}". Por favor, configure o link FaciPay se aplicável.`,
        read_status: false,
        created_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error notifying admins about new product:', err);
  }
}
```

### 2.5 Cron Worker for Scheduled Products
- **Recommendations**:
  - Add an endpoint `POST /api/products/process-scheduled` to process scheduled products.
  - Register it in `backend/stripe-server.ts` and set up an interval timer:
```typescript
  // Process scheduled products every 60 seconds
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/products/process-scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) { /* silent */ }
  }, 60_000);
```
- **Endpoint Implementation**:
```typescript
app.post('/api/products/process-scheduled', async (req: Request, res: Response) => {
  try {
    // Find all products whose publish time has arrived
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, collaborators(display_name)')
      .eq('status', 'draft')
      .eq('approval_status', 'approved')
      .lte('scheduled_publish_at', new Date().toISOString());

    if (error || !products || products.length === 0) {
      return res.json({ success: true, activatedCount: 0 });
    }

    let activatedCount = 0;
    for (const product of products) {
      // 1. Activate product
      await supabaseAdmin
        .from('products')
        .update({ status: 'active', scheduled_publish_at: null })
        .eq('id', product.id);

      // 2. Stripe Sync (USD)
      if (product.price > 0 && product.base_currency === 'USD') {
        const productResult = await createStripeProduct({
          name: product.title,
          description: product.description,
          images: product.cover_url ? [product.cover_url] : [],
          metadata: { supabase_product_id: product.id }
        });
        if (productResult.success) {
          const priceResult = await createStripePrice({
            productId: productResult.productId!,
            amount: Number(product.price),
            currency: 'usd',
            metadata: { supabase_product_id: product.id }
          });
          if (priceResult.success) {
            await supabaseAdmin
              .from('products')
              .update({
                stripe_product_id: productResult.productId,
                stripe_price_id: priceResult.priceId,
                stripe_checkout_url: `https://checkout.stripe.com/pay/${priceResult.priceId}`
              })
              .eq('id', product.id);
          }
        }
      }

      // 3. Notify Admin
      const creatorName = product.collaborators?.display_name || 'Criador';
      await notifyAdminsNewProduct(product.id, product.title, creatorName);
      
      activatedCount++;
    }

    return res.json({ success: true, activatedCount });
  } catch (err) {
    console.error('Error processing scheduled products:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 3. UI/UX Bug Fixes

### 3.1 Analytics Endpoint Error (`backend/api/collaborators/routes.ts`)
- **File Location**: `backend/api/collaborators/routes.ts`
- **Observations**: 
  - The GET `/analytics` endpoint queries columns `amount`, `currency`, and `created_at` from the `purchases` table (line 1721).
  - The actual schema of the `purchases` table has `amount_paid`, `amount_paid_aoa`, and `purchase_date` instead.
  - The endpoint also queries a table called `page_views` (line 1705) which does not exist in the database.
- **Recommendations**:
  1. Update the purchases query and aggregation logic to reference `amount_paid`, `amount_paid_aoa`, and `purchase_date`.
  2. Create the missing `page_views` table via a SQL migration.
- **SQL Migration for `page_views`**:
```sql
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON public.page_views(created_at DESC);
```
- **Code Patch for `/analytics` (lines 1720-1731)**:
```typescript
    // 5. Query purchases
    if (targetProductIds.length > 0) {
      const { data: purchases, error: purchasesErr } = await supabaseAdmin
        .from('purchases')
        .select('purchase_date, amount_paid, amount_paid_aoa, product_id')
        .in('product_id', targetProductIds)
        .eq('payment_status', 'completed')
        .gte('purchase_date', startDate.toISOString());

      if (purchasesErr) {
        console.error('[collabAnalytics] purchases query error:', purchasesErr);
      } else {
        purchasesData = purchases || [];
      }
    }
```
- **Code Patch for `/analytics` aggregation (lines 1763-1778)**:
```typescript
    // 8. Aggregate purchases
    purchasesData.forEach(p => {
      try {
        const dateStr = new Date(p.purchase_date).toISOString().split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].conversions += 1;
          const amtUsd = Number(p.amount_paid) || 0;
          const amtAoa = Number(p.amount_paid_aoa) || 0;
          
          if (amtAoa > 0) {
            dailyStats[dateStr].revenueAoa += amtAoa;
          }
          if (amtUsd > 0) {
            dailyStats[dateStr].revenueUsd += amtUsd;
          }
        }
      } catch (err) {
        // Safe catch
      }
    });
```

### 3.2 Access Denied Bug in Middleware (`backend/middleware/auth-collaborator.ts`)
- **File Location**: `backend/middleware/auth-collaborator.ts`
- **Observations**: 
  - JIT auto-creation/upgrade in `requireCollaborator` sets the collaborator `plan` to `'pro_creator'` (lines 124 and 140).
  - The `collaborators` table has a CHECK constraint: `CHECK (plan IN ('ebook_creator', 'course_creator'))`.
  - Because `'pro_creator'` is not a valid plan under this constraint, the database insert/update fails, preventing authorization.
- **Recommendations**:
  - Replace `'pro_creator'` with `'course_creator'` (or `'ebook_creator'`) inside `requireCollaborator` middleware:
- **Code Patch (line 124)**:
```typescript
// Replace:
.update({ status: 'approved', plan: 'pro_creator' })
// With:
.update({ status: 'approved', plan: 'course_creator' })
```
- **Code Patch (line 140)**:
```typescript
// Replace:
plan: 'pro_creator',
// With:
plan: 'course_creator',
```

### 3.3 About Page Contrast and Scrollbar Layout Shift (`src/pages/About.tsx`)
- **File Location**: `src/pages/About.tsx`
- **Observations**: 
  - The descriptions and labels use the Tailwind class `text-on-surface-variant`, which offers insufficient contrast on dark backgrounds.
  - The page doesn't prevent layout shifts when scrollbars appear during lazy loading or screen shifts.
- **Recommendations**:
  - Substitute the low-contrast `text-on-surface-variant` with higher contrast colors: `text-white/70` for main descriptions and manifesto paragraphs, and `text-white/50` for statistics labels.
  - Update the title gradient to `from-white to-white/70`.
  - Add `scrollbar-gutter: stable` styles to the root wrapper of the page component to prevent horizontal shifts.
- **Proposed Style/Class adjustments**:
```typescript
// On line 56, add styling to prevent layout shifts:
<div 
  className="pt-14 pb-4 px-4 sm:px-6 md:px-12 max-w-[1080px] mx-auto overflow-x-hidden"
  style={{ scrollbarGutter: 'stable' }}
>

// Update low-contrast texts:
// Hero header gradient:
from-white to-white/70

// Hero subtitle (line 67):
text-white/70

// Stats label (line 109):
text-white/50

// Values description (line 143):
text-white/70

// Features description (line 177):
text-white/70

// Manifesto paragraphs (line 199):
text-white/70

// Ready to start description (line 220):
text-white/70
```
