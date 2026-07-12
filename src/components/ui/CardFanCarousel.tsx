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
    brightness?: number;
    contrast?: number;
    hueRotate?: number;
    backgroundStyle?: string;
    textColor?: string;
    accentColor?: string;
    isLight?: boolean;
  };
  imgUrl: string;
}

const VIDEO_FILES = [
  "AI_microchip_hovering_above_gear_202606292229.mp4",
  "AI_microchip_landing_on_motherboard_202606292158.mp4",
  "Black_pumpkin_emitting_orange_light_202606292252.mp4",
  "Bowl_floating_with_honey_1080p_202606292157.mp4",
  "Butterfly_floating_slow_motion_202606292253.mp4",
  "Credit_card_hovering_in_air_202606292229.mp4",
  "Crystal_DNA_helix_rotating_202606292222.mp4",
  "Crystal_brain_pulsing_light_202606292229.mp4",
  "Crystal_heart_pulsing_warm_light_202606292252.mp4",
  "Crystal_lotus_flower_opening_clo_202606292253.mp4",
  "Crystal_snowflake_floating_and_s_202606292252.mp4",
  "Crystal_staircase_trending_upwards_202606292229_1.mp4",
  "Digital_tablet_floating_in_air_202606292229.mp4",
  "Digital_timer_floating_in_air_202606292252.mp4",
  "FPV_diving_through_red_rock_202606292251.mp4",
  "FPV_floating_through_cave_202606292251.mp4",
  "FPV_flying_above_calm_ocean_202606292251.mp4",
  "FPV_soaring_above_snow_mountains_202606292251.mp4",
  "Feather_pen_drawing_light_line_202606292218_1.mp4",
  "Floating_screen_displaying_code_202606292229.mp4",
  "Flying_through_mystical_forest_202606292252.mp4",
  "Game_controller_floating_tilting_1080p_202606292220.mp4",
  "Glass_and_gold_gears_rotating_202606292158.mp4",
  "Glass_blender_blending_purple_sm_202606292158.mp4",
  "Glass_rose_floating_blooming_clo_202606292252.mp4",
  "Glowing_glass_nodes_connected_by_202606292230.mp4",
  "Golden_champagne_bubbles_rising_202606292252.mp4",
  "Golden_key_floating_rotating_202606292222.mp4",
  "Golden_ribbon_tying_bow_202606292252.mp4",
  "High_tech_safe_opens_light_Glass_202606292157.mp4",
  "Holographic_data_sphere_pulsing_202606292221.mp4",
  "Holographic_globe_spinning_and_d_202606292229.mp4",
  "Hourglass_with_falling_sand_1080p_202606292209.mp4",
  "Jellyfish_swimming_upwards_in_mi_202606292253.mp4",
  "Leaf_with_falling_water_drop_202606292253.mp4",
  "Lines_of_code_self_write_digital_202606292157.mp4",
  "Luxury_briefcase_floating_mid_air_202606292229.mp4",
  "Measuring_tape_unrolling_in_air_202606292253.mp4",
  "Metallic_soundwaves_morphing_in_air_202606292229.mp4",
  "Metallic_stamp_pressing_wax_1080p_202606292219.mp4",
  "Metallic_stopwatch_floating_tick_1080p_202606292219.mp4",
  "Microphone_floating_with_neon_so_202606292222.mp4",
  "Olha_assim_o_ponto_que_eu_quer.mp4",
  "Percentage_symbol_rotating_in_air_202606292252.mp4",
  "Pocket_watch_gears_turning_mid_air_202606292252.mp4",
  "Ribbon_shipping_box_floating_mid_202606292221.mp4",
  "Rocket_lifting_off_neon_smoke_202606292157.mp4",
  "Rose_quartz_gold_roller_floating_202606292221.mp4",
  "Swimming_through_coral_reef_202606292251.mp4",
  "Three_black_stones_floating_water_202606292254.mp4",
  "Two_rings_floating_twisting_toge_202606292219_1.mp4",
  "White_and_gold_Koi_fish_202606292254.mp4"
];

const generatedPresets: ThemePreset[] = VIDEO_FILES.map(file => {
  const baseName = file.replace(/\.mp4$/, '');
  let cleanName = baseName.replace(/_\d{8}\d{4}(_\d+)?$/, '');
  cleanName = cleanName.replace(/_1080p$/, '');
  cleanName = cleanName.replace(/_/g, ' ');
  const formattedName = cleanName
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    id: `theme_3d_${baseName}`,
    name: formattedName + " 3D",
    description: `Vídeo 3D interativo loop "${formattedName}".`,
    videoPath: `temas/${file}`,
    config: { videoOpacity: 0.25, overlayOpacity: 0.70, sectionOpacity: 0.10, blurAmount: 8, brightness: 1.0, contrast: 1.0 },
    imgUrl: "/theme_3d_interactive.png"
  };
});

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "space_dark",
    name: "Padrão Escuro Espacial",
    description: "Tema escuro clássico com estrelas estáticas.",
    videoPath: "",
    config: { videoOpacity: 0.0, overlayOpacity: 0.9, sectionOpacity: 0.15, blurAmount: 12 },
    imgUrl: "/space_dark_theme.png"
  },
  ...generatedPresets,
  {
    id: "color_glacial",
    name: "Gelo Glacial (Frio)",
    description: "Fundo gradiente premium em tons de azul escuro e glacial com alto contraste de texto.",
    videoPath: "color:glacial",
    config: {
      videoOpacity: 0.0,
      overlayOpacity: 0.0,
      sectionOpacity: 0.1,
      blurAmount: 12,
      backgroundStyle: "linear-gradient(135deg, #0b0f19 0%, #1e293b 50%, #020617 100%)",
      textColor: "#f8fafc",
      accentColor: "#38bdf8"
    },
    imgUrl: "/theme_glacial.png"
  },
  {
    id: "color_cyber",
    name: "Cyber Violeta (Dark)",
    description: "Fundo futurista em tons de roxo profundo e magenta neon com painéis translúcidos.",
    videoPath: "color:cyber",
    config: {
      videoOpacity: 0.0,
      overlayOpacity: 0.0,
      sectionOpacity: 0.08,
      blurAmount: 16,
      backgroundStyle: "linear-gradient(135deg, #09090b 0%, #2e1065 50%, #030712 100%)",
      textColor: "#f4f4f5",
      accentColor: "#d946ef"
    },
    imgUrl: "/theme_cyber.png"
  },
  {
    id: "color_aurora",
    name: "Aurora Esmeralda",
    description: "Tema sofisticado com gradiente verde esmeralda escuro e destaques dourados/verdes.",
    videoPath: "color:aurora",
    config: {
      videoOpacity: 0.0,
      overlayOpacity: 0.0,
      sectionOpacity: 0.1,
      blurAmount: 10,
      backgroundStyle: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #020617 100%)",
      textColor: "#f0fdf4",
      accentColor: "#34d399"
    },
    imgUrl: "/theme_aurora.png"
  },
  {
    id: "color_white",
    name: "Branco Minimalista",
    description: "Tema claro de alta qualidade em tons de cinza suave e branco, com tipografia e bordas escuras.",
    videoPath: "color:white",
    config: {
      videoOpacity: 0.0,
      overlayOpacity: 0.0,
      sectionOpacity: 0.25,
      blurAmount: 14,
      backgroundStyle: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      textColor: "#0f172a",
      accentColor: "#2563eb",
      isLight: true
    },
    imgUrl: "/theme_white.png"
  }
];

interface CardFanCarouselProps {
  currentPath: string;
  currentConfig: {
    videoOpacity: number;
    overlayOpacity: number;
    sectionOpacity: number;
    blurAmount: number;
    brightness?: number;
    contrast?: number;
    hueRotate?: number;
    backgroundStyle?: string;
    textColor?: string;
    accentColor?: string;
    isLight?: boolean;
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
  if (width < 480) return 0.24;
  if (width < 640) return 0.32;
  if (width < 768) return 0.42;
  if (width < 1024) return 0.55;
  return 0.75;
}

function getHeightMultiplier(width: number) {
  if (width < 480) return 0.3;
  if (width < 640) return 0.4;
  if (width < 768) return 0.5;
  return 0.7;
}

const ARROW_CLASSES =
  "relative flex items-center justify-center rounded-full border border-white/15 bg-white/8 backdrop-blur-md text-white/80 cursor-pointer shrink-0 z-30 outline-none hover:border-primary/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all duration-200 w-11 h-11 shadow-lg";

export function CardFanCarousel({ currentPath, currentConfig, onSelectPreset }: CardFanCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  const handleVideoHover = (e: React.MouseEvent<HTMLDivElement>, play: boolean) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (play) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  };

  const totalCards = THEME_PRESETS.length;
  const needsPagination = totalCards > MAX_VISIBLE;

  const getActivePresetIndex = () => {
    const matchedIndex = THEME_PRESETS.findIndex(
      p => p.videoPath === currentPath && 
      (currentPath.startsWith("color:") 
        ? p.config.backgroundStyle === currentConfig.backgroundStyle 
        : Math.abs(p.config.videoOpacity - currentConfig.videoOpacity) < 0.06 &&
          Math.abs(p.config.overlayOpacity - currentConfig.overlayOpacity) < 0.06
      )
    );
    return matchedIndex !== -1 ? matchedIndex : 0;
  };

  const [centerIndex, setCenterIndex] = useState(HALF);

  // Sync centerIndex if current selection changes from outside
  useEffect(() => {
    const activeIdx = getActivePresetIndex();
    setCenterIndex(activeIdx);
  }, [currentPath, currentConfig.videoOpacity, currentConfig.overlayOpacity, currentConfig.backgroundStyle]);

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
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? (
        <>
          <polyline points="17 18 11 12 17 6" />
          <polyline points="13 18 7 12 13 6" />
        </>
      ) : (
        <>
          <polyline points="7 18 13 12 7 6" />
          <polyline points="11 18 17 12 11 6" />
        </>
      )}
    </svg>
  );

  const selectedPreset = THEME_PRESETS[centerIndex];
  const visibleMap = getVisibleMap(centerIndex);

  return (
    <section className="flex flex-col items-center w-full py-2 relative z-20 select-none">
      <div className="flex items-center justify-center w-full max-w-[90rem]">
        <div ref={containerRef} className="fan-layout flex relative justify-center items-center w-full min-h-[12rem] md:min-h-[14rem]">
          {THEME_PRESETS.map((preset, index) => {
            const isSelected = 
              preset.videoPath === currentPath && 
              (currentPath.startsWith("color:") 
                ? preset.config.backgroundStyle === currentConfig.backgroundStyle 
                : Math.abs(preset.config.videoOpacity - currentConfig.videoOpacity) < 0.06 &&
                  Math.abs(preset.config.overlayOpacity - currentConfig.overlayOpacity) < 0.06
              );

            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                onMouseEnter={(e) => handleVideoHover(e, true)}
                onMouseLeave={(e) => handleVideoHover(e, false)}
                className={`fan-card absolute w-[6.5rem] h-[9.5rem] md:w-[8rem] md:h-[11.5rem] rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                  isSelected 
                    ? "border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] ring-2 ring-primary/40" 
                    : "border-white/10 hover:border-white/20 shadow-lg"
                }`}
                style={{ position: 'absolute' }}
              >
                <div className="relative w-full h-full">
                  {preset.videoPath ? (
                    preset.videoPath.startsWith("color:") ? (
                      <div 
                        style={{ background: preset.config.backgroundStyle }}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                    ) : (
                      visibleMap.has(index) ? (
                        <video 
                          src={`/${preset.videoPath}`}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-fade-in"
                          preload="metadata"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center text-white/20 text-[10px] font-sans">
                          {preset.name}
                        </div>
                      )
                    )
                  ) : (
                    <img 
                      src={preset.imgUrl} 
                      alt={preset.name} 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    />
                  )}
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
      <div className="flex items-center justify-center gap-3 mt-3 z-30">
        <button 
          type="button"
          className={ARROW_CLASSES} 
          onClick={() => cycle("left")} 
          aria-label="Anterior"
        >
          {chevron("left")}
        </button>
        <div className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full bg-white/6 border border-white/12 backdrop-blur-md select-none min-w-[72px]">
          <span className="text-sm font-bold text-white font-mono leading-none">{centerIndex + 1} / {totalCards}</span>
          <span className="text-[9px] text-white/40 font-sans">{Math.round(((centerIndex + 1) / totalCards) * 100)}%</span>
        </div>
        <button 
          type="button"
          className={ARROW_CLASSES} 
          onClick={() => cycle("right")} 
          aria-label="Próximo"
        >
          {chevron("right")}
        </button>
      </div>

      {/* Info panel of the fanned center/active theme */}
      {selectedPreset && (
        <div className="mt-2 text-center max-w-md bg-white/5 border border-white/5 p-2 rounded-xl backdrop-blur-sm z-30">
          <h4 className="text-sm font-bold text-white font-display">{selectedPreset.name}</h4>
          <p className="text-xs text-on-surface-variant mt-1 font-sans">{selectedPreset.description}</p>
        </div>
      )}
    </section>
  );
}
