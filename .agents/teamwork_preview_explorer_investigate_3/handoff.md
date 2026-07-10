# Handoff Report — Explorer Investigation

## 1. Observation
The following direct observations were made in the codebase:
1. **Creator Registration Form**: `src/pages/CollaboratorApply.tsx` contains payout inputs (lines 272-306) and storage estimation inputs (lines 308-425). Its submission calls `/api/collaborators/apply`.
2. **Candidacy Application Processing**: `backend/api/collaborators/routes.ts` (lines 23-108) inserts collaborators with `status: 'pending'` (line 85) without updating member role or initializing balances.
3. **Analytics Route Bug**: `backend/api/collaborators/routes.ts` line 1721 selects non-existent fields `created_at, amount, currency, product_id` from the `purchases` table. However, `backend/supabase/complete-setup.sql` line 74 defines the table schema with `purchase_date`, `amount_paid`, and `amount_paid_aoa` instead. There is also a select from a non-existent `page_views` table (line 1705).
4. **Access Denied Middleware Bug**: `backend/middleware/auth-collaborator.ts` lines 124 and 140 insert/update `plan` to `'pro_creator'`. However, `backend/supabase/migrations/20260619_collaborators_schema.sql` line 21 defines the `plan` column with check constraint `CHECK (plan IN ('ebook_creator', 'course_creator'))`.
5. **About Page Low Contrast**: `src/pages/About.tsx` styling uses the `text-on-surface-variant` color class (e.g. lines 67, 109, 143, 177, 199, 220), which renders text with low contrast on dark backgrounds. It does not utilize scrollbar prevention styles.

---

## 2. Logic Chain
1. **Creator Flow**: Removing payout and storage inputs from `CollaboratorApply.tsx` and updating the backend route to set `status: 'approved'` will bypass pending/rejected screens and make registration instant. Additionally, updating `profile_data.role` to `'criador'` and inserting a row into `collaborator_balances` during registration activates the creator's workspace and wallet immediately.
2. **Auto-Publishing / Stripe Sync**: Automatically setting product status to `'active'` and approval status to `'approved'` on creation avoids admin bottlenecks. Instantly syncing active USD products with Stripe (via `createStripeProduct` and `createStripePrice`) keeps inventories aligned. Informing admins of new products via `notifications` table alerts them to set up FaciPay links.
3. **Scheduling**: Adding `scheduled_publish_at` to the `products` table and running a periodic background check (using `setInterval` in `stripe-server.ts`) allows products to remain as draft until the scheduled timestamp, when they transition to active status, trigger Stripe sync, and alert admins.
4. **Analytics Fix**: Querying non-existent columns causes PostgREST to return a database error. Correcting the select statement to target `purchase_date`, `amount_paid`, and `amount_paid_aoa` ensures successful data retrieval. Writing a migration for the missing `page_views` table completes the dataset.
5. **Access Denied Fix**: Inserting `'pro_creator'` violates the database column check constraint, causing the JIT collaborator creation/update query in the middleware to fail. Correcting this to `'course_creator'` satisfies the constraint and prevents the authorization middleware from throwing 403 Access Denied.
6. **About Page Fix**: Replacing `text-on-surface-variant` with `text-white/70` and `text-white/50` increases the text contrast, improving readability. Applying `style={{ scrollbarGutter: 'stable' }}` to the main wrapper prevents layout shifts when scrollbars appear.

---

## 3. Caveats
- No database queries or API tests were executed since this was a read-only investigation.
- It is assumed that the `page_views` table should be created in Supabase rather than querying a third-party analytics provider.

---

## 4. Conclusion
The bugs and requirements are fully traced. The implementer should:
1. Simplify `CollaboratorApply.tsx` and update the registration endpoints/helpers in the backend to immediately approve and activate creator profiles and balances.
2. Update the product creation and editing endpoints to auto-approve, allow scheduling (via a new column and cron task), sync with Stripe, and notify admins.
3. Apply the proposed code patches for the analytics queries, JIT plan constraint mismatch, and About page styles.

---

## 5. Verification Method
- **Access Denied**: Try loading the collaborator dashboard/products list. If the JIT check fails, the backend will return a 403 error. Correcting the plan name to `'course_creator'` should result in a successful 200 OK dashboard data response.
- **Analytics**: Query the `/api/collaborators/analytics` endpoint. Without the fix, it will return a PostgREST error about invalid columns or missing tables. With the patch and migration, it will successfully return 200 OK.
- **About Page**: Inspect contrast levels under Chrome DevTools Lighthouse or accessibility tree, ensuring contrast ratios are at least 4.5:1. Verify that switching tabs does not cause horizontal page shifts.
