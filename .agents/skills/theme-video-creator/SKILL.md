---
name: theme-video-creator
description: Specialized agent skill to create, configure, and manage dynamic scroll-tied background video themes (scroll-scrubbing choreography) for product pages.
---

# Specialized Agent Skill: Scroll-Tied Theme Video Creator

You are an AI agent specialized in designing, configuring, and deploying dynamic scroll-tied background video animations for products. Follow these instructions whenever the user uploads a background video or requests adjustments to page themes.

---

## 1. Database Schema Reference
All theme details are stored in the `public.products` table:
* `theme_video_path` (TEXT): Virtual path to the background video file (e.g., `temas/video.mp4`).
* `theme_video_config` (JSONB): Parameters for rendering:
  - `videoOpacity` (number): Opacity of the background video element (0.05 to 1.0).
  - `overlayOpacity` (number): Opacity of the black gradient overlay mask (0 to 1.0).
  - `sectionOpacity` (number): Background opacity parameter for glassmorphism panels (0.02 to 0.50).
  - `blurAmount` (number): Backdrop blur filter radius in pixels (0px to 24px).

---

## 2. Dynamic Scroll-Scrubbing Technique
To bind video playback to scroll position smoothly at 60fps:
1. **Linear Interpolation (LERP):** Never set `video.currentTime` directly on scroll events.
2. **Animation Loop:** Use `requestAnimationFrame` to interpolate current scroll progress towards the target scroll position progress:
   ```typescript
   const targetProgress = scrollTop / scrollHeight;
   const diff = targetProgress - currentProgress;
   currentProgress += diff * 0.045; // Soft cinematic easing factor (4.5% catch-up per frame)
   video.currentTime = currentProgress * video.duration;
   ```
3. **Avoid LoadedMetadata Race Conditions:** Set `onLoadedMetadata` directly on the `<video>` element and check `video.readyState >= 1` in `useEffect` on mount.

---

## 3. UI Styling (Glassmorphism Integration)
Ensure all UI panels on top of the background video remain readable and clean:
1. Use relative z-index containers (`relative z-10`) on top of the background wrapper (`fixed inset-0 z-0`).
2. Implement CSS variables on the root page wrapper container:
   ```html
   <div style={{
     '--glass-opacity': config.sectionOpacity,
     '--glass-blur': `${config.blurAmount}px`
   }}>
   ```
3. Overwrite `.glass-panel` background and backdrop filter using these variables:
   ```css
   .glass-panel {
     background: linear-gradient(135deg, rgba(16, 16, 22, var(--glass-opacity)) 0%, rgba(9, 9, 13, var(--glass-opacity)) 100%);
     backdrop-filter: blur(var(--glass-blur));
   }
   ```

---

## 4. Solid/Gradient Color Themes & Adaptivity
To configure a color theme instead of a video theme:
1. Set `theme_video_path` starting with `"color:"` (e.g. `color:white` or `color:glacial`).
2. Add the following parameters in `theme_video_config`:
   - `backgroundStyle` (string): CSS gradient or solid color property (e.g. `linear-gradient(...)`).
   - `textColor` (string): Primary text color override.
   - `accentColor` (string): Accent color override.
   - `isLight` (boolean): `true` if it is a light mode theme.
3. **Light Mode CSS Override:** Toggle the `.light-theme-page` class on the page root. This overrides surface text, labels, and borders to slate-900 / slate-700 colors, and turns glassmorphism panels white-translucent:
   ```css
   .light-theme-page { color: #0f172a !important; }
   .light-theme-page .glass-panel {
     background: rgba(255, 255, 255, var(--glass-opacity, 0.75)) !important;
     border: 1px solid rgba(15, 23, 42, 0.08) !important;
   }
   ```

---

## 5. Asset Sanitization Rules
When adding new video files under `public/temas/`, always rename them to avoid URL/routing issues on production servers:
1. **No spaces or parentheses:** Convert spaces, dashes, and parentheses to single underscores (`_`).
2. **No ellipses or Unicode symbols:** Eliminate three-dot ellipsis characters (`…`) completely.
3. **Regex constraint:** Filenames must consist only of `/^[a-zA-Z0-9_]+\.mp4$/`.

---

## 6. Autoplay Video Covers on Hover
To showcase the actual background animations directly inside the selector carousel:
1. **Video Elements:** Replace static image covers with real `<video>` elements set to `preload="metadata"`, `muted`, `loop`, and `playsInline`.
2. **Hover Handlers:** Attach mouseenter and mouseleave listeners to trigger playback on target elements:
   ```typescript
   const handleVideoHover = (e: React.MouseEvent<HTMLDivElement>, play: boolean) => {
     const video = e.currentTarget.querySelector('video');
     if (video) {
       if (play) video.play().catch(() => {});
       else {
         video.pause();
         video.currentTime = 0;
       }
     }
   };
   ```

---

## 7. Full-Screen Live Mockup Preview
To offer collaborators instant preview feedback:
1. **Live Preview Overlay:** Render a full-screen scrollable wrapper (`fixed inset-0 z-50 overflow-y-auto`) over the form.
2. **Mockup Content:** Mount the `<ScrollTiedBackground>` component and display mock cards for the product header, curriculum, and pricing, reflecting the current opacity and blur properties in real-time.
3. **Back Navigation:** Add a prominent "Voltar às Configurações" button to close the overlay and return to editing.


