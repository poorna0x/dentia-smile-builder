import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component to scroll to top on route change
 * This ensures that when users navigate between pages, they always start at the top
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
