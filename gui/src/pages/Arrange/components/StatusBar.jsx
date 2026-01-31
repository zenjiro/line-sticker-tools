import './StatusBar.css';
import { useLanguage } from '../../../LanguageContext';

function StatusBar({ message, imageCount, hasMain, hasTab }) {
    const { t } = useLanguage();
    const validCounts = [8, 16, 24, 32, 40];
    const isValidCount = validCounts.includes(imageCount);
    const canExport = isValidCount && hasMain && hasTab;

    return (
        <div className="status-bar">
            <div className="status-message">
                {message || t('shortcuts')}
            </div>
            <div className="status-info">
                <span className={`status-item ${isValidCount ? 'valid' : 'invalid'}`}>
                    {imageCount}{t('imageCount')} {isValidCount ? t('valid') : t('anyOf', { counts: validCounts.join('/') })}
                </span>
                <span className={`status-item ${hasMain ? 'valid' : 'invalid'}`}>
                    {t('mainParams')} {hasMain ? t('valid') : t('invalid')}
                </span>
                <span className={`status-item ${hasTab ? 'valid' : 'invalid'}`}>
                    {t('tabParams')} {hasTab ? t('valid') : t('invalid')}
                </span>
                <span className={`export-status ${canExport ? 'ready' : 'not-ready'}`}>
                    {canExport ? t('exportReady') : t('exportNotReady')}
                </span>
            </div>
        </div>
    );
}

export default StatusBar;

