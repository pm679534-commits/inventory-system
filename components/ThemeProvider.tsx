'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load theme preference from settings on initial mount
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          const theme = settings.theme || 'light';
          applyTheme(theme);
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      }
    };

    loadTheme();

    // Listen for storage events to sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-preference') {
        const theme = e.newValue as 'light' | 'dark' | 'auto' | null;
        if (theme) {
          applyTheme(theme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    // Store theme preference in localStorage for cross-tab sync
    localStorage.setItem('theme-preference', theme);
  };

  return <>{children}</>;
}
