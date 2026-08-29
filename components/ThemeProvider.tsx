'use client';

import { useEffect, useState, useRef } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const lastManualChangeRef = useRef<number>(0);

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

          // Check if there was a recent manual change (within last 5 seconds)
          // If so, skip server sync to avoid overwriting user's immediate action
          const timeSinceManualChange = Date.now() - lastManualChangeRef.current;
          if (timeSinceManualChange < 5000) {
            return; // Skip sync, manual change takes precedence
          }

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
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: string; timestamp: number }>;
      const { theme, timestamp } = customEvent.detail;

      // Record timestamp of manual change
      lastManualChangeRef.current = timestamp || Date.now();

      // Store and apply theme
      localStorage.setItem('theme-preference', theme);
      applyTheme(theme as 'light' | 'dark' | 'auto');
    };

    // Listen for storage events to sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-preference' && e.newValue) {
        const theme = e.newValue as 'light' | 'dark' | 'auto';
        applyTheme(theme);
      }
    };

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem('theme-preference');
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };

    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return <>{children}</>;
}
