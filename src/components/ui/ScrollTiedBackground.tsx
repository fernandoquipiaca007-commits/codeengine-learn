import { useEffect, useRef, useState } from 'react';

interface ScrollTiedBackgroundProps {
  videoPath: string;
  videoOpacity?: number;
  overlayOpacity?: number;
}

export function ScrollTiedBackground({ 
  videoPath,
  videoOpacity = 0.25,
  overlayOpacity = 0.7
}: ScrollTiedBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
        // Interpolate progress towards target progress with a soft cinematic easing factor (0.045)
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0001) {
          currentProgress += diff * 0.045;
          video.currentTime = currentProgress * video.duration;
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
  }, [isLoaded]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-black">
      {/* Background Video */}
      <video
        ref={videoRef}
        src={`/${videoPath}`}
        preload="auto"
        muted
        playsInline
        webkit-playsinline="true"
        onLoadedMetadata={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? videoOpacity : 0 }}
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      {/* Dark gradient mask to ensure text readability */}
      <div 
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 z-1" 
      />
    </div>
  );
}
