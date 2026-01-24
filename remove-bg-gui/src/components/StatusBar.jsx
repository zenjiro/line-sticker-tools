import './StatusBar.css';
import { useLanguage } from '../LanguageContext';

function StatusBar({ message, imageCount }) {
    const { t } = useLanguage();

    return (
        <div className="status-bar">
            <div className="status-left">
                {message && <span className="status-message">{message}</span>}
            </div>
            <div className="status-center">
                <span className="keyboard-hint">{t('keyboardHelp')}</span>
            </div>
            <div className="status-right">
                <span>{imageCount}{t('imageCount')}</span>
            </div>
        </div>
    );
}

export default StatusBar;
