'use client';

import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Apply cached theme immediately from localStorage (already applied by inline script)
    const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
      if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Sync theme with server settings in background (non-blocking)
    const syncThemeFromServer = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          const serverTheme = settings.theme || 'light';
          const cachedTheme = localStorage.getItem('theme-preference');

          // Only update if server theme differs from cached
          if (serverTheme !== cachedTheme) {
            localStorage.setItem('theme-preference', serverTheme);
            applyTheme(serverTheme);
          }
        }
      } catch (err) {
        // Silently fail - cached theme already applied
        console.error('Theme sync failed:', err);
      }
    };

    syncThemeFromServer();

    // Listen for theme changes from settings page
    const handleThemeChange = (e: CustomEvent) => {
      const theme = e.detail;
      localStorage.setItem('theme-preference', theme);
      applyTheme(theme);
    };

    // Listen for storage events to sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-preference') {
        const theme = e.newValue as 'light' | 'dark' | 'auto' | null;
        if (theme) {
          applyTheme(theme);
        }
      }
    };

    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return <>{children}</>;
}
