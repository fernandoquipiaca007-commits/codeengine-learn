## 2026-06-28T22:17:21Z

You are a teamwork_preview_worker. Your working directory is: c:\Users\Dell\Documents\codeengine1.2\.agents\worker_milestone2.1\

Your mission is to implement Milestone 2.1: Storage Config & Presigned Upload API.

Please perform the following steps:
1. In `backend/`, install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` using npm.
2. In `backend/lib/r2.ts`, create and export `r2Client` (configured with credentials from `.env.backend`). It should support the following environment variables:
   - `CLOUDFLARE_R2_ENDPOINT` or `R2_ENDPOINT`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID` or `R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY` or `R2_SECRET_ACCESS_KEY`
   Fallback to reading values parsed from the Portuguese credentials dump at the bottom of `.env.backend` if those env variables are not set in the process.env.
3. In `backend/api/admin/storage/presigned-upload.ts`, implement the Express route handler for `POST /api/admin/storage/presigned-upload`.
   - The route must authenticate the request using either:
     - Header `x-admin-key` matching `process.env.ADMIN_API_KEY` Timing-safely.
     - Header `Authorization: Bearer <token>` verified via `supabaseAdmin.auth.getUser(token)` (the authenticated member/collaborator).
   - The request body will contain:
     ```json
     {
       "bucketName": "product-covers | product-previews | product-videos | ebooks-private | fastpay-proofs",
       "filePath": "relative/path/to/file.ext",
       "contentType": "mime/type"
     }
     ```
   - Generate a presigned PUT URL for Cloudflare R2 bucket (using the request's `bucketName` as S3 bucket) and return:
     ```json
     {
       "success": true,
       "uploadUrl": "<presigned_put_url>",
       "dbPath": "r2://<bucketName>/<filePath>"
     }
     ```
4. Register the route `POST /api/admin/storage/presigned-upload` in `backend/stripe-server.ts`.
5. Implement size validation for Supabase Storage buckets. Write a database migration script that connects to Supabase database (using password 'JUNIOR.com0007' and host postgres.ffdqqiunkzhtgbgaojay.supabase.co or equivalent connection string) to install a BEFORE INSERT OR UPDATE trigger on `storage.objects` to ensure any file uploaded to `avatars` bucket does not exceed 2MB (2,097,152 bytes) in metadata size, and run it.
6. Verify that the backend builds and compiles successfully.
7. Write a detailed handoff report in `c:\Users\Dell\Documents\codeengine1.2\.agents\worker_milestone2.1\handoff.md` detailing changes made and verification results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
