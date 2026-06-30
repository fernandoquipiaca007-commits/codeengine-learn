# Scope: Hybrid Storage and Cloudflare Stream Integration

## Architecture
- CodeEngine storage logic combines Cloudflare R2 (Object Storage) for file uploads, downloads, and pre-signed reads, with Cloudflare Stream for secure video delivery.
- Database: Supabase/PostgreSQL for tracking files, sizes, and permissions.
- Backend: Express-based REST API running in Node.js (stripe-server.ts).
- Frontend: Vite-based store and admin areas.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 2.1 | Storage Config & Presigned Upload API | R2 client backend integration, POST /api/admin/storage/presigned-upload route, and Supabase size validation trigger/checks | none | DONE |
| 2.2 | Download, Reader & Stream Protection | R2 streaming downloads, R2 pre-signed read URL for ebooks, and RSA key JWT signing for lesson video streaming | 2.1 | DONE |
| 2.3 | Frontend Uploads & Displays | Vite store/admin frontend uploaders and asset rendering code | 2.2 | DONE |
| 2.4 | E2E Testing (Phase 1) | Wait for E2E testing track's `TEST_READY.md`, run Tiers 1-4 and resolve failures | 2.3 | DONE |
| 2.5 | Adversarial Hardening (Phase 2)| Challenger analyzes gaps, worker fixes, reviewer verifies (Tier 5) | 2.4 | DONE |
| 2.6 | Forensic Audit | Forensic Auditor runs checks and verifies clean output | 2.5 | DONE |

## Interface Contracts
### Admin API -> R2 S3 Upload
- `POST /api/admin/storage/presigned-upload`: Request a pre-signed URL for direct R2 uploading.
  - Request: `{ fileName: string, fileType: string, fileSize: number }`
  - Response: `{ uploadUrl: string, fileKey: string }`
- Supabase Size Validation Trigger:
  - Database constraint/trigger ensuring file size doesn't exceed subscription/hard limits.

### Downloads/Reader Protection
- `GET /api/downloads/:fileKey`: Secure download streaming from R2.
- `GET /api/admin/storage/presigned-read/:fileKey`: Obtain a read URL for ebook viewer or other assets.

### Video Protection
- `GET /api/videos/stream-token/:videoId`: Generate Cloudflare Stream signed JWT using RSA private key.
