import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 90;

export function DynamicFitnessBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(1);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Preload images once when component mounts
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        setImagesLoaded(true);
      }
    };

    const handleImageError = (e: any) => {
      console.warn('Failed to load frame:', e?.target?.src);
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        setImagesLoaded(true);
      }
    };

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      img.src = `/fitness-frames/frame_${frameNum}.webp`;
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      loadedImages.push(img);
    }
    
    imagesRef.current = loadedImages;

    return () => {
      loadedImages.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Set up ScrollTrigger and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const renderFrame = (frameIndex: number) => {
      const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(frameIndex)));
      const img = imagesRef.current[idx];
      
      if (img && img.complete && img.naturalWidth > 0) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth = canvasWidth;
        let drawHeight = canvasHeight;
        let drawX = 0;
        let drawY = 0;
        
        if (canvasRatio > imgRatio) {
          drawHeight = canvasWidth / imgRatio;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawWidth = canvasHeight * imgRatio;
          drawX = (canvasWidth - drawWidth) / 2;
        }
        
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        setCurrentFrameIndex(idx + 1);
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (tweenRef.current) {
        renderFrame((tweenRef.current.targets()[0] as any).frame);
      } else {
        renderFrame(0);
      }
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Render first frame immediately if loaded
    if (imagesRef.current[0]) {
      if (imagesRef.current[0].complete) {
        renderFrame(0);
      } else {
        imagesRef.current[0].onload = () => renderFrame(0);
      }
    }

    const currentFrameObj = { frame: 0 };
    
    // GSAP ScrollTrigger to interpolate the frame property based on scroll position
    tweenRef.current = gsap.to(currentFrameObj, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.1,
      },
      onUpdate: () => {
        renderFrame(currentFrameObj.frame);
      }
    });

    window.addEventListener('resize', resizeCanvas);

    // Refresh scroll trigger to make sure it calculates heights correctly
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (tweenRef.current) {
        if (tweenRef.current.scrollTrigger) {
          tweenRef.current.scrollTrigger.kill();
        }
        tweenRef.current.kill();
      }
    };
  }, [imagesLoaded]);

  const fallbackSrc = `/fitness-frames/frame_${String(currentFrameIndex).padStart(4, '0')}.webp`;

  return (
    <>
      {/* BACKGROUND LAYER */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: -10,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      />

      {/* FALLBACK/LOADER IMAGE */}
      {!imagesLoaded && (
        <img
          src={fallbackSrc}
          alt="Fitness Background Loading"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: -9,
            pointerEvents: 'none',
            overflow: 'hidden',
            objectFit: 'cover',
          }}
        />
      )}

      {/* OVERLAY LAYER */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -5,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)',
        }}
      />
    </>
  );
}
