import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import ImageCard from './components/ImageCard';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { exportZip } from './utils/exportZip';
import { useLanguage } from './LanguageContext';

function App() {
  const { t, language, toggleLanguage } = useLanguage();

  const [images, setImages] = useState([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [imageSize, setImageSize] = useState(200);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Show message temporarily
  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }, []);

  // Auto-scroll
  useEffect(() => {
    // IDs are generated, need to find by stable ID or manage refs.
    // In ImageCard we used `id={`card-${image.id}`}`.
    if (images.length > 0 && images[focusIndex]) {
      const el = document.getElementById(`card-${images[focusIndex].id}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [focusIndex, images]);

  // Auto fit size
  useEffect(() => {
    if (images.length > 0 && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 40;
      const containerHeight = window.innerHeight - 100; // Header + Status

      // Simple heuristic: try to fit as many as possible or meaningful size
      // We want "display size automatically adjusted to fit in screen"
      // If 1 image, max size.
      // If multiple, grid.
      // Let's pick a size that allows a reasonable grid.

      let bestSize = 200;
      for (let s = 400; s >= 100; s -= 10) {
        const cols = Math.floor(containerWidth / (s + 8));
        const rows = Math.ceil(images.length / cols);
        if (rows * (s + 8) <= containerHeight) {
          bestSize = s;
          break;
        }
      }
      setImageSize(bestSize);
    }
  }, [images.length]);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    setIsLoading(true);
    Promise.all(imageFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: file,
            data: e.target.result,
            name: file.name,
            cols: 3,
            rows: 3
          });
        };
        reader.readAsDataURL(file);
      });
    })).then((newImages) => {
      setImages(prev => [...prev, ...newImages]);
      setIsLoading(false);
      showMessage(t('imageCount', { count: newImages.length })); // Actually just says "images", update logic
    });
  }, [showMessage, t]);

  const handleNavigate = useCallback((direction) => {
    if (images.length === 0) return;

    let newIndex = focusIndex;
    // Need grid columns to navigate up/down
    // We can calculate current cols based on container width
    let gridCols = 1;
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 40;
      gridCols = Math.floor(containerWidth / (imageSize + 8)) || 1;
    }

    switch (direction) {
      case 'left':
        newIndex = Math.max(0, focusIndex - 1);
        break;
      case 'right':
        newIndex = Math.min(images.length - 1, focusIndex + 1);
        break;
      case 'up':
        newIndex = Math.max(0, focusIndex - gridCols);
        break;
      case 'down':
        newIndex = Math.min(images.length - 1, focusIndex + gridCols);
        break;
    }
    setFocusIndex(newIndex);
  }, [focusIndex, images.length, imageSize]);

  const handleAdjustH = useCallback((delta) => {
    if (images.length === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const img = { ...newImages[focusIndex] };
      img.cols = Math.max(1, img.cols + delta);
      newImages[focusIndex] = img;
      return newImages;
    });
  }, [images.length, focusIndex]);

  const handleAdjustV = useCallback((delta) => {
    if (images.length === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const img = { ...newImages[focusIndex] };
      img.rows = Math.max(1, img.rows + delta);
      newImages[focusIndex] = img;
      return newImages;
    });
  }, [images.length, focusIndex]);

  const handleExport = useCallback(async () => {
    if (images.length === 0) return;
    setIsLoading(true);
    showMessage(t('exporting'));
    try {
      await exportZip(images);
      showMessage(t('exported'));
    } catch (e) {
      console.error(e);
      showMessage(t('exportError', { message: e.message }));
    } finally {
      setIsLoading(false);
    }
  }, [images, showMessage, t]);

  useKeyboardNavigation({
    onNavigate: handleNavigate,
    onAdjustH: handleAdjustH,
    onAdjustV: handleAdjustV,
    onExport: handleExport
  });

  return (
    <div className="app">
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
          <button onClick={toggleTheme} title="テーマ切り替え">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="main-area" ref={containerRef}>
        {images.length === 0 ? (
          <div className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload({ target: { files: e.dataTransfer.files } });
            }}
          >
            {isLoading ? <p>{t('loading')}</p> : (
              <>
                <p>{t('dropHere')}</p>
                <p>{t('orClickButton')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="image-grid-container" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            width: '100%'
          }}>
            {images.map((img, idx) => (
              <ImageCard
                key={img.id}
                image={img}
                isFocused={idx === focusIndex}
                size={imageSize}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="status-bar">
        <div className="message">{message}</div>
        <div className="shortcuts">{t('shortcuts')}</div>
      </footer>
    </div>
  );
}

export default App;
