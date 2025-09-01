// PWA Manifest Loader - Only loads manifest on admin routes
(function() {
  let manifestLink = null;

  
  function checkAndLoadManifest() {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (isAdminRoute && !manifestLink) {
      // Load manifest on admin routes
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.webmanifest';
      document.head.appendChild(manifestLink);
      
      
      
      console.log('PWA manifest loaded for admin route');
    } else if (!isAdminRoute && manifestLink) {
      // Remove manifest on non-admin routes
      document.head.removeChild(manifestLink);
      manifestLink = null;
      
      
      
      console.log('PWA manifest removed - not on admin route');
    }
  }
  
  // Check on page load
  checkAndLoadManifest();
  
  // Listen for route changes (for SPA)
  let currentPath = window.location.pathname;
  
  // Wait for DOM to be ready before setting up observer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
  
  function setupObserver() {
    if (document.body) {
      const observer = new MutationObserver(() => {
        if (window.location.pathname !== currentPath) {
          currentPath = window.location.pathname;
          checkAndLoadManifest();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', checkAndLoadManifest);
  
  // Prevent automatic install prompts on non-admin routes
  window.addEventListener('beforeinstallprompt', (e) => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    if (!isAdminRoute) {
      e.preventDefault();
      console.log('PWA install prompt prevented on non-admin route');
    }
  });
})();
