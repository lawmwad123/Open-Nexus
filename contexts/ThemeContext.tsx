import React, { createContext, useContext, useState } from 'react';
import { theme as defaultTheme } from '@/constants/theme';

export type ThemeType = typeof defaultTheme;

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme?: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [theme, setTheme] = useState(defaultTheme);

  const toggleTheme = () => {
    // For future implementation of light/dark mode
    setIsDark(!isDark);
    // setTheme(newTheme) // We'll implement this when adding light theme
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 