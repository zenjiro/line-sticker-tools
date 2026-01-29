function ImageTile({
    image,
    isFocused,
    isSelected,
    isCut,
    isMain,
    isTab,
    size,
    index,
}) {
    const classNames = [
        'image-tile',
        isFocused && 'focused',
        isSelected && 'selected',
        isCut && 'cut',
    ].filter(Boolean).join(' ');

    return (
        <div
            id={`tile-${index}`}
            className={classNames}
            style={{ width: size, height: size }}
        >
            <img
                src={image.data}
                alt={image.name}
                className="tile-image"
                draggable={false}
            />
            {isSelected && <div className="checkbox"></div>}
            <div className="badges">
                {isMain && <span className="badge main">M</span>}
                {isTab && <span className="badge tab">T</span>}
            </div>
        </div>
    );
}

export default ImageTile;
