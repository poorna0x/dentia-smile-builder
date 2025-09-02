import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const location = useLocation()

  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Register service worker (temporarily disabled to test navigation)
  const updateSW = () => {
    // Service Worker registration disabled for testing
  }
  // const updateSW = registerSW({
  //   onNeedRefresh() {
  //     setUpdateAvailable(true)
  //   },
  //   onOfflineReady() {
  //   },
  //   onRegistered(swRegistration) {
  //   },
  //   onRegisterError(error) {
  //     console.error('Service Worker registration error:', error)
  //   },
  // })

  // Check if app is installed
  useEffect(() => {
    const checkInstallation = () => {
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      setIsInstalled(isStandalone)
    }

    checkInstallation()
    window.addEventListener('appinstalled', checkInstallation)
    
    return () => {
      window.removeEventListener('appinstalled', checkInstallation)
    }
  }, [])

  // Handle install prompt - ONLY on admin routes
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      
      // Only store the prompt if we're on an admin route
      if (isAdminRoute) {
        setDeferredPrompt(e)
        setCanInstall(true)
        // PWA install prompt available on admin route
      } else {
        // PWA install prompt ignored on non-admin route
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isAdminRoute])

  // Install app
  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn('No install prompt available')
      return false
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        // App installed successfully
        setCanInstall(false)
        setDeferredPrompt(null)
        return true
      } else {
        // App installation declined
        return false
      }
    } catch (error) {
      console.error('Error installing app:', error)
      return false
    }
  }

  // Update app
  const updateApp = () => {
    updateSW()
    setUpdateAvailable(false)
  }

  return {
    isInstalled,
    canInstall: isAdminRoute && canInstall, // Only show install option on admin routes
    updateAvailable,
    installApp,
    updateApp,
    isAdminRoute,
  }
}
