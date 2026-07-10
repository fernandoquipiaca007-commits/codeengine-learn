# Handoff Report — Codebase Exploration and Bug Analysis

This handoff report summarizes the findings, reasoning, and verification methods for creator registration, auto-publishing, scheduling, and UI/UX bug fixes.

---

## 1. Observation

1. **Creator Registration Form**: 
   - File: `src/pages/CollaboratorApply.tsx`
   - Payout preferences section: lines 272–306:
     ```typescript
     <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">2. Preferências de Repasse Financeiro</h3>
     ...
     ```
   - Onboarding strategic survey section: lines 308–425:
     ```typescript
     <h3 className="mb-4 text-lg font-semibold text-white border-l-4 border-primary pl-2 font-display">3. Estimativa de Armazenamento</h3>
     ...
     ```
   - Pending state display: lines 151–173:
     ```typescript
     if (candidacyStatus === 'pending') { ... }
     ```
   - Rejected state display: lines 175–202:
     ```typescript
     if (candidacyStatus === 'rejected') { ... }
     ```

2. **Candidacy Application API**:
   - File: `backend/api/collaborators/routes.ts`
   - Insertion logic: lines 77–90:
     ```typescript
     const { data: collaborator, error } = await supabaseAdmin
       .from('collaborators')
       .insert({
         member_id: member.id,
         display_name: displayName,
         bio: bio || '',
         specialty: specialty || '',
         status: 'pending',
         plan: 'ebook_creator',
         payout_method: payoutMethod,
         payout_info: payoutInfo || {},
         onboarding_survey: survey
       })
     ```

3. **Analytics Mismatches (Traffic Analytics Bug)**:
   - File: `backend/api/collaborators/routes.ts`
   - Purchases query (lines 1720–1724):
     ```typescript
     const { data: purchases, error: purchasesErr } = await supabaseAdmin
       .from('purchases')
       .select('created_at, amount, currency, product_id')
       .in('product_id', targetProductIds)
       .eq('payment_status', 'completed')
       .gte('created_at', startDate.toISOString());
     ```
   - Purchases aggregation (lines 1763–1778):
     ```typescript
     purchasesData.forEach(p => {
       try {
         const dateStr = new Date(p.created_at).toISOString().split('T')[0];
         ...
       } catch (err) { ... }
     ```
   - Actual `purchases` schema (verified via `backend/lib/fulfill-purchase.ts` line 274):
     It inserts `purchase_date`, `amount_paid`, `amount_paid_aoa`, but does not contain columns `created_at`, `amount`, or `currency`.

4. **Creator Account Block (Access Denied Bug)**:
   - File: `backend/middleware/auth-collaborator.ts`
   - Verification logic (lines 80–86):
     ```typescript
     let { data: collaborator, error: collabError } = await supabaseAdmin
       .from('collaborators')
       .select('*, members!inner(auth_id, email)')
       .eq('members.auth_id', user.id)
       .eq('status', 'approved')
       .maybeSingle();
     ```
   - If a collaborator record exists but has `status` set to `'pending'` or `'rejected'` and the member does not have `role: 'criador'` in their `profile_data`, the JIT fallback is bypassed, returning `Access denied. Approved collaborator account required.`.

5. **About Page Styling (Contrast Issue)**:
   - File: `src/pages/About.tsx`
   - Text paragraphs and secondary descriptions (lines 67, 109, 143, 177, 199, 220) use Tailwind class `text-on-surface-variant` which has low contrast against the dark background.

---

## 2. Logic Chain

1. **Creator Registration Form**:
   - The user requested replacing the application page with "Conte mais sobre você" containing only 3 fields (Display Name, Specialty, Bio).
   - Observing lines 272–425 in `CollaboratorApply.tsx` confirms these sections are distinct and can be safely removed.
   - Observing lines 151–202 in `CollaboratorApply.tsx` confirms the pending/rejected screen states are separate component return blocks that can be deleted to allow immediate routing.

2. **Auto-Approval and Balances**:
   - Since `ensureCollaboratorExists` and `/apply` routes do not automatically initialize `collaborator_balances` for every newly approved creator, it must be added to the insertion route or via database triggers to prevent empty balance records in backend dashboards.

3. **Analytics Mismatches (Traffic Analytics Bug)**:
   - Comparing the columns selected in `backend/api/collaborators/routes.ts` (`created_at`, `amount`, `currency`) against the fields inserted in `backend/lib/fulfill-purchase.ts` (`purchase_date`, `amount_paid`, `amount_paid_aoa`) reveals that the queried columns do not exist in the `purchases` table.
   - Database queries referencing non-existent columns fail with a 400 Bad Request error. If the query succeeds but returned values are undefined, calling `.toISOString()` on `new Date(undefined)` triggers a `RangeError: Invalid time value` in JS. This crashes the endpoint call and triggers the frontend loading error `"Erro ao carregar análise. Tente novamente."`.

4. **Creator Account Block (Access Denied Bug)**:
   - The middleware `requireCollaborator` only queries collaborators where `status = 'approved'`. If they are pending/rejected and their member profile has not yet been updated to `'criador'`, the JIT auto-approve logic is skipped entirely, resulting in `403 Access denied`.

5. **About Page Styling (Contrast Issue)**:
   - Replacing `text-on-surface-variant` with `text-white/70` (70% opacity white) and `text-white/50` (50% opacity white) will provide clear, readable contrast against the dark surface containers.

---

## 3. Caveats

- **Existing Data Migration**: The recommendations focus on code modifications. If there are pre-existing collaborator records in `'pending'` or `'rejected'` states, or with missing `collaborator_balances` records, they must be updated/initialized via a one-off SQL script or handled gracefully JIT.
- **Stripe API Environment**: Stripe sync logic depends on valid Stripe API Keys (`STRIPE_SECRET_KEY`) set in `.env.backend`.

---

## 4. Conclusion

- The simplified creator registration flow can be successfully established by refactoring `CollaboratorApply.tsx` (only 3 fields, no pending/rejected states) and updating the `/api/collaborators/apply` endpoint to register as approved, set the member role to `'criador'`, and initialize `collaborator_balances`.
- The product publishing approval flow can bypass admin checks by modifying `POST /api/collaborators/products` and `PUT /api/collaborators/products/:id` to save as `'approved'`/`'active'` directly and syncing USD products immediately via Stripe.
- Scheduling can be achieved by adding the `scheduled_publish_at` column to `products` and adding a 60-second cron interval in `backend/stripe-server.ts`.
- The traffic analytics dashboard bug is resolved by fixing the column names in the Supabase query (`purchase_date` and `amount_paid` / `amount_paid_aoa` instead of `created_at` and `amount`).
- The "Access denied" error is resolved by enhancing the JIT self-healing check in `requireCollaborator` middleware.
- About page contrast is fixed by replacing `text-on-surface-variant` with higher contrast opacity classes (`text-white/70` and `text-white/50`).

---

## 5. Verification Method

1. **Verify Files and Code Presence**:
   - Inspect `src/pages/CollaboratorApply.tsx`, `backend/api/collaborators/routes.ts`, `backend/middleware/auth-collaborator.ts`, and `src/pages/About.tsx` to confirm the code blocks align with the line numbers and classes cited.
2. **Verify Database Structure**:
   - Verify columns on `purchases` table using Supabase dashboard or pgAdmin to confirm that `purchase_date` is the primary date column, and `amount_paid` / `amount_paid_aoa` are the revenue columns.
