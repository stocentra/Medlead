import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './styles/theme';
import HydrationHandler from './router/HydrationHandler';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HydrationHandler>
        <App />
      </HydrationHandler>
    </ThemeProvider>
  </React.StrictMode>
);