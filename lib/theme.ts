import OpacityIcon from '@mui/icons-material/Opacity';

export const appTheme = {
  // App Identity
  name: "Reservoir",
  description: "Track your expenses and manage your budget",
  
  // Logo (you can store paths or React components)
  logo: {
    text: "reservoir",
    icon: OpacityIcon
  },
  
  // Color Scheme
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    secondary: {
      light: '#f3f4f6',
      DEFAULT: '#6b7280',
      dark: '#374151',
    },
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    background: {
      light: '#ffffff',
      dark: '#0a0a0a',
    },
    text: {
      light: '#171717',
      dark: '#ededed',
    }
  },
  
  // Typography
  fonts: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  
  // Spacing/Layout
  layout: {
    maxWidth: '1200px',
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
    }
  },

  metadata: {
    title: "Reservoir",
    description: "Track your expenses, set budgets, and visualize your spending",
    keywords: ["finance", "budget", "expenses", "money management"],
    author: "Nikhil Akenapalli",
    themeColor: "#7e22ce",
  }
}

// Helper functions
export const getAppName = () => appTheme.name
export const getPrimaryColor = (shade: keyof typeof appTheme.colors.primary = 500) => 
  appTheme.colors.primary[shade]