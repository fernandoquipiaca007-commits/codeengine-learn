# Project: CodeEngine Hybrid Storage & Cloudflare Stream Integration

## Architecture
This project integrates a hybrid storage system (Cloudflare R2 for large commercial/product assets and transfer proofs, and Supabase Storage restricted to <2MB system assets) and Cloudflare Stream for secure, token-protected lesson video streaming.

```
                            ┌────────────────────────┐
                            │    Store / Admin UI    │
                            └───────────┬────────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               ▼                        ▼                        ▼
    ┌───────────────────────┐  ┌───────────────────┐  ┌───────────────────────┐
    │     Cloudflare R2     │  │ Cloudflare Stream │  │   Supabase Storage    │
    ├───────────────────────┤  ├───────────────────┤  ├───────────────────────┤
    │ - Covers (Public)     │  │ - Lesson Videos   │  │ - Avatars (Public)    │
    │ - Previews (Public)   │  │   (Secured with   │  │   (Restricted <2MB)   │
    │ - Promo Videos (Pub)  │  │   signed JWTs)    │  │ - Basic System Icons  │
    │ - Paid Files (Private)│  │                   │  │                       │
    │ - FastPay Proofs (Priv)  │                   │  │                       │
    └───────────────────────┘  └───────────────────┘  └───────────────────────┘
```

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite | Build opaque-box E2E tests for testing file uploads, R2 downloads, Supabase size validation, and Cloudflare Stream URL generation. | None | IN_PROGRESS |
| 2 | Storage Config & Presigned Upload API | Implement R2 client connection, Express endpoint `POST /api/admin/storage/presigned-upload`, and Supabase bucket limit enforcement. | M1 | IN_PROGRESS |
| 3 | Download, Reader & Stream Protection | Update `/api/downloads/:productId`, `/api/ebooks/:productId/read`, and `/api/lessons/:lessonId/stream` to secure R2/Stream files with token signature and stream pipe. | M2 | IN_PROGRESS |
| 4 | Frontend Uploads & Displays | Update frontend & admin uploaders (FileUploader, ProofUploader, CollaboratorDashboard) to request presigned upload URLs and handle asset resolving. | M3 | IN_PROGRESS |
| 5 | E2E Integration & Verification | Execute E2E tests, run Forensic Auditor integrity verification, perform adversarial coverage hardening (Tier 5), and verify backward compatibility. | M4 | IN_PROGRESS |

## Interface Contracts

### 1. Presigned Upload Endpoint
- **URL**: `POST /api/admin/storage/presigned-upload`
- **Headers**:
  - `Authorization`: `Bearer <token>` (Members / Collaborators) or `x-admin-key`: `<admin_key>` (Admins)
- **Request Body**:
  ```json
  {
    "bucketName": "product-covers | product-previews | product-videos | ebooks-private | fastpay-proofs",
    "filePath": "relative/path/to/file.ext",
    "contentType": "mime/type"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "uploadUrl": "https://<account_id>.r2.cloudflarestorage.com/<bucket>/<mapped_folder>/relative/path/to/file.ext?...",
    "dbPath": "r2://<mapped_folder>/relative/path/to/file.ext"
  }
  ```

### 2. Video Lesson Streaming Endpoint
- **URL**: `GET /api/lessons/:lessonId/stream`
- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Response for R2 videos (200 OK)**:
  ```json
  {
    "success": true,
    "type": "video",
    "url": "https://...",
    "expiresIn": 3600,
    "mimeType": "video/mp4"
  }
  ```
- **Response for Cloudflare Stream videos (`cfstream://<video_id>`) (200 OK)**:
  ```json
  {
    "success": true,
    "type": "cloudflare-stream",
    "iframeUrl": "https://iframe.videodelivery.net/<video_id>?token=<signed_jwt_token>"
  }
  ```

### 3. Product Ebook Reader Endpoint
- **URL**: `GET /api/ebooks/:productId/read`
- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "url": "https://<r2_presigned_url> or <supabase_signed_url>",
    "expiresIn": 3600,
    "format": "pdf | epub",
    "mimeType": "application/pdf"
  }
  ```

## Code Layout
- `backend/lib/r2.ts`: Cloudflare R2 Client and utility functions.
- `backend/api/admin/storage/presigned-upload.ts`: Endpoint controller to generate presigned PUT URLs for R2.
- `backend/api/downloads/get-download.ts`: Download handler updated to read from R2 and stream back to the client.
- `backend/api/lessons/stream.ts`: Streaming handler updated to sign Cloudflare Stream JWT tokens and return iframe URLs.
- `backend/api/fastpay/upload-proof.ts`: Update to upload transfer receipts to R2.
- `src/lib/storage-path.ts`: Frontend path resolver updated to support `r2://` URLs.
- `admin/src/lib/storage.ts`: Admin uploader updated to fetch presigned PUT URLs and upload directly to R2.
