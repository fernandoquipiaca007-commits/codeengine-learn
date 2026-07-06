import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function Stars(props: any) {
  const ref = useRef<any>(null);
  
  // Generate random particles within a sphere (memoized to avoid regeneration)
  const positions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const connection = typeof navigator !== 'undefined' && (navigator as any).connection;
    const isSlow = connection && (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType));
    
    const count = isSlow ? 300 : (isMobile ? 800 : 2500);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      pos[i * 3 + 2] = r * Math.cos(phi); // z
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });
  
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#c0c1ff" size={0.005} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

export function Background3D({ isImmersive = false }: { isImmersive?: boolean }) {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    // 1. Check for reduced motion
    const mediaReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      if (mediaReducedMotion.matches) {
        setIsLowPowerMode(true);
      }
    };
    updateMotion();
    mediaReducedMotion.addEventListener('change', updateMotion);

    // 2. WebGL Support Check
    try {
      const canvas = document.createElement('canvas');
      const supportsWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      if (!supportsWebGL) {
        setIsLowPowerMode(true);
      }
    } catch (e) {
      setIsLowPowerMode(true);
    }

    return () => {
      mediaReducedMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const isMobile = window.innerWidth < 768;
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType));
    return (isMobile || isSlowConnection) ? 1 : 1.5;
  }, []);

  const shouldRenderCanvas = !isLowPowerMode && !isImmersive && isTabVisible;

  return (
    <div className="fixed inset-0 z-[-10] bg-background pointer-events-none">
      {/* Ambient background lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] opacity-50"></div>
      
      {shouldRenderCanvas && (
        <Canvas camera={{ position: [0, 0, 1] }} dpr={dpr}>
          <Stars />
        </Canvas>
      )}
    </div>
  );
}
