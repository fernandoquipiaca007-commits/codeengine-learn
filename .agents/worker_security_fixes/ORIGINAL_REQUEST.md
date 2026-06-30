## 2026-06-28T22:47:52Z
You are the Security Fixes Worker.
Your working directory is: c:\Users\Dell\Documents\codeengine1.2\.agents\worker_security_fixes\
Your parent is: 054007c0-5f51-43d0-8585-8f541aba6ceb (the Project Orchestrator conversation ID)

Your task is to fix the extension spoofing security vulnerability in the FastPay payment proof upload handler and mock tests.

Please follow these instructions:
1. Load your context and state by reading the files c:\Users\Dell\Documents\codeengine1.2\.agents\worker_security_fixes\progress.md.
2. Update your progress.md file as you complete each task.
3. Edit the file `backend/api/fastpay/upload-proof.ts`:
   - Locate the line where the file extension is extracted: `const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';`
   - Implement an extension-to-mimetype validation using a dictionary, for example:
     ```typescript
     const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
     const validExtensionsForMime: Record<string, string[]> = {
       'image/jpeg': ['jpg', 'jpeg'],
       'image/png': ['png'],
       'application/pdf': ['pdf']
     };
     const allowedExtensions = validExtensionsForMime[file.mimetype];
     if (!allowedExtensions || !ext || !allowedExtensions.includes(ext)) {
       return res.status(400).json({
         success: false,
         error: 'File extension does not match the allowed file format and MIME type',
       });
     }
     ```
4. Edit the file `scratch/run-e2e-tests.ts`:
   - Update the mock handler for `/api/fastpay/upload-proof` (around line 572-616) to validate that the extension extracted from `proof_filename` matches the `proof_mimetype` using the same logic.
   - Add a new test case `TEST-T5-07` under Tier 5 that attempts to upload a file named `exploit.exe` with `image/png` mimetype, and asserts that the response code is 400.
5. Verification:
   - Run the E2E test suite in mock mode:
     `npx tsx scratch/run-e2e-tests.ts`
     and verify that all 56 tests pass.
   - Run compilation check:
     - Admin: `npx tsc --noEmit` in `/admin`
     - Backend: `npx tsc --noEmit` in `/backend`
     - Store: `npm run build` in root
     and ensure all compilation checks pass with zero errors.
6. Once complete, write handoff.md in your working directory and send a completion message back to your parent conversation ID (054007c0-5f51-43d0-8585-8f541aba6ceb).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
