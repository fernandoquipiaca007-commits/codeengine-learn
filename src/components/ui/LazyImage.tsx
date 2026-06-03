import { useState, useCallback, memo } from 'react';

// ─── LazyImage ────────────────────────────────────────────────────────────────
// Drop-in replacement for <img> with:
//   • loading="lazy" — browser defers off-screen image fetches
//   • decoding="async" — keeps main thread free during image decode
//   • Graceful fallback on error
//   • Blur-up loading animation for premium feel
// ─────────────────────────────────────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Fallback src shown when the primary src fails to load */
  fallback?: string;
  /** Width attribute for layout hints */
  width?: number | string;
  /** Height attribute for layout hints */
  height?: number | string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  fallback,
  width,
  height,
  style,
  onClick,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);

  const handleRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete) {
      setLoaded(true);
    }
  }, []);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (fallback && !errored) {
        setErrored(true);
        e.currentTarget.src = fallback;
      }
    },
    [fallback, errored]
  );

  return (
    <img
      ref={handleRef}
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      style={style}
      onClick={onClick}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
});

// ─── LazyImageWithSkeleton ────────────────────────────────────────────────────
// Like LazyImage but shows a shimmer skeleton while loading.
// Use this for product cards, thumbnails, and hero images.
// ─────────────────────────────────────────────────────────────────────────────

interface LazyImageWithSkeletonProps extends LazyImageProps {
  /** Aspect ratio CSS class (e.g. "aspect-video", "aspect-square") */
  aspectClass?: string;
}

export const LazyImageWithSkeleton = memo(function LazyImageWithSkeleton({
  aspectClass = 'aspect-video',
  className = '',
  ...props
}: LazyImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);

  const handleRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete) {
      setLoaded(true);
    }
  }, []);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (props.fallback && !errored) {
        setErrored(true);
        e.currentTarget.src = props.fallback;
      } else {
        setLoaded(true); // Hide skeleton even on final error
      }
    },
    [props.fallback, errored]
  );

  return (
    <div className={`relative overflow-hidden ${aspectClass}`}>
      {/* Shimmer skeleton shown while image is loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
      )}
      <img
        {...props}
        ref={handleRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});
