import { useEffect } from 'react';

interface LightweightSmoothScrollProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const LightweightSmoothScroll: React.FC<LightweightSmoothScrollProps> = ({ 
  children, 
  enabled = true 
}) => {
  useEffect(() => {
    if (!enabled) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Lightweight smooth scroll implementation using CSS only
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      
      /* Disable on low-end devices */
      @media (max-width: 768px) and (max-height: 600px) {
        html {
          scroll-behavior: auto;
        }
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [enabled]);

  return <>{children}</>;
};

export default LightweightSmoothScroll;
