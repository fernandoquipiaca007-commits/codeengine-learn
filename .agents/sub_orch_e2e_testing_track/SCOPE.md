# Scope: E2E Testing Track

## Architecture
- The test suite is designed as a standalone node test script running via `tsx`.
- It executes opaque-box tests against the Express API server (or mock server if implementation is not complete).
- The test runner tests three main boundaries:
  1. Cloudflare R2 presigned PUT upload URLs and download/read streams.
  2. Supabase Storage 2MB file size limits on the `avatars` bucket.
  3. Cloudflare Stream secure signed JWT playback iframe generation.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test runner setup & mock environment | Define test runner structure using tsx and native Node tests (or Vitest/Jest if appropriate). Set up mock servers for backend endpoints. | None | PLANNED |
| 2 | Tier 1 Feature Coverage | Implement 20 tests verifying R2 upload generation, R2 downloads, Supabase avatar uploads, and Cloudflare Stream token signing. | M1 | PLANNED |
| 3 | Tier 2 Boundary & Corner Cases | Implement 20 tests for edge/error conditions: file sizes, bad credentials, missing fields, invalid IDs. | M2 | PLANNED |
| 4 | Tier 3 Cross-Feature Integration | Implement 4 tests linking upload, DB state, and download/stream endpoints together. | M3 | PLANNED |
| 5 | Tier 4 Real-World Workloads | Implement 5 tests executing end-to-end user journeys (Product creation to purchase/download, Course enrollment to player). | M4 | PLANNED |
| 6 | Execution & Verification | Run the full E2E test suite, output test reports, and publish TEST_READY.md at the project root. | M5 | PLANNED |

## Interface Contracts
These match the global contract defined in `PROJECT.md`.
- `POST /api/admin/storage/presigned-upload`
- `GET /api/downloads/:productId`
- `GET /api/ebooks/:productId/read`
- `GET /api/lessons/:lessonId/stream`
- Supabase storage limits (avatars < 2MB).
