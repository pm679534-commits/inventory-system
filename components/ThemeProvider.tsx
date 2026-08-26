'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load theme preference from settings
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
  }, []);

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  return <>{children}</>;
}
