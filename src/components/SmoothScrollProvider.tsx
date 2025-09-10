import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { getPerformanceLevel, shouldReduceAnimations } from '@/config/performance';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const [useLenis, setUseLenis] = useState(false);

  useEffect(() => {
    // Check if we should use Lenis based on device capabilities
    const performanceLevel = getPerformanceLevel();
    const shouldReduce = shouldReduceAnimations();
    
    // Only use Lenis on premium devices and when animations aren't reduced
    const shouldUseLenis = performanceLevel === 'premium' && !shouldReduce;
    setUseLenis(shouldUseLenis);

    if (shouldUseLenis) {
      // Initialize Lenis with optimized settings
      lenisRef.current = new Lenis({
        duration: 1.0, // Slightly faster for better performance
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false, // Disable on touch for better performance
        touchMultiplier: 2,
        infinite: false,
      });

      // Optimized animation frame loop
      let rafId: number;
      function raf(time: number) {
        lenisRef.current?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);

      // Cleanup
      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        lenisRef.current?.destroy();
      };
    } else {
      // Fallback to CSS-only smooth scrolling
      const style = document.createElement('style');
      style.textContent = `
        html {
          scroll-behavior: smooth;
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  return <>{children}</>;
};

export default SmoothScrollProvider;
