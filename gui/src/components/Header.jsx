import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';

export default function Header({ title, children }) {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();

    return (
        <header className="app-header">
            <h1>{title}</h1>
            <div className="header-controls">
                {children}
                <button onClick={toggleLanguage} className="lang-toggle">
                    {language === 'en' ? 'JA' : 'EN'}
                </button>
                <button onClick={toggleTheme} title={language === 'en' ? 'Toggle Theme' : 'テーマ切り替え'}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </header>
    );
}
