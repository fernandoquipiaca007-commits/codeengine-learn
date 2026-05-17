import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function Stars(props: any) {
  const ref = useRef<any>(null);
  
  // Generate random particles within a sphere (memoized to avoid regeneration)
  const positions = useMemo(() => {
    const pos = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
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

export function Background3D() {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    const mediaMobile = window.matchMedia('(max-width: 768px)');
    const mediaReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => setIsLowPowerMode(mediaMobile.matches || mediaReducedMotion.matches);
    update();

    mediaMobile.addEventListener('change', update);
    mediaReducedMotion.addEventListener('change', update);
    return () => {
      mediaMobile.removeEventListener('change', update);
      mediaReducedMotion.removeEventListener('change', update);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-10] bg-background pointer-events-none">
      {/* Ambient background lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] opacity-50"></div>
      
      {!isLowPowerMode && (
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Stars />
        </Canvas>
      )}
    </div>
  );
}
