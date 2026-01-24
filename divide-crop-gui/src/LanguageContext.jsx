import { createContext, useState, useContext } from 'react';
import { translations, getInitialLanguage } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(getInitialLanguage());

    const t = (key, params = {}) => {
        let text = translations[language][key] || key;
        Object.keys(params).forEach(param => {
            // Use a regex to replace all occurrences of the parameter
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

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
