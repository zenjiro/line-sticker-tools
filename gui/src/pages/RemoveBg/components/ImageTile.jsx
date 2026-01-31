function ImageTile({
    image,
    index,
    isFocused,
    size,
    onClick,
}) {
    const classNames = ['image-tile'];
    if (isFocused) classNames.push('focused');

    return (
        <div
            id={`tile-${index}`}
            className={classNames.join(' ')}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            <img
                src={image.processedData || image.data}
                alt={image.name}
                className="tile-image"
                draggable={false}
            />
            <div className="fuzz-badge">
                {image.fuzz}%
            </div>
        </div>
    );
}

export default ImageTile;
