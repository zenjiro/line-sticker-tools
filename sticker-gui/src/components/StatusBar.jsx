import './StatusBar.css';

function StatusBar({ message, imageCount, hasMain, hasTab }) {
    const validCounts = [8, 16, 24, 32, 40];
    const isValidCount = validCounts.includes(imageCount);
    const canExport = isValidCount && hasMain && hasTab;

    return (
        <div className="status-bar">
            <div className="status-message">
                {message || '矢印:移動 / Space:選択 / Alt+矢印:並替 / M:メイン / T:タブ / Del:削除'}
            </div>
            <div className="status-info">
                <span className={`status-item ${isValidCount ? 'valid' : 'invalid'}`}>
                    {imageCount}枚 {isValidCount ? '✓' : `(${validCounts.join('/')}枚のいずれか)`}
                </span>
                <span className={`status-item ${hasMain ? 'valid' : 'invalid'}`}>
                    メイン {hasMain ? '✓' : '×'}
                </span>
                <span className={`status-item ${hasTab ? 'valid' : 'invalid'}`}>
                    タブ {hasTab ? '✓' : '×'}
                </span>
                <span className={`export-status ${canExport ? 'ready' : 'not-ready'}`}>
                    {canExport ? 'Eキーでエクスポート' : 'エクスポート不可'}
                </span>
            </div>
        </div>
    );
}

export default StatusBar;
