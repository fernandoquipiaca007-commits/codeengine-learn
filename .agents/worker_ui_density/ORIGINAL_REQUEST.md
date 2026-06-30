## 2026-06-30T09:05:40Z

Implement UI and styling updates for Milestones 1, 2, 4, and 5:

1. UI Density Optimizations (100vh) - R1:
   - In `src/pages/CollaboratorProductForm.tsx`: compress theme carousel (CardFanCarousel), form fields, margins, buttons, and paddings to fit in 100vh viewport height without vertical scrolling.
   - In `admin/src/components/products/ProductForm.tsx`: compress form spacing, input sizes, margins, and card paddings to fit the product editor page nicely inside 100vh height.
   - In `src/pages/CollaboratorDashboard.tsx`: compress metric cards (reduce grid gap and card paddings) and reduce height of visit tendency graph (PureSvgChart wrapper) to ~200px.
   - In `src/pages/Home.tsx`: decrease width and height of creator partnership banner and affiliate rewards banner by at least 30% (reversing current size or scaling down the current aspect ratios).

2. Mobile Design Enhancements - R2:
   - In `src/components/member/MyLibrary.tsx`: reduce typography (title and labels), buttons, margins, and card padding on mobile screens.
   - In `src/pages/Library.tsx`: make filter dropdowns compact and elegant for mobile devices, ensuring max-height constraints prevent overflowing offscreen.
   - In `src/pages/CollaboratorDashboard.tsx`: refactor the mobile view of filters and stats analytics panel to fit neatly and display more info simultaneously.

3. Members Tab Navigation Restoration - R4:
   - In `src/pages/Member.tsx`: restore the tab container style, padding, spacing, and buttons rounding exactly as requested:
     - Spacing and padding of the container wrapper: `p-2 gap-2 mb-8`
     - Padding, font, and rounding of buttons: `px-4 py-3 rounded-2xl font-display text-xs sm:text-sm`
     - Wrapper height: `pt-28 pb-32 max-w-[min(100%,900px)] min-h-screen`

4. Themes & Background Preview Fixes - R5:
   - In `src/pages/CollaboratorProductForm.tsx`: fix the browser/console crash when clicking background preview. Locate the JSX mockup within `{showPreview && ...}` (around lines 2607-2682) and replace the undefined references `name` with `title` and `price` with `priceAOA` to resolve the ReferenceError.
   - In `src/components/ui/ScrollTiedBackground.tsx`: ensure LERP calculation for video scrolling runs smoothly across light, dark, and gradient presets, and clarify settings text descriptions.

Build Verification:
- Run `npm run build` or `npm run lint` (`tsc --noEmit`) in root to verify type correctness.
- Run `npm run build` or `npm run lint` in `admin/` to verify admin panel build succeeds.
- Document build outcomes in your handoff.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes and verification outcomes to `.agents/worker_ui_density/handoff.md` and send a message when complete.
