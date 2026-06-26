import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { getProductCoverUrl } from '../../lib/storage-path';
import { LocalizedProduct } from '../../hooks/useLocalizedProduct';
import { LazyImage } from './LazyImage';
import { ArrowRight } from 'lucide-react';

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
  ({ items, className, radius = 600, autoRotateSpeed = 0.015, isAngola = false, activeLang = 'pt', onProductClick, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Effect to handle scroll-based rotation
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        const scrollRotation = scrollProgress * 360;
        setRotation(scrollRotation);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Effect for auto-rotation when not scrolling
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
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
    }, [isScrolling, autoRotateSpeed]);

    if (!items || items.length === 0) return null;

    const anglePerItem = 360 / items.length;
    
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center select-none", className)}
        style={{ perspective: '2000px' }}
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
            
            // Cards on the back side fade out completely to keep screen clean and clear
            const opacity = normalizedAngle > 90 
              ? Math.max(0, 1 - ((normalizedAngle - 90) / 45)) 
              : 1;

            const formatPrice = (p: LocalizedProduct) => {
              if (p.is_free) return activeLang === 'pt' ? 'Livre' : activeLang === 'fr' ? 'Gratuit' : 'Free';
              if (isAngola) {
                const priceVal = p.aoa_price || (p as any).aoaPrice || Math.round(p.price * 920);
                return `Kz ${Number(priceVal).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`;
              }
              return `$${p.price}`;
            };

            return (
              <div
                key={product.id} 
                role="group"
                aria-label={product.title}
                className={cn(
                  "absolute w-[280px] h-[365px] transition-opacity duration-300",
                  opacity === 0 ? "pointer-events-none" : "pointer-events-auto"
                )}
                onClick={() => onProductClick && onProductClick(product.id)}
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-140px',
                  marginTop: '-182px',
                  opacity: opacity,
                  cursor: 'pointer'
                }}
              >
                <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/5 bg-[#111115]/85 hover:bg-[#111115]/95 backdrop-blur-md flex flex-col p-2.5 group transition-all duration-300 hover:border-primary/20">
                  
                  {/* Glowing background card element */}
                  <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.04)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                  {/* Image */}
                  <div className="aspect-[4/3] rounded-xl overflow-hidden relative bg-surface-highest mb-3">
                    <LazyImage
                      src={getProductCoverUrl(product)}
                      alt={product.title}
                      className="object-cover w-full h-full"
                      fallback={`https://placeholder.co/400x300/1a1a2e/c0c1ff?text=${encodeURIComponent(product.title?.charAt(0) || 'P')}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-transparent to-transparent" />
                    
                    {product.product_type && (
                      <span className="absolute top-2.5 right-2.5 bg-surface/80 backdrop-blur-md border border-white/10 text-white px-2.5 py-0.5 rounded-full font-display text-[9px] font-bold tracking-widest uppercase shadow">
                        {product.product_type === 'course' ? 'Curso' : 'Ebook'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-sm font-bold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="font-mono text-xs font-semibold text-primary drop-shadow-[0_0_6px_rgba(192,193,255,0.15)]">
                        {formatPrice(product)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white flex items-center gap-1 font-display transition-colors">
                        Detalhes
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
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
