# Project: Simplified Creator Flow, Auto-Publishing, and UI/UX Bug Fixes

## Architecture
- **Storefront / Member Area**: React + Vite + TypeScript web app. Handles collaborator application page, creator dashboard, and About page.
- **Creator Dashboard**: Sub-section of storefront where creators manage products and view sales analytics.
- **Backend API (Express)**: Handles requests to `/api/collaborators/*`, `/api/stripe/*`, and auth middlewares.
- **Database (Supabase)**: Houses the `collaborators`, `members`, `collaborator_balances`, `products`, and `purchases` tables.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Codebase investigation to map endpoints, schemas, and UI elements. | None | DONE |
| 2 | Simplified Creator Registration Flow | Simplify `CollaboratorApply.tsx` to 3 fields; modify `POST /api/collaborators/apply` to auto-approve, set user role to `'criador'`, and initialize `collaborator_balances`. | M1 | DONE |
| 3 | Auto-Publishing and Scheduling | Support direct product approval, scheduled publishing at `scheduled_publish_at` (including a cron job in `backend/stripe-server.ts`), Stripe price/product sync, and admin notifications. | M1 | DONE |
| 4 | UI/UX Bug Fixes | Fix column mismatches in traffic analytics query, enhance `requireCollaborator` JIT fallback, and improve About page contrast/scrollbar styling. | M1 | DONE |
| 5 | E2E Testing & Verification | Run lint checks, typecheck, build validation, and execute E2E tests for registration, publishing, and scheduling. Audit with Forensic Auditor. | M2, M3, M4 | DONE |

## Interface Contracts

### 1. Creator Application Submission
- **Endpoint**: `POST /api/collaborators/apply`
- **Request Body**:
  ```json
  {
    "displayName": "string",
    "specialty": "string",
    "bio": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "status": "approved",
    "collaborator": { ... }
  }
  ```

### 2. Product Creation with Scheduling
- **Endpoint**: `POST /api/collaborators/products`
- **Request Body additions**:
  ```json
  {
    ...,
    "scheduled_publish_at": "ISO-8601-string | null"
  }
  ```

### 3. Product Status & Approval Rules
- **Creation**:
  - `scheduled_publish_at` is in the future: `status = 'draft'`, `approval_status = 'approved'`.
  - `scheduled_publish_at` is null or past: `status = 'active'`, `approval_status = 'approved'`, triggers Stripe sync and notifications.
- **Editing**:
  - Preserve `approval_status = 'approved'` and current `status`. Do not reset to `'draft'` or `'pending_review'`.

## Code Layout
- Frontend registration: `src/pages/CollaboratorApply.tsx`
- Frontend About page: `src/pages/About.tsx`
- Frontend global styles: `src/index.css`
- Backend collaborator routes: `backend/api/collaborators/routes.ts`
- Backend collaborator auth: `backend/middleware/auth-collaborator.ts`
- Backend scheduling runner: `backend/stripe-server.ts`
