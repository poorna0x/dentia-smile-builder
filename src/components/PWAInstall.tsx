import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Bell } from 'lucide-react';
import { isPWAInstalled, installPWA, initializeNotifications } from '@/lib/notifications';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if PWA is already installed
    setIsInstalled(isPWAInstalled());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if notifications are enabled
    const checkNotificationStatus = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    };

    // Initialize notifications
    initializeNotifications().then(() => {
      checkNotificationStatus();
    });

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleNotificationClick = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setShowNotificationPrompt(false);
        // Initialize push notifications
        await initializeNotifications();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  // Don't show if PWA is already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
          <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-900">Install App</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-blue-700">
                Install Jeshna Dental Clinic app for quick access and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
          <Card className="shadow-lg border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-green-900">Enable Notifications</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationPrompt(false)}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-green-700">
                Get notified about new appointments and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  onClick={handleNotificationClick}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationPrompt(false)}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default PWAInstall;
