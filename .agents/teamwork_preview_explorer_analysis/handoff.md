# Handoff Report - Hybrid Storage & Stream Integration Analysis

## 1. Observation
We investigated the CodeEngine workspace and observed the following configurations, directories, files, and implementations:

*   **Project Workspaces Layout:**
    *   Store Frontend: `src/` (root Vite React project running on port `3040` as configured in `.env.local` line 10: `VITE_APP_URL=http://localhost:3040`).
    *   Admin Frontend: `admin/` (Vite React project running on port `5180` as configured in `admin/package.json` line 7: `"dev": "vite --port 5180"`).
    *   Express Backend: `backend/` (Express Node app bootstrapped from `backend/stripe-server.ts` running on port `3001` as configured in `backend/package.json` line 7: `"start": "tsx stripe-server.ts"`).

*   **Backend Storage Endpoints (in `backend/stripe-server.ts`):**
    *   Line 278: `app.get('/api/downloads/:productId', getDownload);`
    *   Line 547: `app.get('/api/lessons/:lessonId/stream', streamLesson);`
    *   Line 548: `app.get('/api/lessons/:lessonId/download', downloadLesson);`
    *   Line 549: `app.get('/api/ebooks/:productId/read', readEbook);`
    *   Line 626: `app.use('/api/fastpay', fastpayRoutes);` (fastpay routes include proof upload in `backend/api/fastpay/routes.ts` line 33: `router.post('/upload-proof', upload.single('proof'), uploadProof);`).

*   **Supabase Signed URLs Generation (in `backend/api/downloads/get-download.ts`):**
    *   Lines 110-112: 
        ```typescript
        const { data: signed, error: signError } = await supabaseAdmin.storage
          .from('ebooks-private')
          .createSignedUrl(storagePath, 3600);
        ```

*   **Direct Supabase Storage Uploads on Frontend:**
    *   Avatar Upload (in `src/pages/Settings.tsx` lines 287-289):
        ```typescript
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);
        ```
    *   Collaborator Product Creation (in `src/pages/CollaboratorProductForm.tsx` lines 656-658):
        ```typescript
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);
        ```

*   **Database Tables & Columns (in `backend/supabase/add-storage-path-columns.sql`):**
    *   Lines 14-18:
        ```sql
        ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS cover_storage_path TEXT,
          ADD COLUMN IF NOT EXISTS preview_storage_path TEXT,
          ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
          ADD COLUMN IF NOT EXISTS file_storage_path TEXT;
        ```

---

## 2. Logic Chain
1.  **High Egress Cost Mitigation:** Since digital downloads (`ebooks-private`), covers (`product-covers`), previews (`product-previews`), and promotional videos (`product-videos`) are currently served directly from Supabase Storage buckets, and paid downloads are generated using backend-signed Supabase URLs (refer to *Observation* on `get-download.ts` and `read.ts`), migrating these to Cloudflare R2 will eliminate Supabase egress fees.
2.  **Locality & RLS for Sensitive Data:** Avatars (`avatars`) and bank transfers (`fastpay-proofs`) contain user-specific and sensitive info. They currently utilize frontend direct uploads or dedicated backend routes (`uploadProof`) linked to Supabase. Retaining these on Supabase Storage allows us to leverage its native integration with PostgreSQL Row-Level Security (RLS) policies based on `auth.uid()`, minimizing custom access token logic.
3.  **Optimal Media Protection:** Streaming video lessons currently generates direct signed URLs to MP4 video files in Supabase Storage (`stream.ts` lines 39-45). This causes buffering delays and allows users to easily copy direct video URLs to download paid courses. Integrating Cloudflare Stream and utilizing signing keys allows the player to render protected adaptive bitrate streams (HLS/Dash), improving load times and security.

---

## 3. Caveats
*   We assumed Cloudflare R2 bucket names can mimic current Supabase bucket names (`product-covers`, `product-previews`, `product-videos`, `ebooks-private`) to minimize changes to database reference paths.
*   We did not inspect any external CDN caching headers or DNS settings for Cloudflare R2 public domains, which must be configured separately to secure the custom public URLs.

---

## 4. Conclusion
We recommend implementing a Hybrid Storage Integration where Cloudflare R2 hosts core product media/previews and private files, while Supabase Storage retains restricted bank receipts and user profile avatars under strict RLS policies. Course video streaming should be refactored to use Cloudflare Stream with JWT-signed playbacks.

---

## 5. Verification Method
1.  Verify the location of this analysis report:
    *   Read the contents of `c:\Users\Dell\Documents\codeengine1.2\.agents\teamwork_preview_explorer_analysis\analysis.md` to check detailed mapping and recommendations.
2.  Verify backend file structure:
    *   Inspect `backend/stripe-server.ts` to confirm endpoint registrations.
    *   Inspect `backend/api/downloads/get-download.ts` to verify download validation logic.
