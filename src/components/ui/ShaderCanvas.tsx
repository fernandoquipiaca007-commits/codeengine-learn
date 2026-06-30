import React, { useRef, useEffect, memo } from 'react';
import * as THREE from 'three';

// --- GLSL Shaders ---
const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_glitch_intensity;
  uniform float u_rgb_shift;
  uniform float u_scanline_density;
  uniform float u_scanline_opacity;
  uniform vec3 u_base_color;

  float random(vec2 p) {
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  float noise(float p) {
    return random(vec2(p, p * 2.0));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Glitch effect
    float glitch_time = floor(u_time * 10.0);
    float glitch_amount = noise(glitch_time) * u_glitch_intensity * 0.1;
    
    if (fract(uv.y * 10.0 + noise(glitch_time) * 100.0) > 0.95) {
      uv.x += glitch_amount * (random(vec2(uv.y, glitch_time)) - 0.5) * 2.0;
    }
    
    // RGB shift
    float shift = u_rgb_shift * 0.005;
    float r = random(uv + vec2(u_time * 0.1, 0.0) + vec2(shift, 0.0)) * 0.03;
    float g = random(uv + vec2(0.0, u_time * 0.1)) * 0.03;
    float b = random(uv + vec2(-shift, u_time * 0.1)) * 0.03;
    
    vec3 color = u_base_color * vec3(r, g, b) * 15.0;
    
    // Scanlines
    float scanline = sin(uv.y * u_scanline_density * 3.14159) * 0.5 + 0.5;
    color *= 1.0 - (scanline * u_scanline_opacity * 0.3);
    
    // Vignette for depth
    vec2 center_uv = uv - 0.5;
    float vignette = 1.0 - dot(center_uv, center_uv) * 1.2;
    color *= max(0.0, vignette);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface ShaderConfig {
  glitchIntensity: number;   // 0..1
  rgbShift: number;          // 0..1
  scanlineDensity: number;   // 10..200
  scanlineOpacity: number;   // 0..1
  baseColor: [number, number, number]; // r,g,b 0..1
}

interface ShaderCanvasProps {
  config: ShaderConfig;
  className?: string;
  style?: React.CSSProperties;
}

export const DEFAULT_SHADER_CONFIG: ShaderConfig = {
  glitchIntensity: 0.35,
  rgbShift: 0.4,
  scanlineDensity: 80,
  scanlineOpacity: 0.6,
  baseColor: [0.58, 0.60, 1.0], // ~primary #94a3b8 / #c0c1ff
};

export const ShaderCanvas = memo(function ShaderCanvas({ config, className = '', style }: ShaderCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth || 800, el.clientHeight || 600);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(el.clientWidth || 800, el.clientHeight || 600) },
        u_time: { value: 0.0 },
        u_glitch_intensity: { value: config.glitchIntensity },
        u_rgb_shift: { value: config.rgbShift },
        u_scanline_density: { value: config.scanlineDensity },
        u_scanline_opacity: { value: config.scanlineOpacity },
        u_base_color: { value: new THREE.Vector3(...config.baseColor) },
      },
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      if (!el || !renderer) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.u_resolution.value.set(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);

    let running = true;
    const animate = () => {
      if (!running) return;
      frameRef.current = requestAnimationFrame(animate);
      material.uniforms.u_time.value = (Date.now() - startTimeRef.current) / 1000;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update uniforms reactively without re-mounting
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.u_glitch_intensity.value = config.glitchIntensity;
    mat.uniforms.u_rgb_shift.value = config.rgbShift;
    mat.uniforms.u_scanline_density.value = config.scanlineDensity;
    mat.uniforms.u_scanline_opacity.value = config.scanlineOpacity;
    mat.uniforms.u_base_color.value.set(...config.baseColor);
  }, [config]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full ${className}`}
      style={{ overflow: 'hidden', ...style }}
    />
  );
});
