// PWA Manifest Loader - Only loads manifest on admin routes
(function() {
  let manifestLink = null;
  let swRegistration = null;
  
  function checkAndLoadManifest() {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (isAdminRoute && !manifestLink) {
      // Load manifest on admin routes
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.webmanifest';
      document.head.appendChild(manifestLink);
      
      // Register service worker on admin routes
      if ('serviceWorker' in navigator && !swRegistration) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(registration => {
            swRegistration = registration;
            console.log('Service Worker registered for admin route:', registration);
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
      }
      
      console.log('PWA manifest loaded for admin route');
    } else if (!isAdminRoute && manifestLink) {
      // Remove manifest on non-admin routes
      document.head.removeChild(manifestLink);
      manifestLink = null;
      
      // Unregister service worker on non-admin routes
      if (swRegistration) {
        swRegistration.unregister().then(() => {
          swRegistration = null;
          console.log('Service Worker unregistered - not on admin route');
        });
      }
      
      console.log('PWA manifest removed - not on admin route');
    }
  }
  
  // Check on page load
  checkAndLoadManifest();
  
  // Listen for route changes (for SPA)
  let currentPath = window.location.pathname;
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
