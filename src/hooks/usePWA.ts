import { useState, useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Register service worker
  const updateSW = registerSW({
    onNeedRefresh() {
      setUpdateAvailable(true)
    },
    onOfflineReady() {
      console.log('App is ready for offline use')
    },
    onRegistered(swRegistration) {
      console.log('Service Worker registered:', swRegistration)
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error)
    },
  })

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

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

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
        console.log('App installed successfully')
        setCanInstall(false)
        setDeferredPrompt(null)
        return true
      } else {
        console.log('App installation declined')
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
    canInstall,
    updateAvailable,
    installApp,
    updateApp,
  }
}
