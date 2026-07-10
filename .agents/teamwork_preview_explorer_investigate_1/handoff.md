# Handoff Report — Explorer Investigation

This handoff report summarizes the observations, logic, conclusions, and recommendations from the read-only codebase exploration.

---

## 1. Observation
* **Creator Apply Page**: `src/pages/CollaboratorApply.tsx` (lines 14–450). It handles status check and POST to `/api/collaborators/apply`. It renders the pending screen (lines 151–173) and rejected screen (lines 175–202).
* **Apply Route**: `backend/api/collaborators/routes.ts` (lines 23–108). POST `/api/collaborators/apply` registers a collaborator with `'pending'` status. It does not update member role.
* **Status Check Route**: `backend/api/collaborators/routes.ts` (lines 111–149). GET `/api/collaborators/status` checks status. It auto-creates/approves if user is already a creator in the `members` table (lines 115–118).
* **Admin Approval Route**: `backend/api/admin/collaborators.ts` (lines 248–300). POST `/api/admin/collaborators/:id/approve` updates status to `'approved'` and inserts a row into `collaborator_balances`.
* **Product Creation / Edit**: `backend/api/collaborators/routes.ts` (lines 1012–1234 & lines 1236–1340). Creates products under `'draft'` status and `'pending_review'` approval status. Resets status on edit.
* **Stripe Product/Price Sync**: `backend/api/stripe/sync-product.ts` (lines 18–123). POST `/api/stripe/sync-product` calls `createStripeProduct` and `createStripePrice` in `backend/stripe-service.ts`.
* **Analytics Error**: `src/pages/CollaboratorDashboard.tsx` (lines 4545–4585) fetches `/api/collaborators/analytics` which is defined in `backend/api/collaborators/routes.ts` (lines 1662–1814).
* **Access Denied Middleware**: `backend/middleware/auth-collaborator.ts` (line 156) returns 403 Forbidden with `"Access denied. Approved collaborator account required."` if `collaborator` is null.
* **About Page**: `src/pages/About.tsx` (lines 1–233) uses `.glass-panel` and `.glass-card` (lines 103, 131, 165, 192), has a padding top of `pt-14` (line 56), and lacks a dark scrollbar stylesheet.

---

## 2. Logic Chain
1. **Access Denied Bug**: The `requireCollaborator` middleware fails when a member is not `'approved'` in `collaborators` AND has no `'criador'` role in `members` table (which would trigger JIT approval). Because the registration flow currently leaves status as `'pending'` and doesn't assign the `'criador'` role, new registrations are blocked from accessing products and dashboard.
2. **Analytics Error Bug**: When the `/analytics` request gets blocked by the 403 error from the middleware, the dashboard catches the network failure and raises the generic UI error: `"Erro ao carregar análise. Tente novamente."`
3. **Contrast Bug on About Page**: The `.glass-panel` class has an opacity of 1–5% in `src/index.css`. Against the background, this makes the lavender-colored text (`text-on-surface-variant` - `#b8b5c8`) very hard to read, particularly on interactive hover states with bright background radial gradients.
4. **Header Clipping Bug on About Page**: The `pt-14` class equates to 56px, while the fixed header navbar is taller, causing the navbar to overlap and clip the title section.

---

## 3. Caveats
* Did not examine direct DB triggers in Supabase dashboard that might be reacting to table updates asynchronously.
* Assumed standard PostgreSQL DB state in Supabase where `collaborator_balances` schema matches the SQL migrations under `backend/supabase/migrations/`.

---

## 4. Conclusion
To solve these requirements:
* Simplify `CollaboratorApply.tsx` to 3 profile fields. Auto-approve signups by setting status to `'approved'` and member role to `'criador'` immediately on submission in the backend endpoint.
* Implement scheduling by adding `scheduled_publish_at` in products schema, updating the publish endpoints, and hooking up a recurring background check inside `stripe-server.ts`.
* Fix UI bugs by changing About page classes to `.overlay-dark` / `.overlay-elevated`, increasing padding top to `pt-20`, and adding custom scrollbar styles globally.

---

## 5. Verification Method
* **Linter & Build**: Run `npm run lint` and `npm run build` in root and `npm run dev` in `backend/` to check for compilation issues.
* **Endpoints**: Mock requests to `/api/collaborators/apply` and verify role/status updates.
* **Visual Check**: Open the `/about` screen and inspect text contrast and scrollbar styling under developer tools.
