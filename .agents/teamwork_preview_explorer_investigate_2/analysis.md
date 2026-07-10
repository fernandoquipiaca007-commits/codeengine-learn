# Recommendations and Codebase Analysis Report

This report provides the analysis and recommendations for implementing the follow-up requirements for the CodeEngine ecosystem.

---

## 1. Simplified Creator Registration Flow ("Conte mais sobre você")

### Frontend: `src/pages/About.tsx` / `src/pages/CollaboratorApply.tsx`
- **File**: `src/pages/CollaboratorApply.tsx`
- **Recommended Changes**:
  1. Rename the component header or page title to **"Conte mais sobre você"**.
  2. Remove the "Preferências de Repasse Financeiro" (PayPal/IBAN) section (lines 272–306) and the "Estimativa de Armazenamento" (Strategic Survey) section (lines 308–425).
  3. Keep only the 3 fields under "Perfil Profissional":
     - Nome de Exibição / Canal (`displayName`)
     - Área de Especialização / Especialidade (`specialty`)
     - Minibiografia / Descrição (`bio`)
  4. Simplify the form submission body sent to `POST /api/collaborators/apply`. You can omit the `payoutMethod`, `payoutInfo`, and `survey` fields (or send empty values/defaults if required by constraints).
  5. Remove the conditional screen states for `"pending"` (lines 151–173) and `"rejected"` (lines 175–202) entirely since creators will be immediately approved.
  6. Upon successful submission, redirect the user immediately to the Creator Dashboard (`colaborador` screen) by calling `onCandidacyApproved()` or updating `candidacyStatus` to `'approved'` and setting the screen.

### Backend: `backend/api/collaborators/routes.ts`
- **File**: `backend/api/collaborators/routes.ts` (Endpoint `POST /api/collaborators/apply` - lines 23–108)
- **Recommended Changes**:
  1. Modify the collaborator insertion: Set `status` immediately to `'approved'` (instead of `'pending'`).
  2. Ensure the member's profile role is updated in `members` table:
     ```typescript
     await supabaseAdmin
       .from('members')
       .update({
         profile_data: {
           ...(member.profile_data || {}),
           role: 'criador'
         }
       })
       .eq('id', member.id);
     ```
  3. Initialize the collaborator's wallet/balance immediately on the backend:
     ```typescript
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
  4. Ensure any references to the referral code linking or other onboarding logic remain intact.

---

## 2. Auto-Publishing and Scheduling

### Database Schema Updates (Supabase Migration)
- **Action**: Add a new column `scheduled_publish_at` to the `products` table:
  ```sql
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ DEFAULT NULL;
  ```

### Backend: `backend/api/collaborators/routes.ts`
- **File**: `backend/api/collaborators/routes.ts` (Endpoint `POST /api/collaborators/products` - lines 1011–1234)
- **Recommended Changes**:
  1. Parse the new field `scheduled_publish_at` from `req.body`.
  2. When inserting the product:
     - Always set `approval_status: 'approved'`.
     - If `scheduled_publish_at` is provided and is in the future:
       - Set `status: 'draft'`
       - Set `scheduled_publish_at: new Date(scheduled_publish_at).toISOString()`
     - If `scheduled_publish_at` is NOT provided (immediate publishing):
       - Set `status: 'active'`
       - Set `scheduled_publish_at: null`
       - Immediately trigger Stripe Product and Price creation (see Stripe Sync logic below).
  3. Notify the administrator (see notifications logic below).

### Stripe Synchronization Logic
For immediate publishing:
If `price_currency === 'USD'` and `price > 0`:
```typescript
const productResult = await createStripeProduct({
  name: title,
  description: description,
  images: coverUrl ? [coverUrl] : [],
  metadata: {
    supabase_product_id: product.id,
    collaborator_id: collaborator.id
  }
});

if (productResult.success) {
  const priceResult = await createStripePrice({
    productId: productResult.productId!,
    amount: Number(price),
    currency: 'usd',
    metadata: { supabase_product_id: product.id }
  });
  
  if (priceResult.success) {
    await supabaseAdmin
      .from('products')
      .update({
        stripe_product_id: productResult.productId,
        stripe_price_id: priceResult.priceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
  }
}
```

### Admin Notifications Logic
When a product is active:
1. Find the admin's member ID (where email is `'fernandoquipiaca007@gmail.com'`).
2. Insert a row into the `notifications` table:
   ```typescript
   const { data: adminMember } = await supabaseAdmin
     .from('members')
     .select('id')
     .eq('email', 'fernandoquipiaca007@gmail.com')
     .maybeSingle();

   if (adminMember) {
     await supabaseAdmin.from('notifications').insert({
       member_id: adminMember.id,
       type: 'system',
       title: '📦 Novo Produto Publicado',
       message: `O criador ${collaborator.display_name} publicou o produto "${title}". Adicione o link FassePay para Angola.`,
       link_url: `/admin`,
       read_status: false
     });
   }
   ```
3. Send an email notification:
   ```typescript
   sendViaResend(
     'fernandoquipiaca007@gmail.com',
     `Novo Produto Publicado - ${title}`,
     `<p>O criador <strong>${collaborator.display_name}</strong> publicou o produto <strong>${title}</strong>.</p>
      <p>Aceda ao painel administrativo para registar o link FassePay correspondente.</p>`
   ).catch(err => console.error('[admin-notify] failed:', err));
   ```

### Scheduled Publishing Cron Job
- **File**: `backend/stripe-server.ts`
- **Recommended Changes**:
  Add a periodic job (running every 60 seconds) that fetches products where `status = 'draft'`, `approval_status = 'approved'`, and `scheduled_publish_at <= NOW()`.
  For each matching product:
  1. Update its `status` to `'active'`.
  2. If the currency is USD, perform the Stripe Product & Price sync JIT.
  3. Send the admin notifications (email + in-app notification).

### Product Editing: `PUT /api/collaborators/products/:id`
- **File**: `backend/api/collaborators/routes.ts` (Endpoint `PUT /api/collaborators/products/:id` - lines 1237–1340)
- **Recommended Changes**:
  Remove the reset status overrides (lines 1277–1278):
  ```typescript
  // REMOVE OR MODIFIY THESE LINES
  approval_status: 'pending_review',
  status: 'draft',
  ```
  Instead, keep `approval_status` as `'approved'` and preserve the existing `status` (unless it is explicitly updated or modified).

---

## 3. UI/UX Bug Fixes

### Bug A: "Erro ao carregar análise. Tente novamente."
- **File**: `backend/api/collaborators/routes.ts` (Endpoint `GET /api/collaborators/analytics` - lines 1720–1731)
- **Root Cause**:
  The query references `created_at`, `amount`, and `currency` in the `purchases` table:
  ```typescript
  .select('created_at, amount, currency, product_id')
  ```
  However, the `purchases` table does not contain these columns; it contains `purchase_date`, `amount_paid` (USD), and `amount_paid_aoa` (AOA) instead. This mismatch returns a database error, causing the API to fail or return an invalid result, triggering the frontend error message.
- **Recommended Fix**:
  Change the query select structure to:
  ```typescript
  const { data: purchases, error: purchasesErr } = await supabaseAdmin
    .from('purchases')
    .select('purchase_date, amount_paid, amount_paid_aoa, product_id')
    .in('product_id', targetProductIds)
    .eq('payment_status', 'completed')
    .gte('purchase_date', startDate.toISOString());
  ```
  Update the aggregation loop (lines 1763–1778):
  ```typescript
  purchasesData.forEach(p => {
    try {
      const dateStr = new Date(p.purchase_date).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].conversions += 1;
        const valUsd = Number(p.amount_paid) || 0;
        const valAoa = Number(p.amount_paid_aoa) || 0;
        dailyStats[dateStr].revenueUsd += valUsd;
        dailyStats[dateStr].revenueAoa += valAoa;
      }
    } catch (err) {
      // Safe catch
    }
  });
  ```

### Bug B: "Access denied. Approved collaborator account required."
- **File**: `backend/middleware/auth-collaborator.ts` (Middleware `requireCollaborator` - lines 66–166)
- **Root Cause**:
  If a creator registers and their `profile_data.role` is set to `'criador'` but they don't have an approved collaborator record (e.g. they registered via the old flow or there was a creation race condition), the middleware will fail. Furthermore, if a collaborator record exists but its status is `'pending'` or `'rejected'` (from historical data), they are denied access.
- **Recommended Fix**:
  Update `requireCollaborator` to perform a robust check. If a collaborator record exists (even with `'pending'` or `'rejected'` status) and the user has role `'criador'`, or if we just want to auto-approve any user trying to access the dashboard who is supposed to be a creator:
  ```typescript
  // JIT fallback within requireCollaborator:
  const { data: existingCollab } = await supabaseAdmin
    .from('collaborators')
    .select('id, status')
    .eq('member_id', member.id)
    .maybeSingle();

  if (existingCollab) {
    if (existingCollab.status !== 'approved') {
      // Auto-approve them JIT
      const { data: updated } = await supabaseAdmin
        .from('collaborators')
        .update({ status: 'approved', plan: 'pro_creator' })
        .eq('id', existingCollab.id)
        .select('*, members!inner(auth_id, email)')
        .single();
      collaborator = updated;
    }
  } else {
    // Create approved collaborator record JIT
    ...
  }
  ```
  Ensure that `collaborator_balances` is also initialized during JIT creation/approval.

### Bug C: About Page Text Contrast & Scrollbar Issues
- **File**: `src/pages/About.tsx`
- **Recommended Changes**:
  1. Replace low-contrast Tailwind text classes `text-on-surface-variant` with high-contrast classes:
     - For main descriptions and subtitles: Use `text-white/70` instead of `text-on-surface-variant`.
     - For secondary labels and stat labels: Use `text-white/50` instead of `text-on-surface-variant`.
  2. Scrollbar shift: Set `scrollbar-gutter: stable` on the main page wrapper or global HTML element to prevent layout shifts when navigating to/from pages of varying heights. Ensure the top container has no overflow issues that could trigger redundant scrollbars.
