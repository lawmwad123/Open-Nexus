export const lightTheme = {
    colors: {
      primary: '#007aff',
      primaryDark: '#0059b3',
      dark: '#ffffff',
      darkLight: '#f5f5f5',
      gray: '#808080',
      text: '#000000',
      textLight: '#666666',
      textDark: '#ffffff',
      border: '#dddddd',
      error: '#ff0000',
      success: '#4CAF50',
      warning: '#FFC107',
      info: '#2196F3'
    },
    fonts: {
      body: 'system-ui, sans-serif',
      heading: 'system-ui, sans-serif',
      monospace: 'Menlo, monospace',
      medium: 'system-ui, sans-serif',
      semibold: 'system-ui, sans-serif',
      extraBold: 'system-ui, sans-serif'
    },
    radius: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 20
    }
   };

export const darkTheme = {
    colors: {
      primary: '#007aff',
      primaryDark: '#0059b3',
      dark: '#000000',
      darkLight: '#111111',
      gray: '#808080',
      text: '#ffffff',
      textLight: '#cccccc',
      textDark: '#000000',
      border: '#444444',
      error: '#ff0000',
      success: '#4CAF50',
      warning: '#FFC107',
      info: '#2196F3'
    },
    fonts: lightTheme.fonts,
    radius: lightTheme.radius
   };

export const theme = darkTheme; // Default theme