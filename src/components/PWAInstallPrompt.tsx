import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const PWAInstallPrompt = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isSafari, setIsSafari] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect Safari
    const ua = navigator.userAgent.toLowerCase();
    const isSafariBrowser = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
    setIsSafari(isSafariBrowser);

    // Check login status
    const checkLoginStatus = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Redirect based on login and standalone status
    if (isStandalone && isLoggedIn) {
      router.push('/dashboard');
    } else if (isStandalone && !isLoggedIn) {
      router.push('/login');
    }
  }, [isStandalone, isLoggedIn, router]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  if (isStandalone) {
    return null; // App is already running as PWA, redirect handled by useEffect
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Install Dompet App</h2>
        <p className="text-gray-700 dark:text-gray-300">
          This app must be installed to use. Please install it to continue.
        </p>
        {isSafari ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To install on Safari:
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
                <li>Select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
                <li>Open the app from your home screen.</li>
              </ol>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-md"
          >
            Install App
          </button>
        )}
        {isInstalled && !isSafari && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            App installed! Please open it from your home screen or app drawer.
          </p>
        )}
      </div>
    </div>
  );
};
