# Tasks - Stripe Automation Improvements

## Task 1: Database Schema Updates
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Add `is_free`, `stripe_synced`, `auto_sync_stripe` to products table
- [ ] Add `access_type`, `download_count`, `last_downloaded_at` to purchases table
- [ ] Create `sales_analytics` table
- [ ] Create indexes for performance
- [ ] Update RLS policies

### Files
- `supabase/stripe-automation-schema.sql`

---

## Task 2: Auto Stripe Sync Backend
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Create `/api/products/create` endpoint
- [ ] Implement auto Stripe product creation
- [ ] Implement auto Stripe price creation
- [ ] Save Stripe IDs to database automatically
- [ ] Handle errors gracefully
- [ ] Add logging

### Files
- `backend/api/products/create.ts`
- `backend/api/products/sync-stripe.ts`

---

## Task 3: Remove Manual Stripe ID Inputs
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Remove `stripe_product_id` input from ProductForm
- [ ] Remove `stripe_price_id` input from ProductForm
- [ ] Add `is_free` checkbox to ProductForm
- [ ] Update form validation
- [ ] Update submit handler to call new API

### Files
- `admin/src/components/products/ProductForm.tsx`
- `admin/src/lib/products.ts`

---

## Task 4: Purchase Detection System
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Create `/api/purchases/check/:productId` endpoint
- [ ] Add purchase check to Product page
- [ ] Create `usePurchaseStatus` hook
- [ ] Update CheckoutButton with conditional rendering
- [ ] Add "Já adquirido" state
- [ ] Add "Ver na biblioteca" button

### Files
- `backend/api/purchases/check.ts`
- `src/hooks/usePurchaseStatus.ts`
- `src/components/CheckoutButton.tsx`
- `src/pages/Product.tsx`

---

## Task 5: Free Products System
**Priority**: MEDIUM
**Status**: pending

### Subtasks
- [ ] Create `/api/products/claim-free` endpoint
- [ ] Add free product claim logic
- [ ] Create purchase record for free products
- [ ] Create digital delivery for free products
- [ ] Update CheckoutButton for free products
- [ ] Add "Baixar Gratuitamente" button

### Files
- `backend/api/products/claim-free.ts`
- `src/components/FreeProductButton.tsx`
- `src/pages/Product.tsx`

---

## Task 6: Admin Analytics Dashboard
**Priority**: MEDIUM
**Status**: pending

### Subtasks
- [ ] Create `/api/analytics/dashboard` endpoint
- [ ] Create `/api/analytics/revenue` endpoint
- [ ] Create StatsCard component
- [ ] Create RevenueChart component
- [ ] Create RecentSales component
- [ ] Update Dashboard page with analytics
- [ ] Add realtime updates

### Files
- `backend/api/analytics/dashboard.ts`
- `backend/api/analytics/revenue.ts`
- `admin/src/components/analytics/StatsCard.tsx`
- `admin/src/components/analytics/RevenueChart.tsx`
- `admin/src/components/analytics/RecentSales.tsx`
- `admin/src/pages/Dashboard.tsx`

---

## Task 7: Purchase History Page
**Priority**: MEDIUM
**Status**: pending

### Subtasks
- [ ] Create `/api/purchases/list` endpoint
- [ ] Create Sales page in admin
- [ ] Create PurchaseTable component
- [ ] Add filters (date, status, product)
- [ ] Add export functionality
- [ ] Add pagination

### Files
- `backend/api/purchases/list.ts`
- `admin/src/pages/Sales.tsx`
- `admin/src/components/sales/PurchaseTable.tsx`

---

## Task 8: Library System
**Priority**: LOW
**Status**: pending

### Subtasks
- [ ] Create `/api/library` endpoint
- [ ] Create Library page
- [ ] Create LibraryGrid component
- [ ] Add filters (all, paid, free, favorites)
- [ ] Add search functionality
- [ ] Update navigation to include Library

### Files
- `backend/api/library/index.ts`
- `src/pages/Library.tsx`
- `src/components/member/LibraryGrid.tsx`
- `src/components/NavBar.tsx`

---

## Task 9: UI States & Button Logic
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Create button state enum
- [ ] Implement "Comprar Agora" state
- [ ] Implement "Processando..." state
- [ ] Implement "Já adquirido" state
- [ ] Implement "Baixar Gratuitamente" state
- [ ] Add loading states
- [ ] Add error states

### Files
- `src/components/CheckoutButton.tsx`
- `src/types/purchase.ts`

---

## Task 10: Testing & Bug Fixes
**Priority**: HIGH
**Status**: pending

### Subtasks
- [ ] Test auto Stripe sync
- [ ] Test free product claim
- [ ] Test purchase detection
- [ ] Test analytics accuracy
- [ ] Test library functionality
- [ ] Fix NavBar realtime error
- [ ] Fix THREE.Clock deprecation warning
- [ ] Test all user flows

### Files
- Various

---

## Implementation Order

### Phase 1: Core Infrastructure (HIGH Priority)
1. Task 1: Database Schema Updates
2. Task 2: Auto Stripe Sync Backend
3. Task 3: Remove Manual Stripe ID Inputs

### Phase 2: Purchase Logic (HIGH Priority)
4. Task 4: Purchase Detection System
5. Task 9: UI States & Button Logic
6. Task 5: Free Products System

### Phase 3: Analytics & Admin (MEDIUM Priority)
7. Task 6: Admin Analytics Dashboard
8. Task 7: Purchase History Page

### Phase 4: User Features (LOW Priority)
9. Task 8: Library System

### Phase 5: Polish (HIGH Priority)
10. Task 10: Testing & Bug Fixes

---

## Estimated Time
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 1-2 hours

**Total**: 8-13 hours

---

## Dependencies

```
Task 1 (Schema)
    ↓
Task 2 (Auto Sync) ──→ Task 3 (Remove Inputs)
    ↓
Task 4 (Purchase Detection) ──→ Task 9 (UI States)
    ↓
Task 5 (Free Products)
    ↓
Task 6 (Analytics) ──→ Task 7 (Purchase History)
    ↓
Task 8 (Library)
    ↓
Task 10 (Testing)
```
