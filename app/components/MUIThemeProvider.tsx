"use client"

import { createTheme, ThemeProvider } from '@mui/material/styles'
import { appTheme, getPrimaryColor } from '@/lib/theme'

const theme = createTheme({
  typography: {
    fontFamily: appTheme.fonts.sans,
  },
  palette: {
    primary: {
      main: getPrimaryColor(700),
    },
    secondary: {
      main: appTheme.colors.secondary.light,
    },
    success: {
      main: appTheme.colors.success,
    },
    error: {
      main: appTheme.colors.error,
    },
  },
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&:hover': {
            backgroundColor: getPrimaryColor(300),
          },
          '&.Mui-selected': {
            backgroundColor: appTheme.colors.primary,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: getPrimaryColor(500),
            },
          },
        },
      },
    },
  },
})

export default function MUIThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}