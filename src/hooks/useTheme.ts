import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../db/settings';

export type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    getSetting('theme').then((saved) => {
      const t = (saved as Theme) || 'dark';
      setThemeState(t);
      applyTheme(t);
    });
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  };

  const setTheme = async (t: Theme) => {
    await setSetting('theme', t);
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = async () => {
    await setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
};
