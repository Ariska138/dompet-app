import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

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

    // Redirect logic
    if (!isStandalone) {
      router.push('/install'); // Redirect to install page if not standalone
    } else if (isLoggedIn) {
      router.push('/dashboard'); // Redirect to dashboard if logged in
    } else {
      router.push('/login'); // Redirect to login if not logged in
    }
  }, [isStandalone, isLoggedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-gray-700 dark:text-gray-300">Redirecting...</p>
    </div>
  );
}
