import { useEffect, useRef, useState } from 'react';

interface ScrollTiedBackgroundProps {
  videoPath: string;
}

export function ScrollTiedBackground({ videoPath }: ScrollTiedBackgroundProps) {
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

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
      
      if (video.duration) {
        targetTimeRef.current = progress * video.duration;
      }
    };

    // Smooth LERP (Linear Interpolation) loop for 60fps scrubbing
    const updateScrub = () => {
      if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        const target = targetTimeRef.current;
        const current = video.currentTime;
        
        // Easing interpolation: LERP towards target time
        const diff = target - current;
        if (Math.abs(diff) > 0.01) {
          // Adjust 0.1 for faster/slower scroll responsiveness
          video.currentTime = current + diff * 0.1;
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
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? 'opacity-[0.25]' : 'opacity-0'
        }`}
      />
      {/* Dark gradient mask to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 z-1" />
    </div>
  );
}
