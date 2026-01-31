import './TrashArea.css';
import { useLanguage } from '../../../LanguageContext';

function TrashArea({ images, focusIndex, imageSize }) {
    const { t } = useLanguage();

    if (images.length === 0) {
        return null;
    }

    return (
        <div className="trash-area">
            <div className="trash-header">
                <span className="trash-icon">🗑️</span>
                <span>{t('trashTitle', { count: images.length })}</span>
            </div>
            <div className="trash-grid">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className={`trash-tile ${index === focusIndex ? 'focused' : ''}`}
                        style={{ width: imageSize, height: imageSize }}
                    >
                        <img
                            src={image.data}
                            alt={image.name}
                            className="trash-image"
                            draggable={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TrashArea;

