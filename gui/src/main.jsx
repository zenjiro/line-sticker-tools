import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home/Home';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
