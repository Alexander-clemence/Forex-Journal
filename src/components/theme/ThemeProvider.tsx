'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

const THEME_STYLES = `
  .light {
    --tw-border-opacity: 1;
    --tw-border-color: rgb(229 231 235 / var(--tw-border-opacity));
  }
  
  .light .border {
    border-color: rgb(229 231 235);
  }
  
  .light .border-t {
    border-top-color: rgb(229 231 235);
  }
  
  .light .border-b {
    border-bottom-color: rgb(229 231 235);
  }
  
  .light .border-l {
    border-left-color: rgb(229 231 235);
  }
  
  .light .border-r {
    border-right-color: rgb(229 231 235);
  }
  
  .light .divide-y > :not([hidden]) ~ :not([hidden]) {
    border-top-color: rgb(229 231 235);
  }
  
  .light .divide-x > :not([hidden]) ~ :not([hidden]) {
    border-left-color: rgb(229 231 235);
  }
  
  .light .card,
  .light [class*="card"] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light [data-radix-dialog-content],
  .light [data-radix-popover-content],
  .light [data-radix-dropdown-menu-content],
  .light [data-radix-select-content] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light input,
  .light textarea,
  .light select,
  .light [role="textbox"],
  .light [role="combobox"] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light button[variant="outline"],
  .light [data-variant="outline"] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light table,
  .light tbody,
  .light thead,
  .light tr {
    border-color: rgb(229 231 235);
  }
  
  .light th,
  .light td {
    border-color: rgb(229 231 235);
    background-color: rgb(255 255 255);
  }
  
  .light nav,
  .light [role="menu"],
  .light [role="menuitem"] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light [data-radix-tabs-content],
  .light [data-radix-accordion-content] {
    background-color: rgb(255 255 255);
    border-color: rgb(229 231 235);
  }
  
  .light .bg-white {
    background-color: rgb(255 255 255);
  }
  
  .light .bg-gray-50,
  .light .bg-gray-100 {
    background-color: rgb(255 255 255);
  }
`;

const CSS_VARS = {
  light: {
    borderColor: 'rgb(243 244 246)',
    borderSubtle: 'rgb(229 231 235)'
  },
  dark: {
    borderColor: 'rgb(55 65 81)',
    borderSubtle: 'rgb(75 85 99)'
  }
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    setResolvedTheme(newTheme);

    const vars = CSS_VARS[newTheme];
    root.style.setProperty('--border-color', vars.borderColor);
    root.style.setProperty('--border-subtle', vars.borderSubtle);
  }, []);

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const resolveTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    return currentTheme === 'system' ? getSystemTheme() : currentTheme;
  }, [getSystemTheme]);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, [storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
   
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, applyTheme]);

  // Apply theme when it changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme);
    applyTheme(newResolvedTheme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey, applyTheme, resolveTheme]);

  // Inject CSS styles once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const styleId = 'theme-border-styles';
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = THEME_STYLES;
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById(styleId);
      styleToRemove?.remove();
    };
  }, []);

  const handleSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const contextValue = useMemo(
    () => ({ theme, setTheme: handleSetTheme, resolvedTheme }),
    [theme, handleSetTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}