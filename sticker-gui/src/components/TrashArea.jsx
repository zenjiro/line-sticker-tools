import './TrashArea.css';

function TrashArea({ images, focusIndex, imageSize }) {
    if (images.length === 0) {
        return null;
    }

    return (
        <div className="trash-area">
            <div className="trash-header">
                <span className="trash-icon">🗑️</span>
                <span>ゴミ箱（{images.length}枚）- Delete/BackSpaceで復元</span>
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
