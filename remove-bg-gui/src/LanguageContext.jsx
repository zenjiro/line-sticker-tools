import { createContext, useContext, useState, useCallback } from 'react';
import { getTranslation } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('language');
        if (saved) return saved;
        return navigator.language.startsWith('ja') ? 'ja' : 'en';
    });

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => {
            const next = prev === 'en' ? 'ja' : 'en';
            localStorage.setItem('language', next);
            return next;
        });
    }, []);

    const t = useCallback((key, params) => {
        return getTranslation(language, key, params);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
