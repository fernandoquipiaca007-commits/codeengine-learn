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

  // Three modes:
  // 1. isNoVideo: videoPath is empty — pure dark bg, no video element at all
  // 2. isColorTheme: videoPath starts with 'color:' — CSS gradient background
  // 3. isVideoTheme: normal 3D video file
  const isNoVideo = !videoPath || videoPath === '';
  const isColorTheme = !isNoVideo && (videoPath.startsWith('color:') || !shouldLoadVideo);
  const isVideoTheme = !isNoVideo && !isColorTheme;

  // ── Video loading ─────────────────────────────────────────────────────────
  const onReady = () => {
    setIsLoaded(true);
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        video.pause();
      }).catch(() => {
        // Autoplay policy blocked — that's fine
      });
    }
  };

  useEffect(() => {
    // Color and empty themes need no video loading
    if (!isVideoTheme) {
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

    // Check if already ready/cached on mount or source change
    if (video.readyState >= 1) {
      onReady();
    }

    // Fallback: force visible after 800ms regardless
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, [videoPath, isVideoTheme]);

  // ── Scroll scrubbing engine ───────────────────────────────────────────────
  useEffect(() => {
    if (!isVideoTheme || !isLoaded) return;
    const video = videoRef.current;
    if (!video) return;

    // Drain any previous RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const pixelsPerSecond = 320; // 1s of video per 320px of scroll for optimal pacing

    const getTargetTime = () => {
      if (!video.duration || isNaN(video.duration)) return 0;
      return Math.max(0, Math.min(video.duration, window.scrollY / pixelsPerSecond));
    };

    let currentProgress = (video.duration && !isNaN(video.duration)) ? getTargetTime() / video.duration : 0;
    let targetProgress = currentProgress;

    // Seed initial position
    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      video.currentTime = currentProgress * video.duration;
    }

    const onScroll = () => {
      if (!video.duration || isNaN(video.duration)) return;
      targetProgress = getTargetTime() / video.duration;
    };

    const rafLoop = () => {
      if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
        // Snappy LERP for buttery-smooth scrubbing
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0002) {
          currentProgress += diff * 0.15;
        } else {
          currentProgress = targetProgress;
        }

        const targetTime = currentProgress * video.duration;

        // Throttle seeks: only seek if diff > 15ms and not already seeking
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
  }, [isLoaded, videoPath, isVideoTheme]);

  // Build video CSS filter
  const videoFilter = `brightness(${brightness}) contrast(${contrast})`;

  // Fallback gradient if color theme background is missing or if connection is slow
  const resolvedBackgroundStyle = backgroundStyle || 'linear-gradient(135deg, #09090b 0%, #020205 100%)';

  const resolvedVideoSrc = videoPath.startsWith('http') ? videoPath : (videoPath.startsWith('/') ? videoPath : `/${videoPath}`);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-black">
      {isColorTheme ? (
        /* Gradient/color background */
        <div
          style={{ background: resolvedBackgroundStyle }}
          className="w-full h-full"
        />
      ) : isVideoTheme ? (
        /* 3D video background */
        <video
          ref={videoRef}
          src={resolvedVideoSrc}
          preload="auto"
          muted
          playsInline
          onLoadedMetadata={onReady}
          onCanPlay={onReady}
          style={{
            opacity: isLoaded ? videoOpacity : 0,
            filter: videoFilter,
            willChange: 'opacity',
            transition: 'opacity 0.6s ease',
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Pure dark (empty videoPath) — just the black bg from the parent div */
        null
      )}

      {/* Dark gradient overlay for text readability (not on color themes which manage their own contrast) */}
      {isVideoTheme && (
        <div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 z-1"
        />
      )}
    </div>
  );
}
