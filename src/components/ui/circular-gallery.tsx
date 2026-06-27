import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { getProductCoverUrl } from '../../lib/storage-path';
import { LocalizedProduct } from '../../hooks/useLocalizedProduct';
import { LazyImage } from './LazyImage';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: LocalizedProduct[];
  radius?: number;
  autoRotateSpeed?: number;
  isAngola?: boolean;
  activeLang?: string;
  onProductClick?: (productId: string) => void;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.012, isAngola = false, activeLang = 'pt', onProductClick, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startRotationRef = useRef(0);
    const dragDistanceRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    // Mouse and Touch Interaction Handlers for Drag-to-Rotate
    const handleMouseDown = (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startRotationRef.current = rotation;
      dragDistanceRef.current = 0;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      dragDistanceRef.current = Math.abs(deltaX);
      setRotation(startRotationRef.current + deltaX * 0.15);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
      startRotationRef.current = rotation;
      dragDistanceRef.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      dragDistanceRef.current = Math.abs(deltaX);
      setRotation(startRotationRef.current + deltaX * 0.15);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Effect for auto-rotation when not interacting
    useEffect(() => {
      const autoRotate = () => {
        if (!isDraggingRef.current) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [autoRotateSpeed]);

    if (!items || items.length === 0) return null;

    const anglePerItem = 360 / items.length;

    // Handle navigation click without triggering on drag release
    const handleCardClick = (productId: string) => {
      if (dragDistanceRef.current > 6) {
        return;
      }
      if (onProductClick) {
        onProductClick(productId);
      }
    };
    
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none",
          className
        )}
        style={{ perspective: '2000px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((product, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            
            const opacity = normalizedAngle > 90 
              ? Math.max(0, 1 - ((normalizedAngle - 90) / 45)) 
              : 1;

            return (
              <div
                key={product.id} 
                role="group"
                aria-label={product.title}
                className={cn(
                  "absolute w-[280px] h-[370px] transition-opacity duration-300",
                  opacity === 0 ? "pointer-events-none" : "pointer-events-auto"
                )}
                onClick={() => handleCardClick(product.id)}
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-140px',
                  marginTop: '-185px',
                  opacity: opacity,
                }}
              >
                {/* Full cover card layout - image is completely visible and separate from text */}
                <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/5 bg-[#111115]/85 hover:bg-[#111115]/95 backdrop-blur-md flex flex-col p-2.5 group transition-all duration-300 hover:border-primary/20">
                  
                  {/* Image container occupying the upper area - using object-contain to never crop */}
                  <div className="w-full flex-grow relative overflow-hidden bg-black/40 rounded-xl flex items-center justify-center min-h-[220px]">
                    <LazyImage
                      src={getProductCoverUrl(product)}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                      fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                    />
                  </div>
                  
                  {/* Text section below the image, not overlaying it */}
                  <div className="pt-3 px-1 text-white flex flex-col items-start gap-1 flex-shrink-0">
                    {product.product_type && (
                      <span className="bg-primary/20 border border-primary/30 text-white px-2 py-0.5 rounded-full font-display text-[9px] font-bold tracking-widest uppercase mb-0.5">
                        {product.product_type === 'course' ? 'Curso' : 'Ebook'}
                      </span>
                    )}
                    <h3 className="font-display text-sm font-extrabold leading-tight text-white line-clamp-1 w-full text-left group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="font-sans text-[10px] text-white/70 line-clamp-1 w-full text-left">
                      {product.description}
                    </p>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
