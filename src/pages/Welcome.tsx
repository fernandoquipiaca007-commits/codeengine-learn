import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles, Brain, Code2, Zap, Plug, Cpu, Layout, BookOpen, Cloud } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

/* -----------------------------------------------------------------------------
 * TECH/AI/LEARNING KNOWLEDGE TOPICS
 * Translated topics that loop continuously in the marquee
 * -------------------------------------------------------------------------- */

const getTopics = (lang: string) => {
  const topics = {
    pt: [
      { text: "Inteligência Artificial", icon: Brain },
      { text: "Desenvolvimento Fullstack", icon: Code2 },
      { text: "Infraestrutura SaaS", icon: Zap },
      { text: "Automação de APIs", icon: Plug },
      { text: "Machine Learning", icon: Cpu },
      { text: "Design de Interface Premium", icon: Layout },
      { text: "Cursos & E-books Exclusivos", icon: BookOpen },
      { text: "Arquitetura Cloud", icon: Cloud }
    ],
    fr: [
      { text: "Intelligence Artificielle", icon: Brain },
      { text: "Développement Fullstack", icon: Code2 },
      { text: "Infrastructure SaaS", icon: Zap },
      { text: "Automatisation d'APIs", icon: Plug },
      { text: "Machine Learning", icon: Cpu },
      { text: "Design d'Interface Premium", icon: Layout },
      { text: "Cours & E-books Exclusifs", icon: BookOpen },
      { text: "Architecture Cloud", icon: Cloud }
    ],
    en: [
      { text: "Artificial Intelligence", icon: Brain },
      { text: "Fullstack Development", icon: Code2 },
      { text: "SaaS Infrastructure", icon: Zap },
      { text: "API Automation", icon: Plug },
      { text: "Machine Learning", icon: Cpu },
      { text: "Premium Interface Design", icon: Layout },
      { text: "Exclusive Courses & E-books", icon: BookOpen },
      { text: "Cloud Architecture", icon: Cloud }
    ]
  };
  const currentLang = lang.startsWith('pt') ? 'pt' : lang.startsWith('fr') ? 'fr' : 'en';
  return topics[currentLang];
};

/* -----------------------------------------------------------------------------
 * CANVAS STAGGERED PHYSICS ENGINE
 * Calibrated outward expansion ripple: extremely smooth and slightly relaxed 
 * to feel cohesive, satisfyingly responsive, and visually distinct.
 * -------------------------------------------------------------------------- */

type Pixel = {
  x: number;
  y: number;
  color: string;
  ctx: CanvasRenderingContext2D;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInt: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;
  draw: () => void;
  appear: () => void;
  disappear: () => void;
  shimmer: () => void;
};

function createPixel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  color: string,
  baseSpeed: number,
  delay: number
): Pixel {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  const p: Pixel = {
    x, y, color, ctx,
    speed: rand(0.08, 0.4) * baseSpeed,
    size: 0,
    sizeStep: rand(0.12, 0.28),
    minSize: 0.5,
    maxSizeInt: 2,
    maxSize: rand(0.5, 2),
    delay,
    counter: 0,
    counterStep: rand(1.8, 3.2) + (canvas.width + canvas.height) * 0.008,
    isIdle: false,
    isReverse: false,
    isShimmer: false,
    draw() {
      const offset = p.maxSizeInt * 0.5 - p.size * 0.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
    },
    appear() {
      p.isIdle = false;
      if (p.counter <= p.delay) {
        p.counter += p.counterStep;
        return;
      }
      if (p.size >= p.maxSize) p.isShimmer = true;
      if (p.isShimmer) p.shimmer();
      else p.size += p.sizeStep;
      p.draw();
    },
    disappear() {
      p.isShimmer = false;
      p.counter = 0;
      if (p.size <= 0) {
        p.isIdle = true;
        return;
      }
      p.size -= 0.1;
      p.draw();
    },
    shimmer() {
      if (p.size >= p.maxSize) p.isReverse = true;
      else if (p.size <= p.minSize) p.isReverse = false;
      if (p.isReverse) p.size -= p.speed;
      else p.size += p.speed;
    },
  };

  return p;
}

type PixelCanvasProps = {
  colors: string[];
  gap?: number;
  speed?: number;
};

function PixelCanvas({ colors, gap = 5, speed = 30 }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const effectiveSpeed = reducedMotionRef.current ? 0 : Math.min(speed, 100) * 0.001;
    const pixels: Pixel[] = [];

    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2;
        const dy = y - h / 2;
        const delay = reducedMotionRef.current ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.65;
        pixels.push(createPixel(ctx, canvas, x, y, color, effectiveSpeed, delay));
      }
    }

    pixelsRef.current = pixels;
  }, [colors, gap, speed]);

  const animate = useCallback((mode: "appear" | "disappear") => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;

    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);

      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      for (const pixel of pixels) pixel[mode]();

      if (pixels.every((p) => p.isIdle)) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    init();

    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    animate("appear");

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * SILENT PRECISION BACKGROUND COMPONENT
 * Implements a deep black base, the PixelCanvas staggered loading dot grid,
 * and soft ambient blur blooms.
 * -------------------------------------------------------------------------- */

export function SilentPrecisionBackground({ colors }: { colors: string[] }) {
  return (
    <div className="absolute inset-0 z-0 bg-[#050505] overflow-hidden pointer-events-none select-none">
      {/* Dense micro-dot grid pattern with outward expansion ripple */}
      {colors.length > 0 && <PixelCanvas colors={colors} gap={6} speed={30} />}

      {/* Radial gradient overlay to fade edges smoothly */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-85 pointer-events-none" />

      {/* Ambient Blur/Light Blooms */}
      {/* Bloom 1 (top left) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[130px] mix-blend-screen opacity-40 pointer-events-none" />
      {/* Bloom 2 (bottom right) */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/3 blur-[150px] mix-blend-screen opacity-30 pointer-events-none" />
      {/* Bloom 3 (center subtle ambient light) */}
      <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] rounded-full bg-white/1 blur-[160px] mix-blend-screen opacity-20 pointer-events-none" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * MAIN WELCOME COMPONENT
 * -------------------------------------------------------------------------- */

interface WelcomeProps {
  setScreen: (s: string) => void;
  onProductClick?: (productId: string) => void;
}

export function Welcome({ setScreen }: WelcomeProps) {
  const { t, i18n } = useTranslation('common');
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeColors, setThemeColors] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    if (typeof document === "undefined") return;

    const div = document.createElement("div");
    document.body.appendChild(div);
    div.className = "text-muted-foreground";
    let muted = getComputedStyle(div).color;
    if (!muted || muted === 'rgba(0, 0, 0, 0)') {
      muted = 'rgba(255, 255, 255, 0.4)';
    }

    div.className = "text-primary";
    let primary = getComputedStyle(div).color;
    if (!primary || primary === 'rgba(0, 0, 0, 0)') {
      primary = 'rgba(192, 193, 255, 1)';
    }
    document.body.removeChild(div);
    
    setThemeColors([muted, muted, muted, muted, primary]);

    const loadTimer = setTimeout(() => setIsLoaded(true), 50);
    return () => {
      clearTimeout(loadTimer);
      subscription.unsubscribe();
    };
  }, []);

  const word1 = t('home.pixelWord1', { defaultValue: 'Welcome to' });
  const word2 = t('home.pixelWord2', { defaultValue: 'CodeEngine.' });
  const subtitle = t('home.pixelSubtitle', { defaultValue: 'A sua evolução começa no momento em que o conhecimento certo encontra a execução certa.' });
  const description = t('home.pixelDesc', { defaultValue: 'Explore cursos, e-books, ferramentas e IA projetados para transformar aprendizado em resultados reais.' });
  const primaryCta = t('home.pixelCta', { defaultValue: 'Explore' });
  const secondaryCta = t('home.pixelGithub', { defaultValue: 'Get Started' });

  const handleSecondaryCtaClick = () => {
    if (isLoggedIn) {
      setScreen('home'); // Send directly to home if logged in
    } else {
      setScreen('auth');
    }
  };

  const topics = getTopics(i18n.language);
  const marqueeLabel = i18n.language.startsWith('pt') 
    ? "Áreas de Conhecimento" 
    : i18n.language.startsWith('fr') 
      ? "Domaines de Compétences" 
      : "Core Knowledge Areas";

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden select-none isolate">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .tahoe-glass-text {
            color: transparent;
            background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.4) 25%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.9) 55%, rgba(255, 255, 255, 0.2) 75%, rgba(255, 255, 255, 1) 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-stroke: 1px rgba(255, 255, 255, 0.25);
            filter: drop-shadow(0 8px 20px rgba(0,0,0,0.5)) drop-shadow(0 2px 6px rgba(0,0,0,0.3));
            animation: shimmer 8s linear infinite;
        }
        @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: 0% center; }
        }
      `}</style>

      {/* Silent Precision Background */}
      <SilentPrecisionBackground colors={themeColors} />

      {/* Single unified content column — everything fits in one viewport */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-5xl gap-6 md:gap-8 pt-24 pb-12">

        {/* ── Hero Title ── */}
        <h1 className="tahoe-glass-text flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 w-full flex-wrap text-[2.8rem] xs:text-[3.2rem] sm:text-5xl md:text-6xl lg:text-7xl leading-tight pointer-events-none">
          <span className="font-serif italic font-medium">{word1}</span>
          <span className="font-sans font-extrabold tracking-tighter">{word2}</span>
        </h1>

        {/* ── Subtitle ── */}
        <p className="text-lg xs:text-xl sm:text-xl md:text-2xl font-bold tracking-tight text-white max-w-[94%] sm:max-w-xl md:max-w-2xl leading-snug pointer-events-none">
          {subtitle}
        </p>

        {/* ── Description ── */}
        <p className="text-sm xs:text-base sm:text-base md:text-lg font-normal text-muted-foreground/90 max-w-[90%] sm:max-w-md md:max-w-lg leading-relaxed pointer-events-none">
          {description}
        </p>

        {/* ── CTA Buttons ── */}
        <div
          className={cn("flex flex-row items-center justify-center gap-3.5 pointer-events-auto transition-all duration-1000 transform", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "350ms" }}
        >
          <button
            onClick={() => setScreen('home')}
            className="relative inline-flex h-12 xs:h-14 items-center justify-center gap-2 rounded-xl bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] px-8 xs:px-10 text-sm xs:text-base font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
          >
            {primaryCta}
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
          <button
            onClick={handleSecondaryCtaClick}
            className="relative inline-flex h-12 xs:h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-card/80 to-card px-6 xs:px-9 text-sm xs:text-base font-semibold text-card-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] ring-1 ring-border/50 backdrop-blur-md transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            {secondaryCta}
          </button>
        </div>

        {/* ── Knowledge Areas Marquee ── */}
        <div
          className={cn("w-full flex flex-col items-center gap-4 pointer-events-auto transition-all duration-1000 transform mt-4", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "500ms" }}
        >
          <span className="text-xs xs:text-sm sm:text-xs uppercase tracking-widest text-muted-foreground/70 font-bold select-none">
            {marqueeLabel}
          </span>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div className="flex w-max gap-6 sm:gap-10 py-1.5 animate-marquee">
              {[...topics, ...topics].map((topic, i) => {
                const Icon = topic.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 xs:px-5 xs:py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-sans text-xs xs:text-sm font-semibold backdrop-blur-md shadow-sm select-none whitespace-nowrap hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="opacity-80 tracking-wide">{topic.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
