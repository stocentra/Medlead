import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // Orange/Coral from the design system
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1E293B', // Dark Blue/Navy from the design system
    },
    background: {
      default: '#F8FAFC', // Light Gray background
      paper: '#FFFFFF',
    },
    text: {
        primary: '#0F172A', // Dark Blue/Navy for main text
        secondary: '#64748B', // Medium Gray for secondary text
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: {
        fontWeight: 700,
        fontSize: '2.5rem', // 40px
    },
    h2: {
        fontWeight: 600,
        fontSize: '1.75rem', // 28px
    },
    body1: {
        fontSize: '1rem', // 16px
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: 'none',
                borderBottom: '1px solid #E2E8F0'
            }
        }
    }
  }
});

export default theme;