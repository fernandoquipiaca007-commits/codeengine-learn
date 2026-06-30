# 🧪 CodeEngine Hybrid Storage & Cloudflare Stream Integration - Test Infrastructure Documentation

This document outlines the end-to-end (E2E) testing infrastructure, methodology, and comprehensive test suite for the hybrid storage and Cloudflare Stream integration in CodeEngine.

---

## 📋 Feature Inventory

The test suite validates four main features (N=4) designed to support CodeEngine's transition to a hybrid storage model and secure video delivery platform.

### F1: Cloudflare R2 Presigned Uploads
*   **Endpoint**: `POST /api/admin/storage/presigned-upload`
*   **Functionality**: Exposes secure PUT upload URLs for allowed buckets: `product-covers`, `product-previews`, `product-videos`, `ebooks-private`, and `fastpay-proofs`.
*   **Constraints**:
    *   Rejects request with `400 Bad Request` if `bucketName` is not in the allowed list.
    *   Authenticates via `Authorization: Bearer <token>` or `x-admin-key: <key>`.
    *   No Cloudflare R2 credentials (access keys, secret keys, accounts) are exposed in the JSON response.
    *   Returns paths prefixed with `r2://` (e.g., `r2://product-covers/unique-path.png`) to be stored in the database.

### F2: Supabase Storage Restriction
*   **Constraint**: Restricts profile picture/avatar uploads (`avatars` bucket) and basic system icons to files strictly **under 2MB** (2,097,152 bytes).
*   **Behavior**: Files equal to or larger than 2MB are rejected with `400 Bad Request` or `413 Payload Too Large` to prevent resource abuse.

### F3: Digital Downloads & Ebook Reader
*   **Endpoints**:
    *   `GET /api/downloads/:productId`
    *   `GET /api/ebooks/:productId/read`
*   **Functionality**:
    *   **Downloads**: If the database storage path starts with `r2://`, the server streams/pipes the file directly from Cloudflare R2 back to the client. Legacy paths (e.g., standard file paths) are resolved via Supabase Storage.
    *   **Ebook Reader**: If the path starts with `r2://`, the server returns a presigned R2 GET URL. Legacy paths are resolved via Supabase Storage signed URLs.
*   **Constraints**: Verifies member authorization, product access grants, and purchase records before exposing files.

### F4: Video Lesson Streaming
*   **Endpoint**: `GET /api/lessons/:lessonId/stream`
*   **Functionality**:
    *   If the video path starts with `cfstream://<video_id>`, the server signs an RSA-256 JWT token using its private key and returns a Cloudflare Stream iframe URL (`https://iframe.videodelivery.net/<video_id>?token=<token>`).
    *   Legacy video paths (not starting with `cfstream://`) are resolved as direct signed URLs from Supabase Storage and played in the standard HTML5 player.
*   **Constraints**: Verifies member course access permissions.

---

## 🛠️ Test Methodology

The E2E test suite operates in two modes to support both retrocompatibility testing and offline developer validation:

1.  **Mock Mode (`--mock` / Default)**: Spins up a local mock Express server within the test runner that replicates both legacy Supabase endpoints and the new R2/CF Stream endpoints according to the interface contract in `PROJECT.md`. Allows checking JWT tokens, file piping, headers, size restrictions, and errors.
2.  **Live Mode (`--live`)**: Runs the same 49 test cases against a running Express app (e.g., `backend/stripe-server.ts`).

### Opaque-Box Focus
All tests interact with the system strictly via HTTP requests and responses, validating status codes, response headers, content streaming length, and JSON schemas without inspecting internal implementation details.

---

## 🧪 Comprehensive Test Suite (49 Test Cases)

### Tier 1: Core Feature Happy Path Tests (20 Tests)

| ID | Feature | Title | Input | Expected Output |
|:---|:---|:---|:---|:---|
| **TEST-T1-01** | F1 | `product-covers` bucket URL generation | Valid auth, bucketName `product-covers` | `200 OK`, JSON contains `uploadUrl`, `dbPath` starts with `r2://` |
| **TEST-T1-02** | F1 | `product-previews` bucket URL generation | Valid auth, bucketName `product-previews` | `200 OK`, JSON contains `uploadUrl`, `dbPath` starts with `r2://` |
| **TEST-T1-03** | F1 | `product-videos` bucket URL generation | Valid auth, bucketName `product-videos` | `200 OK`, JSON contains `uploadUrl`, `dbPath` starts with `r2://` |
| **TEST-T1-04** | F1 | `ebooks-private` bucket URL generation | Valid auth, bucketName `ebooks-private` | `200 OK`, JSON contains `uploadUrl`, `dbPath` starts with `r2://` |
| **TEST-T1-05** | F1 | `fastpay-proofs` bucket URL generation | Valid auth, bucketName `fastpay-proofs` | `200 OK`, JSON contains `uploadUrl`, `dbPath` starts with `r2://` |
| **TEST-T1-06** | F1 | Credentials leak prevention | Presigned upload response | No R2 secrets (`AWS_ACCESS_KEY_ID`, etc.) are exposed |
| **TEST-T1-07** | F1 | `dbPath` protocol verification | Presigned upload response | `dbPath` begins exactly with `r2://` prefix |
| **TEST-T1-08** | F2 | Avatar upload under 2MB size limit | 100KB file payload to `avatars` bucket | `200 OK` or `201 Created` |
| **TEST-T1-09** | F2 | System icon upload under 2MB size limit | 50KB icon file payload | `200 OK` |
| **TEST-T1-10** | F3 | Digital download streaming from R2 | GET `/api/downloads/:productId` (R2 file) | `200 OK`, streams content, correct headers |
| **TEST-T1-11** | F3 | Digital download streaming from Supabase | GET `/api/downloads/:productId` (legacy file) | `200 OK`, streams content from Supabase |
| **TEST-T1-12** | F3 | Content-Type header on download | PDF download request | `Content-Type: application/pdf` header present |
| **TEST-T1-13** | F3 | Content-Disposition header on download | Download request | `Content-Disposition` header starts with `attachment;` |
| **TEST-T1-14** | F3 | Ebook reader R2 presigned URL | GET `/api/ebooks/:productId/read` (R2 file) | `200 OK`, JSON contains URL pointing to R2 |
| **TEST-T1-15** | F3 | Ebook reader Supabase URL fallback | GET `/api/ebooks/:productId/read` (legacy file) | `200 OK`, JSON contains URL pointing to Supabase |
| **TEST-T1-16** | F3 | Ebook reader JSON format check | Ebook read response | Contains keys `success`, `url`, `expiresIn`, `format`, `mimeType` |
| **TEST-T1-17** | F4 | Video lesson CF Stream iframe generation | GET `/api/lessons/:lessonId/stream` (CF path) | `200 OK`, type: `cloudflare-stream`, `iframeUrl` returned |
| **TEST-T1-18** | F4 | Cloudflare Stream signed JWT check | Iframe URL from CF Stream | Iframe URL query parameter `token` is a valid JWT string |
| **TEST-T1-19** | F4 | Video lesson legacy path streaming | GET `/api/lessons/:lessonId/stream` (legacy path) | `200 OK`, type: `video`, direct URL returned |
| **TEST-T1-20** | F4 | Legacy streaming MIME type | Legacy streaming response | JSON contains correct `mimeType` (e.g. `video/mp4`) |

---

### Tier 2: Boundary & Corner Cases Tests (20 Tests)

| ID | Feature | Title | Input | Expected Output |
|:---|:---|:---|:---|:---|
| **TEST-T2-01** | F1 | Presigned upload for disallowed bucket | bucketName `system-configs` | `400 Bad Request` |
| **TEST-T2-02** | F1 | Presigned upload with empty bucket name | bucketName `""` | `400 Bad Request` |
| **TEST-T2-03** | F1 | Presigned upload with empty file path | filePath `""` | `400 Bad Request` |
| **TEST-T2-04** | F1 | Presigned upload with empty content type | contentType `""` | `400 Bad Request` |
| **TEST-T2-05** | F1 | Presigned upload without authorization | Missing token / header | `401 Unauthorized` |
| **TEST-T2-06** | F1 | Presigned upload with invalid token | Invalid Bearer token | `403 Forbidden` or `401 Unauthorized` |
| **TEST-T2-07** | F2 | Avatar upload exactly 2MB limit | 2,097,152 bytes file payload | `400 Bad Request` or `413 Payload Too Large` |
| **TEST-T2-08** | F2 | Avatar upload over 2MB limit | 3MB file payload | `400 Bad Request` or `413 Payload Too Large` |
| **TEST-T2-09** | F2 | System icon upload over 2MB limit | 2.5MB file payload | `400 Bad Request` or `413 Payload Too Large` |
| **TEST-T2-10** | F2 | Size restricted uploads reject anonymous users | Upload request, no token | `401 Unauthorized` or `403 Forbidden` |
| **TEST-T2-11** | F3 | Download for non-existent product | GET `/api/downloads/nonexistent-uuid` | `404 Not Found` |
| **TEST-T2-12** | F3 | Download without product access permissions | GET download for unpaid product | `403 Forbidden` |
| **TEST-T2-13** | F3 | Download request with invalid token | GET download, bad token | `401 Unauthorized` |
| **TEST-T2-14** | F3 | Ebook read for non-existent product | GET ebook read, invalid UUID | `404 Not Found` |
| **TEST-T2-15** | F3 | Ebook read without access permissions | GET ebook read, unpaid product | `403 Forbidden` |
| **TEST-T2-16** | F3 | Ebook read with invalid token | GET ebook read, bad token | `401 Unauthorized` |
| **TEST-T2-17** | F4 | Video stream for non-existent lesson | GET stream, invalid UUID | `404 Not Found` |
| **TEST-T2-18** | F4 | Video stream without access permissions | GET stream, unpaid course lesson | `403 Forbidden` |
| **TEST-T2-19** | F4 | Video stream with invalid token | GET stream, bad token | `401 Unauthorized` |
| **TEST-T2-20** | F4 | Video stream malformed storage path | Video path field is empty/null/malformed | `404 Not Found` or `500` error gracefully handled |

---

### Tier 3: Integration & Cross-Feature Tests (4 Tests)

| ID | Feature | Title | Scenario | Expected Outcome |
|:---|:---|:---|:---|:---|
| **TEST-T3-01** | F1 + F3 | Product R2 upload and download | Admin requests upload -> uploads R2 file -> registers product -> member downloads file | File is piped successfully from R2 with correct byte count and status code |
| **TEST-T3-02** | F1 + F3 | Product R2 upload and ebook read | Admin requests upload -> uploads R2 ebook -> registers product -> member reads ebook | Reader returns R2 GET URL which downloads ebook correctly |
| **TEST-T3-03** | F1 + F4 | Lesson CF Stream config and playback | Admin configures video path as `cfstream://vid_abc123` -> member requests stream | Returned iframe URL contains `vid_abc123` and a valid signed JWT |
| **TEST-T3-04** | F2 + F3 | Avatar upload and profile synchronization | Member uploads <2MB avatar -> profile updates `avatar_url` | Profile page loads new avatar URL successfully |

---

### Tier 4: E2E User Journeys / Workloads (5 Tests)

| ID | Feature | Title | Scenario | Expected Outcome |
|:---|:---|:---|:---|:---|
| **TEST-T4-01** | F1..F4 | E2E Publisher & Buyer Journey | Admin creates new course/ebook with covers and R2 assets. User signs up, purchases product via mock checkout, downloads R2 ebook file and covers. | Full journey succeeds: 200 OKs, DB logs downloads, streams pipe with original data |
| **TEST-T4-02** | F3 | E2E Legacy vs Modern Ebook Reader | User purchases products containing both legacy Supabase and modern R2 storage paths. Verifies language fallback query parameters (`?lang=en`). | Reader serves files correctly. Modern uses R2 GET, legacy uses Supabase GET. Language translations are fallback-safe |
| **TEST-T4-03** | F4 | E2E Course Enrollment & Playback | User registers, purchases course. Requests Cloudflare Stream video lesson, receives secure iframe, updates course watch progress, and views continue watching. | Progress updates successfully (200 OK). Iframe is fully secure. Progressive watch history works |
| **TEST-T4-04** | F1 + F2 | E2E Collaborator & Asset Upload | Collaborator is created. Uploads covers (<2MB) successfully. Attempts to upload a 3.5MB avatar (rejected). Uploads FastPay receipt proof to R2. | R2 proofs allow upload. size limits block oversized avatar file. RLS simulation blocks other collaborators |
| **TEST-T4-05** | F1..F4 | E2E Adversarial Security Audit | Runs simulated DDoS on endpoints, injects SQL payloads into route parameters, attempts path traversal (`../../`) on R2 download keys, uses invalid keys. | Rate limits trigger 429. SQL payloads sanitized. Path traversals blocked. Unauthorized keys rejected |

---

## 🚀 Execution Guide

Run the E2E test suite from the project root using `tsx`:

```bash
# Run using the built-in mock server (Offline Verification)
npx tsx scratch/run-e2e-tests.ts

# Run against a running production/development backend server
npx tsx scratch/run-e2e-tests.ts --live
```
