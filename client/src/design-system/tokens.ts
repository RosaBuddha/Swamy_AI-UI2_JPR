// Design System Tokens - Updated to match Swamy AI design
export const designTokens = {
  colors: {
    // Primary colors - Light theme
    primary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      900: '#1E293B',
    },
    
    // Background colors - Light theme
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      sidebar: '#F8FAFC',
      hover: '#F1F5F9',
    },
    
    // Text colors
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      muted: '#94A3B8',
      accent: '#3B82F6',
    },
    
    // Border colors
    border: {
      primary: '#E2E8F0',
      secondary: '#CBD5E1',
      accent: '#3B82F6',
    },
    
    // Message colors
    message: {
      user: '#F1F5F9',
      userText: '#1E293B',
      ai: '#FFFFFF',
      aiText: '#1E293B',
    },
    
    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
} as const;

export type DesignTokens = typeof designTokens;