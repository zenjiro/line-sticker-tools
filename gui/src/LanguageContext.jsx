import { createContext, useState, useContext, useEffect } from 'react';
import { translations, getInitialLanguage } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || getInitialLanguage();
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = (key, params = {}) => {
        let text = translations[language][key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        });
        return text;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ja' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
