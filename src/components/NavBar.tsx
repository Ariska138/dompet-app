import { useRouter } from 'next/router';

export const NavBar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Dompet App</div>
        <div className="space-x-4">
          <a
            href="/dashboard"
            className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/dashboard' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            Dashboard
          </a>
          <a
            href="/files"
            className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/files' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            Files
          </a>
          <a
            href="/gallery"
            className={`px-3 py-2 rounded-md text-sm font-medium ${router.pathname === '/gallery' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            Gallery
          </a>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
