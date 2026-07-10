## 2026-07-10T18:31:26Z
Your working directory is: c:\Users\Dell\Documents\codeengine1.2\.agents\teamwork_preview_worker_implementation.
Your identity: teamwork_preview_worker.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are tasked with implementing the following requirements in the CodeEngine workspace at c:\Users\Dell\Documents\codeengine1.2:

### R1. Simplified Creator Registration Flow ("Conte mais sobre você")
- In `src/pages/CollaboratorApply.tsx`:
  - Rename page title / subtitle to "Conte mais sobre você" and update text context to be a simplified profile registration.
  - Keep only the 3 Perfil Profissional fields: display_name, specialty, bio.
  - Completely remove Section 2 (Preferências de Repasse Financeiro: PayPal/IBAN) and Section 3 (Estimativa de Armazenamento / Survey).
  - Remove code blocks rendering conditional screens for "candidacyStatus === 'pending'" and "candidacyStatus === 'rejected'" so that the user doesn't see pending/rejected screens and can be immediately redirected.
  - Upon successful form submission, trigger state changes to set candidacyStatus to 'approved', update role to 'criador' locally if applicable, and redirect immediately to the Creator Dashboard (`/colaborador` dashboard screen).
- In `backend/api/collaborators/routes.ts` (POST `/api/collaborators/apply`):
  - Save the collaborator record with status: 'approved' immediately.
  - Update the member's profile_data role to 'criador' in the `members` table.
  - Automatically initialize the collaborator's balance record in the `collaborator_balances` table with default 0 balances.
  - Return { success: true, status: 'approved', collaborator } immediately.

### R2. Auto-Publishing and Scheduled Publishing of Products
- Schema Change: Check if the database has a column `scheduled_publish_at` (TIMESTAMPTZ) in the `products` table. If not, add/create a migration file and/or run SQL to add it.
- In `backend/api/collaborators/routes.ts` (POST `/api/collaborators/products`):
  - Read `scheduled_publish_at` from `req.body`.
  - Always set `approval_status: 'approved'`.
  - If `scheduled_publish_at` is provided and in the future (e.g., > current time):
    - Set `status: 'draft'` and save `scheduled_publish_at` as ISO string.
  - If `scheduled_publish_at` is null or in the past:
    - Set `status: 'active'`, `scheduled_publish_at: null`.
    - Trigger Stripe Product + Price creation JIT (see `POST /api/stripe/sync-product` or call `createStripeProduct` / `createStripePrice` in `backend/stripe-service.ts` directly for USD products).
    - Send email notifications to admin (`fernandoquipiaca007@gmail.com`) using `sendViaResend` and add a system notification row in the database `notifications` table for the admin user.
- In `backend/api/collaborators/routes.ts` (PUT `/api/collaborators/products/:id`):
  - Prevent resetting status to draft or pending review on product editing. Preserve the active/approved status unless scheduling is modified.
- In `backend/stripe-server.ts`:
  - Implement a periodic background runner (e.g. setInterval running every 60 seconds) that queries products where `status = 'draft'` and `approval_status = 'approved'` and `scheduled_publish_at <= NOW()`.
  - For each product found: update status to `'active'`, trigger Stripe Product + Price sync if currency is USD, and notify the admin via Resend email + in-app notification.

### R3. UI/UX Bug Fixes
- Analytics bug: In `backend/api/collaborators/routes.ts` (endpoint `GET /api/collaborators/analytics`), fix the query querying non-existent columns in `purchases` (`created_at`, `amount`, `currency`). Update the query to select `purchase_date`, `amount_paid` (USD), and `amount_paid_aoa` (AOA) instead. Fix the aggregation loop to calculate metrics correctly using these columns.
- Access denied bug: In `backend/middleware/auth-collaborator.ts` (middleware `requireCollaborator`), ensure that any user accessing collaborator routes who is registered as a collaborator but has status !== 'approved' is auto-approved JIT if they have role 'criador', or if they don't have role 'criador', check if they should be auto-approved to avoid access denied loop.
- About page contrast: In `src/pages/About.tsx`, replace the low-contrast `.glass-panel` and `.glass-card` classes with `.overlay-dark` or `.overlay-elevated` from the adaptive overlay system, and update text colors from `text-on-surface-variant` to `text-white/70` and `text-white/50`. Add `pt-20` or similar padding top to prevent header clipping.
- Scrollbar: Add global custom dark scrollbar styles (e.g. for `::-webkit-scrollbar`) in `src/index.css` to match the premium dark theme.

### Verification and Checks:
- Run backend typechecks: `cd backend && npx tsc --noEmit`
- Run frontend build targets to verify typescript compilation:
  - Root: `npm run build`
  - Admin: `cd admin && npm run build` (if applicable)
- Verify that linting passes and no runtime errors are present.
- Provide step-by-step commands and compilation outputs in your handoff report.

Write your final completion report to `c:\Users\Dell\Documents\codeengine1.2\.agents\teamwork_preview_worker_implementation\handoff.md`.
