## 2026-06-28T21:23:58Z

You are a teamwork_preview_worker. Your working directory is: c:\Users\Dell\Documents\codeengine1.2\.agents\worker_milestone2.2\

Your mission is to implement Milestone 2.2: Download, Reader & Stream Protection.

Please execute the following tasks:
1. Update `backend/api/downloads/get-download.ts`:
   - If the resolved `storageUrl` starts with `r2://`:
     - Parse the bucket name and file path from it (e.g. `r2://bucket-name/relative/path/to/file.ext`).
     - Initialize `GetObjectCommand` from `@aws-sdk/client-s3` and call `r2Client.send(command)` to fetch the file.
     - Stream/pipe the R2 object body directly to the Express response `res`.
     - Set response headers appropriately: `Content-Type`, `Content-Disposition` (attachment with the filename), and `Content-Length`.
   - If the `storageUrl` does not start with `r2://`, let it fall back to the existing Supabase storage signed URL and download streaming flow.

2. Update `backend/api/ebooks/read.ts`:
   - If the resolved `storageUrl` starts with `r2://`:
     - Parse the bucket name and key path.
     - Generate a presigned GET URL using `r2Client` and `getSignedUrl` from `@aws-sdk/s3-request-presigner` (valid for 3600 seconds).
     - Return the JSON response:
       ```json
       {
         "success": true,
         "url": "<presigned_url>",
         "expiresIn": 3600,
         "format": "<file_extension>",
         "mimeType": "<mime_type>"
       }
       ```
   - If it does not start with `r2://`, let it fall back to the existing Supabase storage signed URL read flow.

3. Update `backend/api/lessons/stream.ts`:
   - For `streamLesson`:
     - If the storage path starts with `cfstream://` (e.g., `cfstream://<video_id>`):
       - Parse the video ID.
       - Sign a JWT token using RS256 algorithm and a kid header. Use the key ID from `process.env.CLOUDFLARE_STREAM_KEY_ID` (default: `mock-key-id`). For the RSA private key, load it from `process.env.CLOUDFLARE_STREAM_PRIVATE_KEY` (which may be base64-encoded or a raw PEM string). If no private key is set in the environment, dynamically generate a temporary RSA 2048 key pair in memory (using `crypto.generateKeyPairSync`) to sign the token as a fallback so that the server does not crash.
       - Return JSON:
         ```json
         {
           "success": true,
           "type": "cloudflare-stream",
           "iframeUrl": "https://iframe.videodelivery.net/<video_id>?token=<jwt_token>"
         }
         ```
     - If the storage path starts with `r2://`:
       - Generate an R2 presigned GET URL (expires in 3600 seconds) and return JSON:
         ```json
         {
           "success": true,
           "type": "video",
           "url": "<signedUrl>",
           "expiresIn": 3600,
           "mimeType": "<mimeType>"
         }
         ```
     - Else, fall back to the existing Supabase storage signed URL flow.
   - For `downloadLesson`:
     - If the resolved `video_storage_path` starts with `r2://`:
       - Parse bucket and key, retrieve the object from R2 S3, set the headers, and stream the file directly to the client as an attachment.
     - Else, fall back to the existing Supabase download flow.

4. Verify that the backend compiles cleanly without errors.
5. Write a detailed handoff report in `c:\Users\Dell\Documents\codeengine1.2\.agents\worker_milestone2.2\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
