# CodeEngine Storage Integration Analysis Report

## Executive Summary
This report analyzes the CodeEngine codebase to establish a plan for integrating a **Hybrid Storage model** (Cloudflare R2 for high-volume files and large digital downloads + Supabase Storage for restricted access files like receipts and avatars) and **Cloudflare Stream** for secure, high-performance course video streaming.

---

## 1. Backend Storage & Upload Architecture
The backend is an Express application hosted in the `backend/` directory, bootstrapped from `backend/stripe-server.ts`. 

### Mapped Backend Files & Logic Locations
*   **Server Entrypoint:** `backend/stripe-server.ts` registers routes, sets up Helmet/CORS/rate limiting, and starts the server.
*   **Supabase Admin Client:** `backend/lib/supabase.ts` instantiates `supabaseAdmin` using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It also provides utility functions like `getStoragePath` (normalizes URLs to relative paths) and `mimeFromFilename`.
*   **Media Streaming & Downloading:** `backend/api/lessons/stream.ts` manages stream access and download requests for course lessons.
*   **Digital Product Downloads:** `backend/api/downloads/get-download.ts` handles download validation and streaming for paid files.
*   **Ebook Viewing:** `backend/api/ebooks/read.ts` handles viewing credentials for private ebooks.
*   **FastPay Payment Proofs Upload:** `backend/api/fastpay/upload-proof.ts` contains the logic for uploading manual payment proofs via Multer.
*   **Local File Upload Tool:** `backend/stripe-server.ts` exposes `/api/admin/upload-local-file` which allows administrators to upload a file from a local filesystem path or remote URL to a specified Supabase bucket.

---

## 2. Current Implementation Details

### A. Digital Downloads (`ebooks-private` Bucket)
*   **Buckets & Access:** Files are stored in the private `ebooks-private` bucket (Public access: `false`, Max size: `500MB` in docs, but validated up to `2GB` in admin frontend).
*   **Database Columns:** Stored in `products.file_storage_path` (primary) or `products.storage_url` (legacy fallback). Language translations are stored in `products_translations.storage_url`.
*   **Download Endpoint (`GET /api/downloads/:productId`):**
    1.  Validates JWT token using `getUserFromToken` and fetches the member record from the `members` table.
    2.  Verifies access via:
        *   An active grant in `member_grants` table.
        *   A completed/free purchase in `purchases` table (handles `access_duration_days` expiration if defined).
    3.  Resolves file path (checks translation first, then base products table).
    4.  Logs the download in the `downloads` table.
    5.  Generates a signed URL from Supabase Storage:
        ```typescript
        const { data: signed } = await supabaseAdmin.storage
          .from('ebooks-private')
          .createSignedUrl(storagePath, 3600);
        ```
    6.  Fetches the signed URL on the backend and streams the file buffer back to the client as an attachment (e.g. `Content-Disposition: attachment; filename="..."`).
*   **Ebook Reader Endpoint (`GET /api/ebooks/:productId/read`):**
    1.  Checks authorization and product access via `memberHasProductAccess`.
    2.  Resolves file path.
    3.  Generates a signed URL (valid for 1 hour) using the `ebooks-private` bucket.
    4.  Returns JSON: `{ success: true, url: signed.signedUrl, expiresIn: 3600, format: ext, mimeType: ... }`.

### B. Public Assets (Covers, Previews, Presentational Videos)
*   **Buckets & Access:** Public buckets allow anonymous reads (`SELECT` RLS policy active).
    *   `product-covers` (Public, 5MB limit): Cover images (JPG, PNG, WebP).
    *   `product-previews` (Public, 10MB limit): Sample files (JPG, PNG, PDF).
    *   `product-videos` (Public, 100MB limit): Presentational videos (MP4, WebM, OGG).
*   **Database Columns:** Stored in `cover_storage_path`/`cover_url`, `preview_storage_path`/`preview_url`, and `video_storage_path`/`video_url` in the `products` table.
*   **Frontend Display:** Resolved using the helper function `getProductCoverUrl` (in `src/lib/storage-path.ts`). If a path is relative, it dynamically appends the Supabase public storage endpoint:
    `const url = `${supabaseUrl}/storage/v1/object/public/product-covers/${cleanPath}`;`
    A cache-busting timestamp `?t=updated_at` is appended to bypass browser caching when updated.

### C. Manual Bank Transfer Receipts (`fastpay-proofs` Bucket)
*   **Checkout Upload:** Members upload receipts through `ProofUploader.tsx`. It issues a multipart request to `POST /api/fastpay/upload-proof` on the backend.
*   **Backend Validation & Upload:**
    *   Multer parses the file (max 10MB, allowed types: `image/jpeg`, `image/png`, `application/pdf`).
    *   Verifies that the order exists, is currently `pending`, and belongs to the authenticated member.
    *   Uploads to the private `fastpay-proofs` bucket at `storagePath = `${member.id}/${order.id}_proof.${ext}``.
    *   Saves the path to `fastpay_orders.proof_url` and sends a webhook/notification.
*   **Collaborator Upload:** Collaborators upload receipts under the dashboard via `CollaboratorDashboard.tsx` directly to the `fastpay-proofs` bucket on the client side using the `supabase` JS client.

### D. User Avatars (`avatars` Bucket)
*   **Frontend Upload:** Handled in `src/pages/Settings.tsx` (`handleAvatarUpload`):
    *   Validates file size (strictly <= 5MB).
    *   Uploads directly to the `avatars` bucket via the `supabase` client at path `${activeMemberId}-${Date.now()}.${fileExt}`.
    *   Gets public URL via `supabase.storage.from('avatars').getPublicUrl(fileName)`.
    *   Saves URL inside the member's profile JSON: `members.profile_data.avatar_url`.
*   **Storage Access:** Bucket `avatars` is public, allowing direct image loading on the frontend.

### E. Video Lessons / Streaming
*   **Lesson Media Storage:** Lesson videos/audios are stored in `ebooks-private` bucket. Relative paths are saved in `course_lessons.video_storage_path` and `course_lessons.audio_storage_path`.
*   **Streaming Endpoint (`GET /api/lessons/:lessonId/stream`):**
    1.  Verifies user authentication and lesson access via `memberCanAccessLesson`.
    2.  If the lesson is a link, it returns the link details.
    3.  If it is video/audio, it generates a signed URL from `ebooks-private` bucket (valid for 1 hour).
    4.  Returns JSON containing the signed URL: `{ success: true, type: 'video', url: signed.signedUrl, expiresIn: 3600 }`.
*   **Download Endpoint (`GET /api/lessons/:lessonId/download`):**
    *   Authenticates member access, retrieves the signed URL for the video file, fetches the buffer on the backend, and streams it back to the client as an attachment.

---

## 3. Database Clients, Schemas, and Environments

### Database Clients
1.  **Backend:** `backend/lib/supabase.ts` uses `supabaseAdmin` initialized with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Store Frontend:** `src/lib/supabase.ts` uses `supabase` initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3.  **Admin Frontend:** `admin/src/lib/supabase-admin.ts` implements two clients:
    *   `supabase` (auth client via anon key).
    *   `supabaseAdmin` (data client via `VITE_SUPABASE_SERVICE_ROLE_KEY` if present, else falls back to anon key).

### Environment Variables Matrix
| Context | Variable | Purpose |
| --- | --- | --- |
| **Store Frontend** | `VITE_SUPABASE_URL` | Supabase endpoint URL |
| | `VITE_SUPABASE_ANON_KEY` | Public anon key |
| | `VITE_BACKEND_URL` | Express backend endpoint |
| **Admin Frontend** | `VITE_SUPABASE_URL` | Supabase endpoint URL |
| | `VITE_SUPABASE_ANON_KEY` | Public anon key |
| | `VITE_SUPABASE_SERVICE_ROLE_KEY`| Admin bypass key (optional) |
| | `VITE_ADMIN_API_KEY` | Key for admin-only backend endpoints |
| **Backend** | `SUPABASE_URL` | Supabase endpoint URL |
| | `SUPABASE_SERVICE_ROLE_KEY`| Admin bypass key |
| | `ADMIN_API_KEY` | Verification key for admin requests |

---

## 4. Test Suites, Runners, and Build Commands

### Automated Testing
*   There are **no automated test runners** (such as Vitest, Jest, Mocha, or Playwright) configured in the root or child package.json files.
*   **Testing utilities** exist as standalone script files:
    *   `backend/supabase/*-test.sql` files for database-level assertion.
    *   `scratch/*.js` & `scratch/*.py` (e.g. `test-public-urls.js`, `test-sign.ts`) for testing specific features locally.

### Build and Dev Commands
*   **Root Folder (Store Frontend):**
    *   `npm run dev` -> `vite --port=3040 --host=0.0.0.0`
    *   `npm run build` -> `vite build`
*   **Backend Folder:**
    *   `npm run start` -> `tsx stripe-server.ts`
    *   `npm run dev` -> `tsx watch stripe-server.ts`
*   **Admin Folder:**
    *   `npm run dev` -> `vite --port 5180`
    *   `npm run build` -> `tsc && vite build`

---

## 5. Mapped Frontend Upload & Display Code

### Admin Panel (`admin/`)
*   `admin/src/lib/storage.ts`: Defines sizes/bucket limits (covers: 5MB, previews: 10MB, videos: 100MB, ebooks: 2GB) and exports `uploadFile` (calls `supabaseAdmin.storage.from(bucket).upload`), `generateSignedUrl`, and `getStorageUrl`.
*   `admin/src/components/products/FileUploader.tsx`: Renders file dropzone, file validations, and invokes the upload file helper with progress updates.
*   `admin/src/components/products/CurriculumEditor.tsx` & `admin/src/lib/curriculum.ts`: Handles lesson and module creation, uploading audio/video lesson media files directly to the `ebooks-private` bucket.

### Store Frontend (`src/`)
*   `src/components/payment/ProofUploader.tsx`: Interactive uploader for manual receipts, submitting files via multipart/form-data to `/api/fastpay/upload-proof`.
*   `src/pages/CollaboratorDashboard.tsx`: Direct upload of bank transfer screenshots to `fastpay-proofs` via the frontend Supabase JS client.
*   `src/pages/CollaboratorProductForm.tsx`: Direct upload of product assets (covers, previews, ebooks) to Supabase Storage, with restricted maximum size constraints (e.g., free tier ebooks restricted to 50MB).
*   `src/pages/Settings.tsx`: Profile avatar uploader directly communicating with the public `avatars` bucket.

---

## 6. Recommended Hybrid Integration & Cloudflare Stream Plan

To optimize cost, increase security, and support high-quality media streaming, we propose the following hybrid storage design:

```
                          ┌────────────────────────┐
                          │     CodeEngine App     │
                          └───────────┬────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
 ┌───────────────────────┐  ┌───────────────────┐  ┌───────────────────────┐
 │     Cloudflare R2     │  │ Cloudflare Stream │  │   Supabase Storage    │
 ├───────────────────────┤  ├───────────────────┤  ├───────────────────────┤
 │ - Covers (Public)     │  │ - Lesson Videos   │  │ - Avatars (Public)    │
 │ - Previews (Public)   │  │   (Secured with   │  │ - FastPay Proofs      │
 │ - Promo Videos (Pub)  │  │   signed tokens)  │  │   (Restricted RLS)    │
 │ - Paid Files (Private)│  │                   │  │                       │
 └───────────────────────┘  └───────────────────┘  └───────────────────────┘
```

### A. Cloudflare R2 Integration (Egress Cost Reduction)
*   **Scope:** public files (`product-covers`, `product-previews`, `product-videos`) and private downloads (`ebooks-private`).
*   **Backend Changes:**
    1.  Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `backend/package.json`.
    2.  Add R2 variables in `.env.backend`:
        ```env
        R2_ACCOUNT_ID=your_cloudflare_account_id
        R2_ACCESS_KEY_ID=your_r2_access_key
        R2_SECRET_ACCESS_KEY=your_r2_secret_key
        R2_PUBLIC_DOMAIN=https://pub-yourdomain.r2.dev
        R2_BUCKET_PRIVATE=ebooks-private
        ```
    3.  Create an R2 storage service client in `backend/lib/r2.ts`:
        ```typescript
        import { S3Client } from '@aws-sdk/client-s3';
        export const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        ```
    4.  Modify `backend/api/downloads/get-download.ts` and `backend/api/ebooks/read.ts` to generate presigned GET URLs from R2:
        ```typescript
        import { GetObjectCommand } from '@aws-sdk/client-s3';
        import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
        
        const command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_PRIVATE,
          Key: storagePath,
        });
        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        ```
*   **Frontend & Admin Changes:**
    1.  Create an API endpoint `POST /api/admin/storage/presign-put` that returns a presigned upload URL for client-side uploads directly to R2.
    2.  Update `admin/src/lib/storage.ts` and `CollaboratorProductForm.tsx` to request this URL and upload files directly to R2 via a standard `PUT` request, avoiding routing large payloads through the Express server or paying egress on Supabase.

### B. Restricted Supabase Storage (Security and Database Locality)
*   **Scope:** `avatars` and `fastpay-proofs` buckets.
*   **Justification:** These buckets have low egress traffic but require secure verification and user-level ownership. Keep them in Supabase Storage and lock down their RLS policies.
*   **RLS Policies Configuration:**
    *   **Avatars:** Allow `INSERT`/`UPDATE`/`DELETE` only if `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`.
    *   **FastPay Proofs:** Restrict direct client upload for collaborators. Route all uploads through the backend `POST /api/fastpay/upload-proof` to enforce strict order verification and keep keys secure.

### C. Cloudflare Stream Integration (Optimal Streaming Experience)
*   **Scope:** Course video lessons.
*   **Backend Changes:**
    1.  Add environment variables:
        ```env
        CLOUDFLARE_STREAM_ACCOUNT_ID=your_stream_account_id
        CLOUDFLARE_STREAM_TOKEN=your_cf_api_token
        CLOUDFLARE_STREAM_KEY=your_signing_key_hex
        ```
    2.  Expose `POST /api/admin/stream/upload-url` to generate a resumable TUS upload URL for the frontend.
    3.  Update the lesson streaming endpoint `GET /api/lessons/:lessonId/stream` to sign a CF Stream JWT if the lesson points to a CF Stream video ID:
        ```typescript
        import jwt from 'jsonwebtoken';
        
        // Generate CF Stream Signed Token (HLS/Dash playback protection)
        const token = jwt.sign(
          { sub: cfStreamVideoId, kid: process.env.CLOUDFLARE_STREAM_KEY_ID },
          Buffer.from(process.env.CLOUDFLARE_STREAM_KEY!, 'hex'),
          { algorithm: 'RS256', expiresIn: '1h' }
        );
        ```
*   **Frontend Changes:**
    1.  Update `CurriculumEditor.tsx` to upload lesson videos to Cloudflare Stream via TUS protocol.
    2.  Update `CoursePlayer.tsx` / `CoursePlayerPro.tsx` to embed the Cloudflare Stream Player iframe (`https://iframe.videodelivery.net/${videoId}?token=${signedToken}`) when the lesson media type is `cloudflare-stream`.
