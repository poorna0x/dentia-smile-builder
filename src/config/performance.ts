// Performance configuration for smooth scrolling and animations
export const PERFORMANCE_CONFIG = {
  // Choose your performance level
  level: 'balanced' as 'lightweight' | 'balanced' | 'premium',
  
  // Feature toggles
  features: {
    // Smooth scrolling options
    smoothScrolling: true,
    useLenis: true, // false = use CSS-only smooth scrolling
    
    // Animation options
    scrollAnimations: true,
    imageLazyLoading: true,
    gpuAcceleration: true,
    
    // Performance optimizations
    reducedMotionSupport: true,
    lowEndDeviceOptimization: true,
  },
  
  // Device-specific optimizations
  deviceOptimizations: {
    // Disable heavy features on low-end devices
    mobileOptimizations: true,
    touchOptimizations: true,
    
    // Performance thresholds
    maxAnimationsOnMobile: 5,
    disableAnimationsOnSlowDevices: true,
  }
};

// Get performance level based on device capabilities
export const getPerformanceLevel = (): 'lightweight' | 'balanced' | 'premium' => {
  // Check device capabilities
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const isSlowConnection = navigator.connection && (navigator.connection as any).effectiveType === 'slow-2g';
  const isMobile = window.innerWidth < 768;
  
  if (isLowEndDevice || isSlowConnection) {
    return 'lightweight';
  } else if (isMobile) {
    return 'balanced';
  } else {
    return 'premium';
  }
};

// Check if animations should be reduced
export const shouldReduceAnimations = (): boolean => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const isSlowConnection = navigator.connection && (navigator.connection as any).effectiveType === 'slow-2g';
  
  return prefersReducedMotion || isLowEndDevice || isSlowConnection;
};
