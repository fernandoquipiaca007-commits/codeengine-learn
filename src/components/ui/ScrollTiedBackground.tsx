import { useEffect, useRef, useState } from 'react';

interface ScrollTiedBackgroundProps {
  videoPath: string;
  videoOpacity?: number;
  overlayOpacity?: number;
  brightness?: number;
  contrast?: number;
  backgroundStyle?: string;
}

export function ScrollTiedBackground({
  videoPath,
  videoOpacity = 0.25,
  overlayOpacity = 0.7,
  brightness = 1.0,
  contrast = 1.0,
  backgroundStyle,
}: ScrollTiedBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(true);

  // Refs used inside RAF / event listeners — avoids stale closure issues
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const isSeeking = useRef(false);
  const pendingSeek = useRef(false);

  // ── Connection check (skip video on data-saver / 2G connections) ──────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const connection = (navigator as any).connection;
      const isSlow =
        connection &&
        (connection.saveData ||
          ['slow-2g', '2g', '3g'].includes(connection.effectiveType));
      if (isSlow) setShouldLoadVideo(false);
    }
  }, []);

  const isColorTheme = videoPath.startsWith('color:') || !shouldLoadVideo;

  // ── Video loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isColorTheme) {
      setIsLoaded(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    setIsLoaded(false);
    isSeeking.current = false;
    pendingSeek.current = false;
    targetProgressRef.current = 0;
    displayProgressRef.current = 0;
    video.load();

    const onReady = () => setIsLoaded(true);

    if (video.readyState >= 1) {
      setIsLoaded(true);
    }

    video.addEventListener('loadedmetadata', onReady);
    return () => video.removeEventListener('loadedmetadata', onReady);
  }, [videoPath, isColorTheme]);

  // ── Scroll scrubbing engine ───────────────────────────────────────────────
  useEffect(() => {
    if (isColorTheme || !isLoaded) return;
    const video = videoRef.current;
    if (!video) return;

    // Drain any previous RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // --- Helpers ---

    /** Returns the current scroll fraction [0, 1] */
    const getScrollFraction = () => {
      const scrollH =
        document.documentElement.scrollHeight - window.innerHeight;
      return scrollH > 0
        ? Math.max(0, Math.min(1, window.scrollY / scrollH))
        : 0;
    };

    /** Perform a video seek. Handles overlapping seeks with a "pending" flag */
    const seekTo = (fraction: number) => {
      if (!video.duration) return;
      const targetTime = fraction * video.duration;
      if (Math.abs(video.currentTime - targetTime) < 0.008) return; // < 8ms — skip

      if (isSeeking.current) {
        // Another seek is in flight — store the latest target and bail
        pendingSeek.current = true;
        displayProgressRef.current = fraction;
        return;
      }

      isSeeking.current = true;
      displayProgressRef.current = fraction;
      video.currentTime = targetTime;
    };

    // When a seek finishes, immediately apply any pending seek that arrived
    // while the previous one was still in-flight — this keeps the video frame
    // exactly matched to the latest scroll position.
    const onSeeked = () => {
      isSeeking.current = false;
      if (pendingSeek.current) {
        pendingSeek.current = false;
        seekTo(targetProgressRef.current);
      }
    };
    video.addEventListener('seeked', onSeeked);

    // --- Scroll listener: direct, zero-latency seek on every scroll event ---
    const onScroll = () => {
      const fraction = getScrollFraction();
      targetProgressRef.current = fraction;
      // Direct seek — no LERP — gives frame-perfect sync with scroll position
      seekTo(fraction);
    };

    // --- RAF loop: only runs for tiny residual corrections (< 8ms gap) ---
    // This matters when the browser delivers scroll events at a lower rate
    // than the display refresh (e.g. touchpad inertia or passive coalescing).
    const rafLoop = () => {
      if (
        video.readyState >= 2 &&
        video.duration &&
        !isSeeking.current
      ) {
        const target = targetProgressRef.current;
        const diff = target - displayProgressRef.current;

        if (Math.abs(diff) > 0.0002) {
          // Blend remaining gap in a single frame — not LERP chasing across
          // multiple frames. The factor is intentionally high (0.9) so it
          // resolves in ≤ 2 frames with no visible lag.
          const next = displayProgressRef.current + diff * 0.9;
          seekTo(next);
        }
      }
      rafRef.current = requestAnimationFrame(rafLoop);
    };

    // Seed initial position
    const initialFraction = getScrollFraction();
    targetProgressRef.current = initialFraction;
    displayProgressRef.current = initialFraction;
    if (video.readyState >= 2 && video.duration) {
      video.currentTime = initialFraction * video.duration;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(rafLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('seeked', onSeeked);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isLoaded, videoPath, isColorTheme]);

  // Build video CSS filter
  const videoFilter = `brightness(${brightness}) contrast(${contrast})`;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-black">
      {isColorTheme ? (
        <div
          style={{ background: backgroundStyle }}
          className="w-full h-full"
        />
      ) : (
        <video
          ref={videoRef}
          src={`/${videoPath}`}
          preload="auto"
          muted
          playsInline
          webkit-playsinline="true"
          onLoadedMetadata={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? videoOpacity : 0,
            filter: videoFilter,
            willChange: 'opacity',
          }}
          className="w-full h-full object-cover transition-opacity duration-700"
        />
      )}
      {/* Dark gradient mask to ensure text readability */}
      {!isColorTheme && (
        <div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 z-1"
        />
      )}
    </div>
  );
}
