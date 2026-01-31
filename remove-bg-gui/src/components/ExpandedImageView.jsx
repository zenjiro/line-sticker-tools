import React, { useEffect } from 'react';
import './ExpandedImageView.css';

function ExpandedImageView({ image, onClose }) {
    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!image) return null;

    return (
        <div className="expanded-overlay" onClick={onClose}>
            <div className="expanded-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose} title="Close (Esc)">
                    ✕
                </button>
                <img
                    src={image.processedData || image.data}
                    alt={image.name}
                    className="expanded-image"
                />
            </div>
        </div>
    );
}

export default ExpandedImageView;
