# Technical Investigation Report: UI density, mobile design, ads editor, members navigation, and themes

This report provides the results of a read-only codebase investigation into the layout configuration, mobile styling, deduplication logic, tab structure, and scroll-scrubbing systems.

---

## 1. R1: UI Density Optimization (100vh)

### 1.1 Adicionar/Editar Produto Screen
This screen exists both in the Collaborator dashboard (for draft submissions) and the Admin panel.
*   **Collaborator Product Form**:
    *   **File Path**: `src/pages/CollaboratorProductForm.tsx`
    *   **Outer Container**: Line 947:
        ```tsx
        <div className="text-white font-sans w-full h-full flex flex-col overflow-hidden">
        ```
    *   **Tab Navigation**: Lines 987–990:
        ```tsx
        className="px-4 py-2 shrink-0 border-b border-white/10 flex flex-row overflow-x-auto whitespace-nowrap bg-surface-container/10 gap-1.5 scrollbar-none flex-nowrap"
        ```
    *   **Form Scroll Container**: Line 1107–1108:
        ```tsx
        <form id="product-form" onSubmit={handleSave} className="flex-grow flex flex-col overflow-hidden min-h-0">
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        ```
    *   **Theme Carousel (CardFanCarousel)**: Rendered inside the `'theme'` tab (lines 2481–2510) at line 2503:
        ```tsx
        <CardFanCarousel 
          currentPath={themeVideoPath}
          currentConfig={themeVideoConfig}
          onSelectPreset={(preset) => { ... }}
        />
        ```
*   **Admin Product Form**:
    *   **File Paths**: `admin/src/pages/Products.tsx` and `admin/src/components/products/ProductForm.tsx`
    *   **Outer Wrapper (Page)**: `admin/src/pages/Products.tsx` lines 208 and 225 render the form within a container:
        ```tsx
        <div className="bg-white shadow rounded-lg p-6">
        ```
    *   **Form Container**: `admin/src/components/products/ProductForm.tsx` line 374:
        ```tsx
        <form onSubmit={handleSubmit} className="space-y-6">
        ```

### 1.2 Collaborator Metrics Cards & Visit Tendency Graph
*   **File Path**: `src/pages/CollaboratorDashboard.tsx`
*   **Summary/Metrics Cards**: Lines 2370–2462.
    *   The cards are wrapped in a responsive grid: `className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 relative z-10"` (line 2371).
    *   Each card is styled as: `className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-...-500/15"`.
    *   Values use `text-base font-bold text-white font-mono` for pricing and counts.
*   **Tendência de Visitas e Conversões Graph**: Lines 2465–2491.
    *   The container has padding: `glass-panel rounded-2xl p-2.5 border border-white/10 relative z-10` (line 2465).
    *   It renders `<PureSvgChart data={chartData} />` (line 2476).
    *   `PureSvgChart` is defined on lines 2095–2160. It renders an inline SVG with fixed dimensions `const width = 500; const height = 140;` and uses `<svg viewBox="0 0 500 140" className="w-full h-auto ...">` (lines 2097–2137) causing it to scale to container width.

### 1.3 Main Dashboard Collaborator/Affiliate Banners
*   **File Path**: `src/pages/Home.tsx`
*   **Section**: `{/* ─── Two Promo Cards Section ─── */}` (lines 1093–1160).
*   **Creator Partnership Banner**: Lines 1096–1130.
    *   Container classes/styles: `glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20` and inline `aspectRatio: '1/1'`.
    *   Background image: `/colaborador.jpg` (line 1106).
*   **Affiliate Rewards Banner**: Lines 1132–1160.
    *   Container classes/styles: `glass-card p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between gap-6 text-left group aspect-square cursor-pointer transition-all duration-300 hover:border-primary/20` and inline `aspectRatio: '1/1'`.
    *   Background image: `/Afiliado.jpg` (line 1142).

---

## 2. R2: Mobile Design Enhancements

### 2.1 Typographies
Standard Tailwind CSS utilities are configured responsively to adjust sizes on mobile. Examples from `src/components/member/MyLibrary.tsx` and `src/pages/Member.tsx` include:
*   Header Titles: `text-lg sm:text-xl font-bold` (Member area header, line 430).
*   Section Headings: `text-xl font-bold` or `text-3xl md:text-4xl font-extrabold`.
*   Form Labels: `text-[10px] sm:text-xs text-on-surface-variant` (Product form labels, line 1114).
*   Badges / Metatags: `text-[9px] font-bold uppercase tracking-wider` (Metrics badges, line 760).

### 2.2 Cards in Biblioteca Tab (MyLibrary)
*   **File Path**: `src/components/member/MyLibrary.tsx`
*   **Grid layout**: Line 126:
    ```tsx
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
    ```
*   **Card Container**: Lines 128–131:
    ```tsx
    className="group glass-panel rounded-lg border border-white/10 overflow-hidden flex gap-2 p-2 hover:border-primary/30 transition-all"
    ```
*   **Card Thumbnail**: Lines 132–135:
    ```tsx
    className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-surface-highest"
    ```
*   **Card Title**: Lines 151–153:
    ```tsx
    className="font-display font-semibold text-xs text-white truncate mb-0.5"
    ```
*   **Open Button**: Lines 165–166:
    ```tsx
    className="mt-auto inline-flex items-center gap-1 text-[10px] font-display font-semibold text-primary group-hover:text-secondary"
    ```

### 2.3 Filters
*   **Catalog/Search Page Filters**: `src/pages/Library.tsx` lines 375–450.
    *   Dropdown items list container has classes: `absolute right-0 mt-2 w-64 rounded-xl bg-[#0a0a0f] border border-white/15 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 max-h-[250px] overflow-y-auto` (line 403), optimizing it for mobile scrolling by enforcing a max height of 250px.
*   **Library Tab Filters**: `src/components/member/MyLibrary.tsx` lines 109–124.
    *   Container: `className="flex flex-wrap gap-1"`.
    *   Filter buttons: `className="px-2.5 py-1 rounded-full text-[9px] font-display font-semibold tracking-widest uppercase transition-all ..."`.

### 2.4 Stats Panel for Collaborator
*   **File Path**: `src/pages/CollaboratorDashboard.tsx`
*   **Wallet Panels (USD / AOA)**: Lines 752–780 and 874–900.
    *   Uses responsive grid layout: `className="grid gap-3 sm:grid-cols-3 relative z-10"`.
    *   Cards styled with `p-4` containing a `text-[9px]` badge, `text-xs` label, and `text-xl` amount.
*   **Analytics Overview Panel**: Lines 2371–2462.
    *   Grid layout: `className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 relative z-10"`.
    *   Cards styled with `p-2.5` containing a `text-[9px]` badge, `text-[10px]` label, and `text-base` value.

---

## 3. R3: Admin Featured Products & Deduplication

### 3.1 Admin Featured Products Editor on Home
*   **File Path**: `admin/src/pages/FeaturedProducts.tsx`
*   **Description**: This page manages entries inside the `featured_products` table.
*   **Position Selection Logic**: Lines 113–121, scans for empty positions from 0 to 2:
    ```tsx
    const occupiedPositions = items.map((item) => item.order_position);
    let vacantPosition = 0;
    for (let pos = 0; pos <= 2; pos++) {
      if (!occupiedPositions.includes(pos)) {
        vacantPosition = pos;
        break;
      }
    }
    ```

### 3.2 Deduplication Logic with Active Ads
*   **File Path**: `src/pages/Home.tsx`
*   **Ad campaigns query**: Active 3D carousel ads are queried on lines 286–292:
    ```tsx
    const { data: featData } = await supabase
      .from('ad_campaigns')
      .select('*, product:products(*)')
      .eq('status', 'active')
      .eq('placement', 'featured_3d')
      .limit(3);
    ```
*   **Gallery Assembly & Deduplication Status**: Lines 449–458:
    ```tsx
    const circularGalleryItems = [
      ...featuredAds
        .filter(ad => ad.product && ad.product.status === 'active')
        .map(ad => ({
          ...ad.product,
          isSponsored: true,
          campaignId: ad.id
        })),
      ...products.sort(sortByInterests)
    ].slice(0, 8);
    ```
    *   **Finding**: There is **no deduplication logic** applied. The array is built by spreading `featuredAds` and `products` directly. If a product has an active ad and is also present in the active products list, it will appear twice in the Circular Gallery.
    *   **Correction Proposal**: Filter out products from the organic list whose IDs match active ads before concatenating:
        ```typescript
        const adProductIds = new Set(featuredAds.map(ad => ad.product_id));
        const deduplicatedProducts = products.filter(p => !adProductIds.has(p.id));
        ```

---

## 4. R4: Members Tab Restoration

*   **File Path**: `src/pages/Member.tsx`
*   **Tab Navigation Menu**: Lines 442–460:
    ```tsx
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-1 border border-white/10 mb-3 flex gap-1 overflow-x-auto"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => { ... }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-display text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-all touch-target ${
            currentSection === tab.id
              ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(192,193,255,0.2)]'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </motion.div>
    ```
*   **Configured Classes**:
    *   **Menu Container**: `glass-panel rounded-xl p-1 border border-white/10 mb-3 flex gap-1 overflow-x-auto`
        *   *Spacing*: `gap-1` (space between tabs), `mb-3` (margin bottom)
        *   *Padding*: `p-1`
        *   *Rounding*: `rounded-xl`
    *   **Tab Buttons**: `flex-shrink-0 px-3 py-1.5 rounded-lg font-display text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-all touch-target`
        *   *Padding*: `px-3 py-1.5`
        *   *Rounding*: `rounded-lg`
*   **Configured Sections**:
    *   `inicio`: label `t('member.tabs.home')` -> "Inicio"
    *   `biblioteca`: label `t('member.tabs.library')` -> "Biblioteca"
    *   `compras`: label `t('member.tabs.purchases')` -> "Compras"
    *   `notificacoes`: label `t('member.tabs.notifications')` -> "Notificações"
    *   `recompensas`: label `t('member:rewards').toUpperCase()` -> "RECOMPENSAS"

---

## 5. R5: Scroll-Scrubbing & Preview Crash

### 5.1 Scroll-Scrubbing Mechanism
*   **File Path**: `src/components/ui/ScrollTiedBackground.tsx`
*   **How it Works**:
    *   `handleScroll` (lines 55–59) computes a normalized scroll position `targetProgress`:
        ```typescript
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        targetProgress = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
        ```
    *   `updateScrub` (lines 62–78) runs in a `requestAnimationFrame` loop, applying linear interpolation (LERP) with a 16% speed coefficient (`0.16` frame catch-up) for smooth playback updating:
        ```typescript
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0005) {
          currentProgress += diff * 0.16;
        } else {
          currentProgress = targetProgress;
        }
        const targetTime = currentProgress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.015) {
          video.currentTime = targetTime;
        }
        ```

### 5.2 Presets
*   **File Path**: `src/components/ui/CardFanCarousel.tsx`
*   **Video Files**: The `VIDEO_FILES` array (lines 22–75) defines 52 video assets.
*   **Generated Presets**: Lines 77–95 maps these files to `ThemePreset` items with default settings:
    ```typescript
    config: { videoOpacity: 0.25, overlayOpacity: 0.70, sectionOpacity: 0.10, blurAmount: 8 }
    ```
*   **Standard Presets List**: `THEME_PRESETS` (lines 97–170) combines:
    *   `space_dark` (line 98)
    *   `generatedPresets` (line 106)
    *   Color gradient presets (`color_glacial`, `color_cyber`, `color_aurora`, `color_twilight`, `color_solar`, `color_nordic`, `color_monochrome`).

### 5.3 Background Preview Crash
*   **File Path**: `src/pages/CollaboratorProductForm.tsx`
*   **Location**: Inside the `{showPreview && (...)}` JSX overlay (lines 2607–2682).
*   **Root Cause**: The component references two variables in the JSX mockup that do not exist in the component's scope:
    1.  **`name`** on Line 2643:
        ```tsx
        <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display">
          {name || 'Nome do seu Produto'}
        </h1>
        ```
        *   *Observation*: The state variable in this form is `title`, not `name`.
    2.  **`price`** on Line 2671:
        ```tsx
        <div className="text-3xl font-extrabold text-white font-display">
          {price ? `${price} AOA` : 'Preço do Produto'}
        </div>
        ```
        *   *Observation*: The state variables for price are `priceUSD` and `priceAOA`, not `price`.
    *   **Result**: When `showPreview` is set to `true`, rendering this markup triggers a `ReferenceError` for these variables, causing the entire form interface to crash.
    *   **Correction Proposal**: Change `name` to `title` and `price` to `priceAOA` in `src/pages/CollaboratorProductForm.tsx`.
