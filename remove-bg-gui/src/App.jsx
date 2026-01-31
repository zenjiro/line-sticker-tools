import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import ImageGrid from './components/ImageGrid';
import StatusBar from './components/StatusBar';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { processImage } from './utils/backgroundRemover';
import { useLanguage } from './LanguageContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function App() {
    const { t, language, toggleLanguage } = useLanguage();

    // Image state: each image has { id, file, data, name, fuzz, processedData, bgColor }
    const [images, setImages] = useState([]);
    const [focusIndex, setFocusIndex] = useState(0);
    const [imageSize, setImageSize] = useState(150);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    // Grid columns calculation
    const [gridColumns, setGridColumns] = useState(4);

    // Theme support
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    // Update grid columns on resize
    useEffect(() => {
        const updateColumns = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth - 40;
                const cols = Math.floor(containerWidth / (imageSize + 8));
                setGridColumns(Math.max(1, cols));
            }
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, [imageSize]);

    // Auto-fit size when images load
    useEffect(() => {
        if (images.length > 0 && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth - 40;
            const reservedSpace = 120;
            const containerHeight = window.innerHeight - reservedSpace;

            for (let size = 200; size >= 80; size -= 10) {
                const cols = Math.floor(containerWidth / (size + 8));
                const rows = Math.ceil(images.length / cols);
                const totalHeight = rows * (size + 8);
                if (totalHeight <= containerHeight && cols >= 1) {
                    setImageSize(size);
                    break;
                }
            }
        }
    }, [images.length]);

    // Auto-scroll to focused item
    useEffect(() => {
        const el = document.getElementById(`tile-${focusIndex}`);
        if (el) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }, [focusIndex]);

    // Show message temporarily
    const showMessage = useCallback((msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 2000);
    }, []);

    // Process a single image with its fuzz value
    const processImageWithFuzz = useCallback(async (image) => {
        try {
            const result = await processImage(image.data, image.fuzz);
            return {
                ...image,
                processedData: result.dataUrl,
                bgColor: result.bgColor,
            };
        } catch (err) {
            console.error('Failed to process image:', err);
            return image;
        }
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) return;

        setIsLoading(true);
        setIsProcessing(true);

        try {
            // Load all images first
            const loadedImages = await Promise.all(imageFiles.map((file, idx) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            id: `img-${Date.now()}-${idx}`,
                            file: file,
                            data: e.target.result,
                            name: file.name,
                            fuzz: 25, // Default fuzz value
                            processedData: null,
                            bgColor: null,
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            // Process all images
            const processedImages = await Promise.all(loadedImages.map(processImageWithFuzz));

            setImages(prev => [...prev, ...processedImages]);
            showMessage(t('imported', { count: processedImages.length }));
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [showMessage, t, processImageWithFuzz]);

    // Handle drag and drop
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) return;

        setIsLoading(true);
        setIsProcessing(true);

        try {
            const loadedImages = await Promise.all(imageFiles.map((file, idx) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            id: `img-${Date.now()}-${idx}`,
                            file: file,
                            data: e.target.result,
                            name: file.name,
                            fuzz: 25,
                            processedData: null,
                            bgColor: null,
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            const processedImages = await Promise.all(loadedImages.map(processImageWithFuzz));

            setImages(prev => [...prev, ...processedImages]);
            showMessage(t('imported', { count: processedImages.length }));
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }
    }, [showMessage, t, processImageWithFuzz]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    // Navigation
    const handleNavigate = useCallback((direction) => {
        if (images.length === 0) return;

        const maxIndex = images.length - 1;
        let newIndex = focusIndex;

        switch (direction) {
            case 'left':
                newIndex = Math.max(0, focusIndex - 1);
                break;
            case 'right':
                newIndex = Math.min(maxIndex, focusIndex + 1);
                break;
            case 'up':
                if (focusIndex - gridColumns >= 0) {
                    newIndex = focusIndex - gridColumns;
                }
                break;
            case 'down':
                if (focusIndex + gridColumns <= maxIndex) {
                    newIndex = focusIndex + gridColumns;
                }
                break;
        }

        setFocusIndex(newIndex);
    }, [images.length, focusIndex, gridColumns]);

    // Fuzz adjustment
    const handleFuzzIncrease = useCallback(async () => {
        if (images.length === 0 || focusIndex >= images.length) return;

        const image = images[focusIndex];
        const newFuzz = Math.min(100, image.fuzz + 5);
        if (newFuzz === image.fuzz) return;

        setIsProcessing(true);
        try {
            const updatedImage = { ...image, fuzz: newFuzz };
            const processed = await processImageWithFuzz(updatedImage);

            setImages(prev => prev.map((img, idx) =>
                idx === focusIndex ? processed : img
            ));
            showMessage(t('fuzzIncreased', { value: newFuzz }));
        } finally {
            setIsProcessing(false);
        }
    }, [images, focusIndex, processImageWithFuzz, showMessage, t]);

    const handleFuzzDecrease = useCallback(async () => {
        if (images.length === 0 || focusIndex >= images.length) return;

        const image = images[focusIndex];
        const newFuzz = Math.max(0, image.fuzz - 5);
        if (newFuzz === image.fuzz) return;

        setIsProcessing(true);
        try {
            const updatedImage = { ...image, fuzz: newFuzz };
            const processed = await processImageWithFuzz(updatedImage);

            setImages(prev => prev.map((img, idx) =>
                idx === focusIndex ? processed : img
            ));
            showMessage(t('fuzzDecreased', { value: newFuzz }));
        } finally {
            setIsProcessing(false);
        }
    }, [images, focusIndex, processImageWithFuzz, showMessage, t]);

    // Export functionality
    const handleExport = useCallback(async () => {
        if (images.length === 0) {
            showMessage(t('noImages'));
            return;
        }

        showMessage(t('exporting'));

        try {
            if (images.length === 1) {
                // Single image: download directly
                const image = images[0];
                const baseName = image.name.replace(/\.[^/.]+$/, '');
                const fileName = `${baseName}-nobg.png`;

                // Convert data URL to blob
                const response = await fetch(image.processedData);
                const blob = await response.blob();
                saveAs(blob, fileName);
            } else {
                // Multiple images: create ZIP
                const zip = new JSZip();

                for (const image of images) {
                    const baseName = image.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}-nobg.png`;

                    // Convert data URL to blob
                    const response = await fetch(image.processedData);
                    const blob = await response.blob();
                    zip.file(fileName, blob);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                saveAs(zipBlob, 'images-nobg.zip');
            }

            showMessage(t('exported'));
        } catch (err) {
            showMessage(t('exportError', { message: err.message }));
        }
    }, [images, showMessage, t]);

    // Handle tile click
    const handleTileClick = useCallback((index) => {
        setFocusIndex(index);
    }, []);

    // Set up keyboard navigation
    useKeyboardNavigation({
        onNavigate: handleNavigate,
        onFuzzIncrease: handleFuzzIncrease,
        onFuzzDecrease: handleFuzzDecrease,
        onExport: handleExport,
    });

    return (
        <div
            className="app"
            ref={containerRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <header className="app-header">
                <h1>{t('title')}</h1>
                <div className="header-controls">
                    <button onClick={() => fileInputRef.current?.click()}>
                        {t('addImages')}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <span className="image-count">
                        {images.length}{t('imageCount')}
                    </span>
                    <button onClick={toggleLanguage} className="lang-toggle">
                        {language === 'en' ? 'JA' : 'EN'}
                    </button>
                    <button onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            <main className="main-area">
                {images.length === 0 ? (
                    <div className="drop-zone">
                        {isLoading ? (
                            <p>{t('loading')}</p>
                        ) : (
                            <>
                                <p>{t('dropHere')}</p>
                                <p>{t('orClickButton')}</p>
                            </>
                        )}
                    </div>
                ) : (
                    <ImageGrid
                        images={images}
                        focusIndex={focusIndex}
                        imageSize={imageSize}
                        onTileClick={handleTileClick}
                    />
                )}
            </main>

            <StatusBar
                message={isProcessing ? t('loading') : message}
            />
        </div>
    );
}

export default App;
