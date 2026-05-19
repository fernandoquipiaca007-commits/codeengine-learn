# Implementation Plan: FastPay Payment Method Integration

## Overview

This implementation plan breaks down the FastPay payment method integration into discrete, incremental coding tasks. The approach follows a layered architecture: database schema → backend API → frontend components → admin panel → notifications. Each task builds on previous work, with checkpoints to validate functionality before proceeding.

The implementation uses TypeScript throughout (React + TypeScript for frontend, Node.js + Express + TypeScript for backend) and integrates with existing Supabase infrastructure.

## Tasks

- [ ] 1. Set up database schema and storage infrastructure
  - [ ] 1.1 Create fastpay_orders table with RLS policies
    - Create the `fastpay_orders` table in Supabase with all columns (id, member_id, product_id, amount, status, proof_url, proof_uploaded_at, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at, updated_at)
    - Add CHECK constraints for status values and amount validation
    - Add UNIQUE constraint for preventing duplicate pending orders
    - Create all indexes (member_id, product_id, status, created_at, pending orders)
    - Implement all RLS policies (members view own, members create own, members update own pending, admins view all, admins update all)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ]* 1.2 Write property test for duplicate order prevention
    - **Property 15: Duplicate Order Prevention**
    - **Validates: Requirements 12.4**
    - Test that the system prevents creation of a second pending order for the same member/product combination
    - _Requirements: 12.4_
  
  - [ ] 1.3 Add fastpay_link column to products table
    - Add `fastpay_link TEXT` column to existing products table
    - Add CHECK constraint to validate URL format (must start with http:// or https://)
    - Create index for products with FastPay enabled
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 1.4 Write property test for URL validation
    - **Property 1: URL Validation**
    - **Validates: Requirements 2.3**
    - Test that validation correctly identifies valid URLs and rejects invalid formats
    - _Requirements: 2.3_
  
  - [ ] 1.5 Create Supabase Storage bucket for payment proofs
    - Create `fastpay-proofs` bucket in Supabase Storage
    - Configure bucket settings (public: false, fileSizeLimit: 10MB, allowedMimeTypes: image/jpeg, image/png, application/pdf)
    - Implement RLS policies for storage (members upload own, members view own, admins view all)
    - _Requirements: 3.6, 12.1, 12.2, 12.3_

- [ ] 2. Checkpoint - Verify database setup
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement backend TypeScript interfaces and types
  - [ ] 3.1 Create FastPay TypeScript interfaces
    - Create `backend/src/types/fastpay.ts` with all interfaces: FastPayOrder, FastPayOrderCreateRequest, FastPayOrderCreateResponse, ProofUploadRequest, ProofUploadResponse, OrderApprovalRequest, OrderRejectionRequest, FastPayStats
    - Add type definitions for order status enum
    - _Requirements: 3.1, 5.1, 6.1, 6.2, 6.3_

- [ ] 4. Implement backend API endpoints for order management
  - [ ] 4.1 Create FastPay order creation endpoint
    - Implement `POST /api/fastpay/create-order` endpoint in backend
    - Validate required fields (product_id, member_id)
    - Check if product exists and has fastpay_link configured
    - Enforce rate limiting (max 5 pending orders per member)
    - Check for duplicate pending orders
    - Create order with status "pending" and original product price (no discounts)
    - Return order_id, fastpay_link, and amount
    - _Requirements: 3.1, 4.1, 4.5, 12.4, 12.7_
  
  - [ ]* 4.2 Write property test for order creation with pending status
    - **Property 2: Order Creation with Pending Status**
    - **Validates: Requirements 3.1, 6.1**
    - Test that any valid member/product combination creates an order with "pending" status
    - _Requirements: 3.1, 6.1_
  
  - [ ]* 4.3 Write property test for discount exclusion
    - **Property 5: Discount Exclusion for FastPay**
    - **Validates: Requirements 4.1, 4.5**
    - Test that FastPay orders always use original product price without discounts
    - _Requirements: 4.1, 4.5_
  
  - [ ]* 4.4 Write property test for rate limiting enforcement
    - **Property 16: Rate Limiting Enforcement**
    - **Validates: Requirements 12.7**
    - Test that members cannot create more than 5 pending orders
    - _Requirements: 12.7_
  
  - [ ] 4.5 Create proof upload endpoint with file validation
    - Implement `POST /api/fastpay/upload-proof` endpoint with multipart/form-data support
    - Validate file format (JPG, PNG, PDF only) and MIME type
    - Validate file size (max 10MB)
    - Check that order exists and belongs to authenticated member
    - Prevent duplicate proof uploads
    - Upload file to Supabase Storage at path `{member_id}/{order_id}_proof.{ext}`
    - Update order with proof_url and proof_uploaded_at timestamp
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 12.1, 12.3_
  
  - [ ]* 4.6 Write property test for file format and size validation
    - **Property 3: File Format and Size Validation**
    - **Validates: Requirements 3.5, 12.1, 12.3**
    - Test that system accepts valid files (JPG, PNG, PDF under 10MB) and rejects invalid files
    - _Requirements: 3.5, 12.1, 12.3_
  
  - [ ]* 4.7 Write property test for proof upload timestamp
    - **Property 4: Proof Upload Timestamp**
    - **Validates: Requirements 3.7**
    - Test that proof_uploaded_at timestamp is recorded when proof is uploaded
    - _Requirements: 3.7_
  
  - [ ] 4.8 Create member orders query endpoint
    - Implement `GET /api/fastpay/orders` endpoint with query parameters (member_id, status)
    - Validate that authenticated member can only query their own orders
    - Join with products and members tables for complete order details
    - Support status filtering (pending, completed, failed, all)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 4.9 Create order details endpoint
    - Implement `GET /api/fastpay/orders/:orderId` endpoint
    - Validate that authenticated member owns the order
    - Return complete order details with joined member and product data
    - _Requirements: 10.2, 10.7_

- [ ] 5. Checkpoint - Verify member-facing API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement admin backend API endpoints
  - [ ] 6.1 Create admin orders list endpoint with filtering and search
    - Implement `GET /api/admin/fastpay/orders` endpoint with admin authentication
    - Support status filtering (pending, completed, failed, all)
    - Support search by member name or product name
    - Calculate and return statistics (pending, completed, failed, total counts)
    - Join with members and products tables for complete data
    - _Requirements: 5.1, 5.2, 5.9, 5.10, 5.11_
  
  - [ ]* 6.2 Write property test for order filtering by status
    - **Property 13: Order Filtering by Status**
    - **Validates: Requirements 5.10**
    - Test that filtered results contain only orders matching the selected status
    - _Requirements: 5.10_
  
  - [ ]* 6.3 Write property test for order search by name
    - **Property 14: Order Search by Name**
    - **Validates: Requirements 5.11**
    - Test that search results contain only orders where member/product name contains query
    - _Requirements: 5.11_
  
  - [ ] 6.4 Create order approval endpoint
    - Implement `POST /api/admin/fastpay/approve/:orderId` endpoint with admin authentication
    - Validate that order exists and is in "pending" status
    - Prevent duplicate approval of already-processed orders
    - Update order status to "completed"
    - Record approved_by (admin_id) and approved_at timestamp
    - Create purchase record in purchases table with transaction_id format `fastpay_{order.id}`
    - Grant member access to product
    - _Requirements: 5.4, 5.6, 6.2, 6.4, 6.5, 6.7, 6.8, 7.1, 7.2, 7.3_
  
  - [ ]* 6.5 Write property test for order approval status transition
    - **Property 6: Order Approval Status Transition**
    - **Validates: Requirements 5.6, 6.2**
    - Test that pending orders transition to "completed" when approved
    - _Requirements: 5.6, 6.2_
  
  - [ ]* 6.6 Write property test for purchase record creation
    - **Property 10: Purchase Record Creation on Approval**
    - **Validates: Requirements 6.5, 7.1**
    - Test that completed orders create corresponding purchase records
    - _Requirements: 6.5, 7.1_
  
  - [ ]* 6.7 Write property test for product access granting
    - **Property 9: Product Access Granting on Approval**
    - **Validates: Requirements 6.4, 7.2**
    - Test that members have access to products after order approval
    - _Requirements: 6.4, 7.2_
  
  - [ ]* 6.8 Write property test for audit trail completeness
    - **Property 8: Audit Trail Completeness**
    - **Validates: Requirements 6.7, 6.8, 12.6**
    - Test that order status changes record admin ID and timestamp
    - _Requirements: 6.7, 6.8, 12.6_
  
  - [ ] 6.9 Create order rejection endpoint
    - Implement `POST /api/admin/fastpay/reject/:orderId` endpoint with admin authentication
    - Validate that order exists and is in "pending" status
    - Require rejection_reason in request body
    - Prevent duplicate rejection of already-processed orders
    - Update order status to "failed"
    - Record rejected_by (admin_id), rejected_at timestamp, and rejection_reason
    - Ensure member does NOT get product access
    - _Requirements: 5.5, 5.7, 5.8, 6.3, 6.6, 6.7, 6.8_
  
  - [ ]* 6.10 Write property test for order rejection status transition
    - **Property 7: Order Rejection Status Transition**
    - **Validates: Requirements 5.7, 6.3**
    - Test that pending orders transition to "failed" when rejected
    - _Requirements: 5.7, 6.3_
  
  - [ ]* 6.11 Write property test for no access on failed orders
    - **Property 11: No Access on Failed Orders**
    - **Validates: Requirements 6.6**
    - Test that members do NOT have access to products for failed orders
    - _Requirements: 6.6_
  
  - [ ] 6.12 Create admin statistics endpoint
    - Implement `GET /api/admin/fastpay/stats` endpoint with admin authentication
    - Calculate total_orders, pending_orders, completed_orders, failed_orders
    - Calculate total_revenue from completed orders
    - Calculate average_approval_time_hours from approved orders
    - _Requirements: 13.4, 13.5_
  
  - [ ] 6.13 Create product FastPay link update endpoint
    - Implement `PUT /api/admin/products/:productId/fastpay-link` endpoint with admin authentication
    - Validate URL format if fastpay_link is provided
    - Allow setting fastpay_link to null to disable FastPay for product
    - Update products table
    - _Requirements: 2.2, 2.3, 2.6_

- [ ] 7. Checkpoint - Verify admin API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement notification system integration
  - [ ] 8.1 Create notification helper functions for FastPay events
    - Create `backend/src/lib/fastpay-notifications.ts` with functions for each notification type
    - Implement `sendProofReceivedNotification(order)` for in-app and email
    - Implement `sendOrderApprovedNotification(order)` for in-app and email with download instructions
    - Implement `sendOrderRejectedNotification(order)` for in-app and email with rejection reason
    - Integrate with existing email-service.js
    - Store notifications in notifications table
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ] 8.2 Integrate notifications into order workflow
    - Call `sendProofReceivedNotification` after successful proof upload
    - Call `sendOrderApprovedNotification` after order approval
    - Call `sendOrderRejectedNotification` after order rejection
    - _Requirements: 3.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 8.3 Write property test for notification read status update
    - **Property 12: Notification Read Status Update**
    - **Validates: Requirements 8.8**
    - Test that notifications update read_status to true when viewed
    - _Requirements: 8.8_

- [ ] 9. Implement frontend payment method selector component
  - [ ] 9.1 Create PaymentMethodSelector component
    - Create `src/components/payment/PaymentMethodSelector.tsx` React component
    - Accept props: product, onSelectStripe, onSelectFastPay, onClose
    - Check if product.fastpay_link is configured
    - Display modal with Stripe and FastPay options (or Stripe only if no FastPay link)
    - Show "Stripe (Internacional)" and "FastPay (Angola)" with appropriate branding
    - Display notice that discounts only apply to Stripe
    - Make responsive for mobile and desktop
    - Add i18n support for Portuguese and English
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.5, 4.2, 9.1_
  
  - [ ] 9.2 Integrate PaymentMethodSelector into product purchase flow
    - Modify existing "Comprar Agora" button to open PaymentMethodSelector modal
    - Wire onSelectStripe to existing Stripe checkout flow
    - Wire onSelectFastPay to new FastPayFlow component
    - _Requirements: 1.1, 1.4, 1.5, 14.1_

- [ ] 10. Implement frontend FastPay flow components
  - [ ] 10.1 Create FastPayFlow component with multi-step wizard
    - Create `src/components/payment/FastPayFlow.tsx` React component
    - Implement state management for steps: instructions, redirecting, upload, waiting
    - Create "instructions" step explaining FastPay process with clear descriptions
    - Create "redirecting" step that opens FastPay link in new tab
    - Create "upload" step with ProofUploader component
    - Create "waiting" step showing "Aguardando aprovação" with 24-hour estimate
    - Call `/api/fastpay/create-order` endpoint to create order
    - Handle errors gracefully with clear messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9, 9.2, 9.3, 9.4, 9.5, 9.6, 15.2, 15.3, 15.7_
  
  - [ ] 10.2 Create ProofUploader component with file validation
    - Create `src/components/payment/ProofUploader.tsx` React component
    - Implement file input with drag-and-drop support
    - Validate file format (JPG, PNG, PDF) and size (max 10MB) on client side
    - Show image preview for JPG/PNG files
    - Display upload progress bar
    - Call `/api/fastpay/upload-proof` endpoint
    - Handle upload errors with retry option
    - Show success message after upload
    - _Requirements: 3.4, 3.5, 15.2_
  
  - [ ] 10.3 Create OrderStatusTracker component for member dashboard
    - Create `src/components/member/OrderStatusTracker.tsx` React component
    - Fetch orders from `/api/fastpay/orders` endpoint
    - Display list of orders with product name, amount, upload date, status
    - Show status badges (Pendente, Concluído, Rejeitado) with appropriate colors
    - Display "Aguardando aprovação" for pending orders with estimated time
    - Display "Aprovado" with download link for completed orders
    - Display "Rejeitado" with rejection reason for failed orders
    - Allow viewing uploaded proof
    - Support filtering by status (all, pending, completed, failed)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 10.4 Integrate OrderStatusTracker into member dashboard
    - Add "Pedidos FastPay" section to member dashboard page
    - Display OrderStatusTracker component
    - Ensure it appears alongside existing Stripe purchases
    - _Requirements: 7.5, 10.1_

- [ ] 11. Checkpoint - Verify member-facing frontend
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement admin panel components
  - [ ] 12.1 Create AdminApprovalPanel component with order list
    - Create `admin/src/components/fastpay/AdminApprovalPanel.tsx` React component
    - Fetch orders from `/api/admin/fastpay/orders` endpoint
    - Display table with columns: member name, product name, amount, upload date, status
    - Implement status filter dropdown (pending, completed, failed, all)
    - Implement search input for member/product name
    - Display statistics cards (total pending, approved, rejected)
    - Show order count and total revenue
    - Make responsive for desktop and tablet
    - _Requirements: 5.1, 5.2, 5.9, 5.10, 5.11, 13.4_
  
  - [ ] 12.2 Create order detail modal with proof viewer
    - Create order detail modal component within AdminApprovalPanel
    - Display full order details (member info, product info, amount, timestamps)
    - Show uploaded payment proof with image viewer or PDF viewer
    - Display "Aprovar" and "Rejeitar" action buttons
    - Show order history with all status transitions and timestamps
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.9_
  
  - [ ] 12.3 Implement order approval and rejection actions
    - Wire "Aprovar" button to call `/api/admin/fastpay/approve/:orderId` endpoint
    - Wire "Rejeitar" button to show rejection reason input modal
    - Implement rejection reason modal with text area
    - Call `/api/admin/fastpay/reject/:orderId` endpoint with rejection reason
    - Show success/error toasts after actions
    - Refresh order list after approval/rejection
    - Prevent duplicate actions on already-processed orders
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 15.4_
  
  - [ ] 12.4 Create admin statistics dashboard
    - Create statistics section in AdminApprovalPanel
    - Display total orders, pending, completed, failed counts
    - Display total revenue from FastPay orders
    - Display average approval time
    - Fetch data from `/api/admin/fastpay/stats` endpoint
    - _Requirements: 13.4, 13.5_
  
  - [ ] 12.5 Add FastPay link configuration to product form
    - Modify `admin/src/components/products/ProductForm.tsx`
    - Add "Link de Pagamento FastPay" text input field
    - Validate URL format on client side
    - Allow clearing the field to disable FastPay
    - Save to backend via `/api/admin/products/:productId/fastpay-link` endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [ ] 12.6 Integrate AdminApprovalPanel into admin navigation
    - Add "FastPay Orders" menu item to admin sidebar
    - Create new admin page route for FastPay management
    - Ensure proper admin authentication
    - _Requirements: 5.1_

- [ ] 13. Checkpoint - Verify admin panel functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement global configuration and settings
  - [ ] 14.1 Create admin settings page for FastPay configuration
    - Create admin settings page with FastPay section
    - Add global enable/disable toggle for FastPay site-wide
    - Add configuration for max pending orders per member (default: 5)
    - Add configuration for auto-rejection after X days (default: 7)
    - Store settings in database or environment variables
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ] 14.2 Implement global FastPay disable logic
    - Check global FastPay enabled setting in PaymentMethodSelector
    - Hide FastPay option when globally disabled
    - Return error from order creation endpoint when disabled
    - _Requirements: 13.1, 13.6_

- [ ] 15. Implement error handling and edge cases
  - [ ] 15.1 Add comprehensive error handling to all endpoints
    - Implement error handlers for validation errors (400)
    - Implement error handlers for authentication errors (401)
    - Implement error handlers for authorization errors (403)
    - Implement error handlers for not found errors (404)
    - Implement error handlers for conflict errors (409)
    - Implement error handlers for storage errors (500)
    - Implement error handlers for database errors (500)
    - Return consistent error response format with success, error, code fields
    - Log all errors to monitoring system
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 15.6_
  
  - [ ] 15.2 Add frontend error handling and retry logic
    - Display clear error messages to users for all error scenarios
    - Implement retry logic for transient failures (storage, network)
    - Handle case when FastPay link is not configured
    - Handle case when Supabase storage is unavailable
    - Provide manual link to FastPay when redirect fails
    - _Requirements: 15.1, 15.2, 15.3, 15.7_
  
  - [ ]* 15.3 Write integration tests for error scenarios
    - Test duplicate order prevention
    - Test rate limiting enforcement
    - Test invalid file upload handling
    - Test duplicate approval prevention
    - Test non-existent order handling
    - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [ ] 16. Final integration and testing
  - [ ] 16.1 Test complete user flow end-to-end
    - Test payment method selection
    - Test FastPay order creation
    - Test proof upload
    - Test order status tracking
    - Test notifications
    - Verify Stripe flow remains unchanged
    - _Requirements: 1.1, 3.1, 3.4, 10.1, 8.1, 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 16.2 Test complete admin flow end-to-end
    - Test order list viewing and filtering
    - Test order approval
    - Test order rejection
    - Test product access granting
    - Test purchase record creation
    - Test statistics display
    - _Requirements: 5.1, 5.4, 5.5, 6.4, 6.5, 7.1, 7.2, 13.4_
  
  - [ ] 16.3 Verify backward compatibility with Stripe
    - Ensure Stripe checkout flow works unchanged
    - Ensure Stripe purchases appear in member library
    - Ensure discounts apply to Stripe purchases
    - Ensure Stripe webhooks continue to work
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 17. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

### Implementation Strategy

- **Incremental Development**: Each task builds on previous work, allowing for early validation of core functionality
- **Database First**: Start with schema and storage to establish data foundation
- **API Before UI**: Implement backend endpoints before frontend components to enable independent testing
- **Member Flow First**: Complete member-facing features before admin panel
- **Testing Throughout**: Property-based tests are integrated at relevant points to catch errors early

### Testing Approach

- Tasks marked with `*` are optional property-based tests that validate correctness properties
- Property tests use the fast-check library for TypeScript
- Unit tests should be written for individual functions and components
- Integration tests verify end-to-end flows
- All tests should be runnable with `npm test`

### Key Technical Decisions

- **TypeScript Throughout**: Ensures type safety across frontend and backend
- **Supabase RLS**: Leverages Row Level Security for data access control
- **No Stripe Modifications**: Existing Stripe code remains completely untouched
- **Discount Exclusion**: FastPay orders always use original product price
- **Manual Approval**: No automatic approval; all orders require admin review
- **Audit Trail**: All status changes record admin ID and timestamp

### Dependencies

- Existing Supabase setup (database, storage, authentication)
- Existing email-service.js for notifications
- Existing products and members tables
- Existing purchases table for access granting
- React, TypeScript, Tailwind CSS, i18next (frontend)
- Node.js, Express, TypeScript (backend)

### Deployment Considerations

- Database migrations should be run before deploying backend code
- Storage bucket must be created before proof uploads
- Environment variables for FastPay configuration
- Admin authentication must be properly configured
- Email service must be configured for notifications

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.4", "3.1"] },
    { "id": 2, "tasks": ["4.1", "4.5"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.6", "4.7", "4.8", "4.9"] },
    { "id": 4, "tasks": ["6.1", "6.4", "6.9", "6.12", "6.13"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.5", "6.6", "6.7", "6.8", "6.10", "6.11"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2", "10.1", "10.2"] },
    { "id": 10, "tasks": ["10.3"] },
    { "id": 11, "tasks": ["10.4"] },
    { "id": 12, "tasks": ["12.1", "12.5"] },
    { "id": 13, "tasks": ["12.2"] },
    { "id": 14, "tasks": ["12.3", "12.4"] },
    { "id": 15, "tasks": ["12.6", "14.1"] },
    { "id": 16, "tasks": ["14.2", "15.1"] },
    { "id": 17, "tasks": ["15.2", "15.3"] },
    { "id": 18, "tasks": ["16.1", "16.2", "16.3"] }
  ]
}
```
