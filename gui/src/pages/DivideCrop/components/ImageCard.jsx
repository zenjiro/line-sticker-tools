import './ImageCard.css';
import { useLanguage } from '../../../LanguageContext';

function ImageCard({
    image,
    isFocused,
    size
}) {
    const { t } = useLanguage();

    // Generate grid lines
    const renderGridLines = () => {
        const lines = [];

        // Vertical lines (for cols)
        for (let i = 1; i < image.cols; i++) {
            lines.push(
                <div
                    key={`v-${i}`}
                    className="grid-line vertical"
                    style={{ left: `${(i / image.cols) * 100}%` }}
                />
            );
        }

        // Horizontal lines (for rows)
        for (let i = 1; i < image.rows; i++) {
            lines.push(
                <div
                    key={`h-${i}`}
                    className="grid-line horizontal"
                    style={{ top: `${(i / image.rows) * 100}%` }}
                />
            );
        }

        return lines;
    };

    return (
        <div
            className={`image-card ${isFocused ? 'focused' : ''}`}
            style={{ width: size, height: size }}
            id={`card-${image.id}`}
        >
            <div className="image-container">
                <img src={image.data} alt={image.name} />
                <div className="grid-overlay">
                    {renderGridLines()}
                </div>
            </div>
            <div className="card-info">
                <span className="grid-info">
                    {t('divisions', { cols: image.cols, rows: image.rows })}
                </span>
            </div>
        </div>
    );
}

export default ImageCard;
