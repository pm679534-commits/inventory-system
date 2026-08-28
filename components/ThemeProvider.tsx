'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply theme immediately on mount
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
      localStorage.setItem('theme-preference', theme);
    };

    // Load theme preference from settings on initial mount
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          const theme = settings.theme || 'light';
          applyTheme(theme);
        } else {
          // Fallback to light theme if API fails
          applyTheme('light');
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
        // Fallback to light theme
        applyTheme('light');
      }
    };

    loadTheme();

    // Listen for theme changes from settings page
    const handleThemeChange = (e: CustomEvent) => {
      applyTheme(e.detail);
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
