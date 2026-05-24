import { useEffect, useRef } from 'react';

/**
 * Hook para integrar Animate.css com Framer Motion
 * Aplicar animações Animate.css em elementos React
 */
export function useAnimateCSS(
  animationName: string,
  delay: number = 0,
  duration: number = 1000
) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    // Aplicar delay e duração customizadas
    element.style.animationDelay = `${delay}ms`;
    element.style.animationDuration = `${duration}ms`;

    // Adicionar classes do Animate.css
    element.classList.add('animate__animated', `animate__${animationName}`);

    // Remover classes após animação (cleanup)
    const handleAnimationEnd = () => {
      element.classList.remove(`animate__${animationName}`);
    };

    element.addEventListener('animationend', handleAnimationEnd, { once: true });

    return () => {
      element.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [animationName, delay, duration]);

  return elementRef;
}

/**
 * Variantes pré-configuradas para uso com Framer Motion
 */
export const animateCSSVariants = {
  // Fade animations
  fadeInDown: { animationName: 'fadeInDown' },
  fadeInUp: { animationName: 'fadeInUp' },
  fadeInLeft: { animationName: 'fadeInLeft' },
  fadeInRight: { animationName: 'fadeInRight' },
  fadeIn: { animationName: 'fadeIn' },

  // Slide animations
  slideInDown: { animationName: 'slideInDown' },
  slideInUp: { animationName: 'slideInUp' },
  slideInLeft: { animationName: 'slideInLeft' },
  slideInRight: { animationName: 'slideInRight' },

  // Zoom animations
  zoomIn: { animationName: 'zoomIn' },
  zoomInDown: { animationName: 'zoomInDown' },
  zoomInUp: { animationName: 'zoomInUp' },

  // Attention seekers
  pulse: { animationName: 'pulse', duration: 2000 },
  bounce: { animationName: 'bounce' },
  rubberBand: { animationName: 'rubberBand' },
  shake: { animationName: 'shake' },
  swing: { animationName: 'swing' },

  // Rotate animations
  rotateIn: { animationName: 'rotateIn' },
  rotateInDownLeft: { animationName: 'rotateInDownLeft' },
  rotateInDownRight: { animationName: 'rotateInDownRight' },

  // Flip animations
  flipInX: { animationName: 'flipInX' },
  flipInY: { animationName: 'flipInY' },
};

/**
 * Objeto de transição customizado para Framer Motion com Animate.css
 */
export const animateCSSTransition = {
  type: 'tween',
  duration: 0.6,
  ease: 'easeOut',
};
