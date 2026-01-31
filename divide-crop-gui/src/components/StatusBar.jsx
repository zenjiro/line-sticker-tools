import './StatusBar.css';
import { useLanguage } from '../LanguageContext';

function StatusBar({ message }) {
    const { t } = useLanguage();

    return (
        <div className="status-bar">
            <div className="status-message">
                {message || t('shortcuts')}
            </div>
        </div>
    );
}

export default StatusBar;
