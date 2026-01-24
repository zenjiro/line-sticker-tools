import './ImageGrid.css';
import ImageTile from './ImageTile';

function ImageGrid({
    images,
    focusIndex,
    imageSize,
    onTileClick,
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
                    size={imageSize}
                    onClick={() => onTileClick?.(index)}
                />
            ))}
        </div>
    );
}

export default ImageGrid;
