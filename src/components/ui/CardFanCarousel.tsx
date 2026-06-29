import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  config: {
    videoOpacity: number;
    overlayOpacity: number;
    sectionOpacity: number;
    blurAmount: number;
  };
  imgUrl: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "space_dark",
    name: "Padrão Escuro Espacial",
    description: "Tema escuro clássico com estrelas estáticas.",
    videoPath: "",
    config: { videoOpacity: 0.0, overlayOpacity: 0.9, sectionOpacity: 0.15, blurAmount: 12 },
    imgUrl: "/space_dark_theme.png"
  },
  {
    id: "theme_3d_balanced",
    name: "Tema 3D Equilibrado",
    description: "Configuração padrão com equilíbrio perfeito entre o vídeo 3D e a legibilidade do conteúdo.",
    videoPath: "temas/Olha_assim_o_ponto_que_eu_quer.mp4",
    config: { videoOpacity: 0.25, overlayOpacity: 0.7, sectionOpacity: 0.1, blurAmount: 8 },
    imgUrl: "/theme_3d_interactive.png"
  },
  {
    id: "theme_3d_revealed",
    name: "Tema 3D Revelado",
    description: "Vídeo de fundo mais claro e visível. Ideal para destacar a animação 3D ao máximo.",
    videoPath: "temas/Olha_assim_o_ponto_que_eu_quer.mp4",
    config: { videoOpacity: 0.45, overlayOpacity: 0.45, sectionOpacity: 0.05, blurAmount: 4 },
    imgUrl: "/theme_3d_interactive.png"
  },
  {
    id: "theme_3d_neon",
    name: "Vidro Neon Translúcido",
    description: "Painéis extremamente transparentes e com desfoque alto, dando a sensação de que flutuam sobre o vídeo.",
    videoPath: "temas/Olha_assim_o_ponto_que_eu_quer.mp4",
    config: { videoOpacity: 0.35, overlayOpacity: 0.6, sectionOpacity: 0.02, blurAmount: 16 },
    imgUrl: "/theme_3d_interactive.png"
  },
  {
    id: "theme_3d_cinema",
    name: "Cinema Sombrio",
    description: "Vídeo sutil em segundo plano com painéis de texto mais visíveis. Foco total em leitura.",
    videoPath: "temas/Olha_assim_o_ponto_que_eu_quer.mp4",
    config: { videoOpacity: 0.15, overlayOpacity: 0.85, sectionOpacity: 0.25, blurAmount: 20 },
    imgUrl: "/theme_3d_interactive.png"
  }
];

interface CardFanCarouselProps {
  currentPath: string;
  currentConfig: {
    videoOpacity: number;
    overlayOpacity: number;
    sectionOpacity: number;
    blurAmount: number;
  };
  onSelectPreset: (preset: ThemePreset) => void;
}

const MAX_VISIBLE = 5;
const HALF = 2;

const FAN_POSITIONS = [
  { rot: -20, scale: 0.8, x: -26, y: 5.5, zIndex: 1 },
  { rot: -10, scale: 0.9, x: -13, y: 1.5, zIndex: 2 },
  { rot: 0,   scale: 1.0, x: 0,   y: 0.0, zIndex: 10 },
  { rot: 10,  scale: 0.9, x: 13,  y: 1.5, zIndex: 2 },
  { rot: 20,  scale: 0.8, x: 26,  y: 5.5, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.32;
  if (width < 640) return 0.42;
  if (width < 768) return 0.55;
  if (width < 1024) return 0.75;
  return 1.0;
}

function getHeightMultiplier(width: number) {
  if (width < 480) return 0.4;
  if (width < 640) return 0.55;
  if (width < 768) return 0.7;
  return 1.0;
}

const ARROW_CLASSES =
  "relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/70 cursor-pointer shrink-0 z-30 outline-none hover:border-primary/40 hover:text-primary active:opacity-70 transition-all duration-300 w-10 h-10";

export function CardFanCarousel({ currentPath, currentConfig, onSelectPreset }: CardFanCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  const totalCards = THEME_PRESETS.length;
  const needsPagination = totalCards > MAX_VISIBLE;

  // Determine active preset based on current videoPath and config values
  const getActivePresetIndex = () => {
    const matchedIndex = THEME_PRESETS.findIndex(
      p => p.videoPath === currentPath && 
      Math.abs(p.config.videoOpacity - currentConfig.videoOpacity) < 0.06 &&
      Math.abs(p.config.overlayOpacity - currentConfig.overlayOpacity) < 0.06
    );
    return matchedIndex !== -1 ? matchedIndex : 0;
  };

  const [centerIndex, setCenterIndex] = useState(HALF);

  // Sync centerIndex if current selection changes from outside
  useEffect(() => {
    const activeIdx = getActivePresetIndex();
    setCenterIndex(activeIdx);
  }, [currentPath, currentConfig.videoOpacity, currentConfig.overlayOpacity]);

  const getVisibleMap = useCallback((center: number) => {
    const map = new Map<number, number>();
    for (let slot = 0; slot < MAX_VISIBLE; slot++) {
      map.set(((center + slot - HALF) % totalCards + totalCards) % totalCards, slot);
    }
    return map;
  }, [totalCards]);

  const cycle = useCallback((direction: "left" | "right") => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex(prev =>
      direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
    );
  }, [totalCards]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(container.querySelectorAll<HTMLElement>(".fan-card"));
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const config = (slot: number) => FAN_POSITIONS[slot];

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, { x: 0, y: `${8 * hMult}rem`, rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 1.0, ease: "elastic.out(1.05,.78)", delay: 0.1 + slot * 0.05, onComplete: onCardDone });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 30 : -30;
          gsap.set(card, { x: `${enterX}rem`, y: `${y * hMult}rem`, rotation: direction === "right" ? 25 : -25, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: 0.45, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -30 : 30;
        gsap.to(card, { x: `${exitX}rem`, opacity: 0, scale: 0.5, rotation: direction === "right" ? -25 : 25, duration: 0.35, ease: "power2.in", zIndex: 0 });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    // Hover interactions
    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: NodeJS.Timeout | null = null;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 1.8 * hM;
            targetScale *= 1.08;
          } else {
            const pushStrength = 5 * (1 + 0.1 * Math.max(0, 3 - distance));
            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 2.5 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 2.5 / (distance + 1);
            }
          }
        } else {
          delay = Math.abs(slot - HALF) * 0.015;
        }

        gsap.to(el, {
          x: `${targetX}rem`, y: `${targetY}rem`, rotation: targetRot, scale: targetScale,
          duration: 0.45, delay, ease: "elastic.out(1,.8)", overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating.current) return;
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== slot) { activeSlot = slot; updateHoverLayout(slot); }
      };
      el.addEventListener("mouseenter", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating.current) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { activeSlot = null; updateHoverLayout(null); }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => { if (!isAnimating.current) updateHoverLayout(activeSlot); };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, getVisibleMap]);

  const chevron = (direction: "left" | "right") => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  const selectedPreset = THEME_PRESETS[centerIndex];

  return (
    <section className="flex flex-col items-center w-full py-4 relative z-20 select-none">
      <div className="flex items-center justify-center w-full max-w-[90rem]">
        <div ref={containerRef} className="fan-layout flex relative justify-center items-center w-full min-h-[18rem] md:min-h-[22rem]">
          {THEME_PRESETS.map((preset, index) => {
            const isSelected = 
              preset.videoPath === currentPath && 
              Math.abs(preset.config.videoOpacity - currentConfig.videoOpacity) < 0.06 &&
              Math.abs(preset.config.overlayOpacity - currentConfig.overlayOpacity) < 0.06;

            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`fan-card absolute w-[9.5rem] h-[13.5rem] md:w-[11.5rem] md:h-[16.5rem] rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                  isSelected 
                    ? "border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] ring-2 ring-primary/40" 
                    : "border-white/10 hover:border-white/20 shadow-lg"
                }`}
                style={{ position: 'absolute' }}
              >
                <div className="relative w-full h-full">
                  <img 
                    src={preset.imgUrl} 
                    alt={preset.name} 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                  />
                  {/* Subtle card glow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  
                  {/* Card Title Label */}
                  <div className="absolute bottom-3 left-3 right-3 z-20">
                    <span className="block text-[11px] md:text-xs font-bold text-white font-display truncate">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary/20 text-[8px] font-bold text-primary tracking-wide uppercase">
                        Ativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-4 mt-6 z-30">
        <button 
          type="button"
          className={ARROW_CLASSES} 
          onClick={() => cycle("left")} 
          aria-label="Previous"
        >
          {chevron("left")}
        </button>
        <div className="flex items-center gap-2">
          {THEME_PRESETS.map((_, i) => (
            <span 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === centerIndex 
                  ? "bg-primary scale-[1.3]" 
                  : "bg-white/15"
              }`} 
            />
          ))}
        </div>
        <button 
          type="button"
          className={ARROW_CLASSES} 
          onClick={() => cycle("right")} 
          aria-label="Next"
        >
          {chevron("right")}
        </button>
      </div>

      {/* Info panel of the fanned center/active theme */}
      {selectedPreset && (
        <div className="mt-6 text-center max-w-md bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-sm z-30">
          <h4 className="text-sm font-bold text-white font-display">{selectedPreset.name}</h4>
          <p className="text-xs text-on-surface-variant mt-1 font-sans">{selectedPreset.description}</p>
        </div>
      )}
    </section>
  );
}
