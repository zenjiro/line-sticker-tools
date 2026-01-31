import './ImageGrid.css';
import ImageTile from './ImageTile';

function ImageGrid({
    images,
    focusIndex,
    selectedIndices,
    cutIndices,
    mainImageId,
    tabImageId,
    imageSize,
}) {
    return (
        <div
            className="image-grid"
            style={{
                '--image-size': `${imageSize}px`,
            }}
        >
            {images.map((image, index) => (
                <ImageTile
                    key={image.id}
                    image={image}
                    index={index}
                    isFocused={index === focusIndex}
                    isSelected={selectedIndices.has(index)}
                    isCut={cutIndices.has(index)}
                    isMain={image.id === mainImageId}
                    isTab={image.id === tabImageId}
                    size={imageSize}
                />
            ))}
            {/* Dummy tile for inserting at end */}
            <div
                className={`image-tile dummy-tile ${focusIndex === images.length ? 'focused' : ''}`}
                style={{ width: imageSize, height: imageSize }}
            >
                <div className="dummy-content">
                    <span>📍</span>
                </div>
            </div>
        </div>
    );
}

export default ImageGrid;
