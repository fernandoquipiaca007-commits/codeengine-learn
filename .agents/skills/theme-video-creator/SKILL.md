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
