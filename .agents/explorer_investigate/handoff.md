# Handoff Report — 2026-06-30T10:35:00+01:00

## 1. Observation

*   **Adicionar/Editar Produto (Collaborator)**:
    *   File `src/pages/CollaboratorProductForm.tsx`, lines 947, 987, and 1107–1108:
        ```tsx
        947:     <div className="text-white font-sans w-full h-full flex flex-col overflow-hidden">
        ...
        987:       <div className="px-4 py-2 shrink-0 border-b border-white/10 flex flex-row overflow-x-auto whitespace-nowrap bg-surface-container/10 gap-1.5 scrollbar-none flex-nowrap"
        ...
        1107:       <form id="product-form" onSubmit={handleSave} className="flex-grow flex flex-col overflow-hidden min-h-0">
        1108:         <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        ```
    *   `CardFanCarousel` theme preset selector rendered at line 2503.
*   **Collaborator Analytics & Graph**:
    *   File `src/pages/CollaboratorDashboard.tsx`, lines 2371, 2465, 2476, and 2095–2098:
        ```tsx
        2371:           <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
        ...
        2465:           <div className="glass-panel rounded-2xl p-2.5 border border-white/10 relative z-10">
        ...
        2476:                 <PureSvgChart data={chartData} />
        ...
        2095: function PureSvgChart({ data }: { data: Array<{ displayDate: string; views: number; conversions: number; revenueUsd: number; revenueAoa: number }> }) {
        2096:   // SVG dimensions
        2097:   const width = 500;
        2098:   const height = 140;
        ```
*   **Two Promo Banners**:
    *   File `src/pages/Home.tsx`, lines 1094, 1099, and 1135:
        ```tsx
        1094:         <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
        ...
        1099:             className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20"
        ...
        1135:             className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20"
        ```
        And `aspectRatio: '1/1'` is inline-styled.
*   **MyLibrary & Filters (Mobile)**:
    *   File `src/components/member/MyLibrary.tsx`, lines 109, 115, 126, 130, 135, and 151:
        ```tsx
        109:       <div className="flex flex-wrap gap-1">
        ...
        115:             className={`px-2.5 py-1 rounded-full text-[9px] font-display font-semibold tracking-widest uppercase transition-all ${
        ...
        126:       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        ...
        130:             className="group glass-panel rounded-lg border border-white/10 overflow-hidden flex gap-2 p-2 hover:border-primary/30 transition-all"
        ...
        135:               className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-surface-highest"
        ...
        151:               <h3 className="font-display font-semibold text-xs text-white truncate mb-0.5">
        ```
*   **Featured Products Editor**:
    *   File `admin/src/pages/FeaturedProducts.tsx`, lines 113–116:
        ```tsx
        113:     const occupiedPositions = items.map((item) => item.order_position);
        114:     let vacantPosition = 0;
        115:     for (let pos = 0; pos <= 2; pos++) {
        116:       if (!occupiedPositions.includes(pos)) {
        ```
*   **Circular Gallery Items (Home Ads/Organic Products)**:
    *   File `src/pages/Home.tsx`, lines 449–458:
        ```tsx
        449:   const circularGalleryItems = [
        450:     ...featuredAds
        451:       .filter(ad => ad.product && ad.product.status === 'active')
        452:       .map(ad => ({
        453:         ...ad.product,
        454:         isSponsored: true,
        455:         campaignId: ad.id
        456:       })),
        457:     ...products.sort(sortByInterests)
        458:   ].slice(0, 8);
        ```
*   **Members Navigation Bar**:
    *   File `src/pages/Member.tsx`, lines 445 and 455:
        ```tsx
        445:         className="glass-panel rounded-xl p-1 border border-white/10 mb-3 flex gap-1 overflow-x-auto"
        ...
        455:             className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-display text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-all touch-target ${
        ```
*   **Scroll-Scrubbing & Presets**:
    *   ScrollTiedBackground: `src/components/ui/ScrollTiedBackground.tsx` smooth LERP calculation on line 66:
        ```typescript
        currentProgress += diff * 0.16;
        ```
    *   Presets: `src/components/ui/CardFanCarousel.tsx` line 97 exports `THEME_PRESETS`.
*   **Background Preview Rendering**:
    *   File `src/pages/CollaboratorProductForm.tsx`, lines 2643 and 2671:
        ```tsx
        2643:                 {name || 'Nome do seu Produto'}
        ...
        2671:                     {price ? `${price} AOA` : 'Preço do Produto'}
        ```

## 2. Logic Chain

1.  **UI Density (R1)**:
    *   The collaborator product form layout uses `flex-col` with `overflow-hidden` on the parent, a separate non-scrollable header/tabs region (`shrink-0`), and a scrollable body (`overflow-y-auto`) to confine it to `100vh`.
    *   The PureSvgChart uses a fixed viewBox ratio (500x140) to render inside a `p-2.5` padding panel.
    *   The home promo cards enforce a square aspect ratio via `aspectRatio: '1/1'` and `aspect-square`.
2.  **Mobile Enhancements (R2)**:
    *   Card layouts in `MyLibrary.tsx` utilize `grid-cols-1 sm:grid-cols-2` and small text tags (`text-xs`, `text-[9px]`, `w-10 h-10` thumbnails) to scale down on phone screens.
    *   Dropdown filters in `Library.tsx` limit panel height (`max-h-[250px] overflow-y-auto`) to fit mobile viewport heights.
3.  **Ad Deduplication (R3)**:
    *   The `circularGalleryItems` array combines active ads (`featuredAds`) and organic items (`products`) directly without filtering out duplicate IDs. Hence, active ads are duplicated as organic products when both lists contain the same product.
4.  **Members Tab Spacing (R4)**:
    *   `Member.tsx` defines the menu wrapper (`rounded-xl p-1 gap-1 mb-3`) and the tab button (`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs`).
5.  **Preview Crash (R5)**:
    *   The `CollaboratorProductForm` renders a mockup screen containing references to `name` and `price`.
    *   Since these variables are not declared in the component scope (the actual states are `title`, `priceAOA` and `priceUSD`), executing the preview code triggers a `ReferenceError` which crashes the application view.

## 3. Caveats

*   Only local static code analysis was conducted. No database triggers/policies on tables like `featured_products` or `ad_campaigns` were checked.

## 4. Conclusion

1.  **R1 & R2**: Layout properties and classes are correctly configured in `CollaboratorProductForm.tsx`, `CollaboratorDashboard.tsx`, `MyLibrary.tsx`, `Library.tsx`, and `Home.tsx`.
2.  **R3**: There is a missing deduplication logic in `circularGalleryItems` in `src/pages/Home.tsx` which leads to duplicate slides in the 3D Carousel.
3.  **R4**: Member tab restoration and navigation style configuration live in `src/pages/Member.tsx` lines 418–460.
4.  **R5**: The preview crash in `CollaboratorProductForm.tsx` is caused by `ReferenceError` for the variables `name` and `price` (which should be renamed to `title` and `priceAOA`).

## 5. Verification Method

1.  To check if the preview crashes:
    *   Open `src/pages/CollaboratorProductForm.tsx`.
    *   Set `showPreview` to `true` (either by clicking the preview button in a running instance or changing state default to `true`).
    *   Verify if a `ReferenceError: name is not defined` appears in console.
2.  To check the missing deduplication logic:
    *   Inspect `src/pages/Home.tsx` line 449. Verify that organic products are added with `...products.sort(sortByInterests)` without filter-deduplicating against `featuredAds`.
3.  Build verification:
    *   Verify the TypeScript types by running `tsc --noEmit` from the root directory.
