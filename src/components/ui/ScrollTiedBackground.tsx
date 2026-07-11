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
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);

    // Fallback timer: force isLoaded after 1 second to guarantee visibility
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
      clearTimeout(timer);
    };
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

    const pixelsPerSecond = 320; // 1s of video per 320px of scroll for optimal pacing

    const getTargetTime = () => {
      if (!video.duration) return 0;
      // absolute scroll position mapped to video duration
      return Math.max(0, Math.min(video.duration, window.scrollY / pixelsPerSecond));
    };

    let currentProgress = getTargetTime() / (video.duration || 1);
    let targetProgress = currentProgress;

    // Seed initial position
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = currentProgress * video.duration;
    }

    const onScroll = () => {
      if (!video.duration) return;
      targetProgress = getTargetTime() / video.duration;
    };

    const rafLoop = () => {
      if (video.readyState >= 1 && video.duration) {
        // Snappy LERP (Linear Interpolation) for buttery-smooth transition
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0002) {
          currentProgress += diff * 0.15; // 15% catch-up speed per frame
        } else {
          currentProgress = targetProgress; // Snap to target when close
        }

        const targetTime = currentProgress * video.duration;

        // Prevent decoder overloading: only seek if the target time differs by
        // more than 15ms (1 frame) and if the video is not already seeking.
        if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.015) {
          video.currentTime = targetTime;
        }
      }
      rafRef.current = requestAnimationFrame(rafLoop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(rafLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
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
