import { useContext } from 'react';
import { theme } from '@/constants/theme';

export const useTheme = () => {
  // For now, just return the static theme
  // Later we can add theme context for dynamic theming
  return { theme };
}; 