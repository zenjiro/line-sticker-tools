import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/DivideCrop/App';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </ThemeProvider>
    </React.StrictMode>
);
