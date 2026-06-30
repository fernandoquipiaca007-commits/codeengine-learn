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
  const requestRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (videoPath.startsWith('color:')) {
      setIsLoaded(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    // Reset loading state on path change
    setIsLoaded(false);
    video.load();

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
    };

    // If metadata is already loaded (common on cached files)
    if (video.readyState >= 1) {
      setIsLoaded(true);
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoPath]);

  useEffect(() => {
    if (videoPath.startsWith('color:')) return;
    const video = videoRef.current;
    if (!video) return;

    let targetProgress = 0;
    let currentProgress = 0;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
    };

    // Smooth LERP (Linear Interpolation) loop for 60fps scrubbing
    const updateScrub = () => {
      if (video && video.readyState >= 2 && video.duration) {
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0005) {
          currentProgress += diff * 0.16; // Snappy, responsive catch-up (16% per frame)
        } else {
          currentProgress = targetProgress; // Snap to target when extremely close
        }

        const targetTime = currentProgress * video.duration;
        // Only seek if target time differs by more than 15ms (approx. 1/60s frame duration)
        if (Math.abs(video.currentTime - targetTime) > 0.015) {
          video.currentTime = targetTime;
        }
      }
      requestRef.current = requestAnimationFrame(updateScrub);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    requestRef.current = requestAnimationFrame(updateScrub);

    // Initial calculation
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isLoaded, videoPath]);

  const isColorTheme = videoPath.startsWith('color:');

  // Build video CSS filter from brightness & contrast
  const videoFilter = `brightness(${brightness}) contrast(${contrast})`;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-black">
      {isColorTheme ? (
        <div
          style={{ background: backgroundStyle }}
          className="w-full h-full"
        />
      ) : (
        /* Background Video */
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
