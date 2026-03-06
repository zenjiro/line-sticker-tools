import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import ImageGrid from './components/ImageGrid';
import TrashArea from './components/TrashArea';
import StatusBar from './components/StatusBar';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { exportZip } from './utils/exportZip';
import { useLanguage } from './LanguageContext';

function App() {
  const { t, language, toggleLanguage } = useLanguage();

  // Image state
  const [images, setImages] = useState([]);
  const [trashImages, setTrashImages] = useState([]);

  // Selection state
  const [focusIndex, setFocusIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState(null);

  // Cut/paste state
  const [cutIndices, setCutIndices] = useState(new Set());
  const [cutWasImplicit, setCutWasImplicit] = useState(false);

  // Special images
  const [mainImageId, setMainImageId] = useState(null);
  const [tabImageId, setTabImageId] = useState(null);

  // Display state
  const [imageSize, setImageSize] = useState(100);
  const [autoFitSize, setAutoFitSize] = useState(100);
  const [autoZoomMode, setAutoZoomMode] = useState(true);
  const [activeArea, setActiveArea] = useState('main'); // 'main' | 'trash'
  const [trashFocusIndex, setTrashFocusIndex] = useState(0);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const gridRef = useRef(null);

  // Calculate grid columns based on container width
  const [gridColumns, setGridColumns] = useState(8);

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

  // Listen for system theme changes if no manual override
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

  useEffect(() => {
    const updateColumns = () => {
      if (gridRef.current && images.length > 0) {
        const tiles = gridRef.current.querySelectorAll('.image-tile:not(.dummy-tile)');
        if (tiles.length >= 2) {
          const firstTile = tiles[0];
          const firstTop = firstTile.offsetTop;
          let cols = 1;
          for (let i = 1; i < tiles.length; i++) {
            if (tiles[i].offsetTop === firstTop) {
              cols++;
            } else {
              break;
            }
          }
          setGridColumns(Math.max(1, cols));
        }
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [imageSize, images.length]);

  // Auto-scroll to focused item
  useEffect(() => {
    if (activeArea === 'main') {
      const el = document.getElementById(`tile-${focusIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [focusIndex, activeArea]);

  // Auto-scroll to focused item in trash
  useEffect(() => {
    if (activeArea === 'trash') {
      const el = document.getElementById(`trash-tile-${trashFocusIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [trashFocusIndex, activeArea]);

  // Calculate auto-fit size when images load or trash visibility changes
  useEffect(() => {
    if (!autoZoomMode) return;
    if (images.length > 0 && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 40;
      // Reserve space: 150 if no trash, 300 if trash logic
      // Actually Status bar height (40) + Header (60) + Padding (40) = ~140.
      // Trash area height is ~100px.
      // Let's say reserved = 160 + (trashImages.length > 0 ? 120 : 0)
      const reservedSpace = 160 + (trashImages.length > 0 ? 120 : 0);
      const containerHeight = window.innerHeight - reservedSpace;

      const totalImages = images.length + 1; // +1 for dummy

      // Try different sizes to find one that fits all images
      for (let size = 200; size >= 50; size -= 10) {
        const cols = Math.floor(containerWidth / (size + 8));
        const rows = Math.ceil(totalImages / cols);
        const totalHeight = rows * (size + 8);
        if (totalHeight <= containerHeight && cols >= 1) {
          setAutoFitSize(size);
          setImageSize(size);
          // If we found a fit, break
          break;
        }
      }
    }
  }, [images.length, trashImages.length, autoZoomMode]);

  // Show message temporarily
  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    setIsLoading(true);
    Promise.all(imageFiles.map((file, idx) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `img-${Date.now()}-${idx}`,
            file: file,
            data: e.target.result,
            originalIndex: images.length + idx,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    })).then((newImages) => {
      setImages(prev => [...prev, ...newImages]);
      setIsLoading(false);
      showMessage(t('imported', { count: newImages.length }));
    });
  }, [images.length, showMessage, t]);

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    setIsLoading(true);
    Promise.all(imageFiles.map((file, idx) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `img-${Date.now()}-${idx}`,
            file: file,
            data: e.target.result,
            originalIndex: images.length + idx,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    })).then((newImages) => {
      setImages(prev => [...prev, ...newImages]);
      setIsLoading(false);
      showMessage(t('imported', { count: newImages.length }));
    });
  }, [images.length, showMessage, t]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Check if selection is continuous
  const isSelectionContinuous = useCallback(() => {
    if (selectedIndices.size === 0) return false;
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 1) return false;
    }
    return true;
  }, [selectedIndices]);

  // Move selected images
  // Implicit selection if nothing selected
  const moveSelected = useCallback((direction) => {
    let effectiveSelection = selectedIndices;
    // Safety check: if we have a selection but focus is outside it, just move focus to selection
    if (selectedIndices.size > 0 && !selectedIndices.has(focusIndex)) {
      const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
      const lastSelected = sorted[sorted.length - 1];
      setFocusIndex(lastSelected);
      return;
    }

    let isImplicit = false;
    if (selectedIndices.size === 0) {
      effectiveSelection = new Set([focusIndex]);
      isImplicit = true;
    }

    if (effectiveSelection.size === 0) return;

    // Check continuous using effectiveSelection
    const sorted = Array.from(effectiveSelection).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 1) {
        showMessage(t('continuousSelection'));
        return;
      }
    }

    // Proceed with sorted
    const minIdx = sorted[0];
    const maxIdx = sorted[sorted.length - 1];

    if (direction === 'left' && minIdx === 0) return;
    if (direction === 'right' && maxIdx >= images.length - 1) return;
    if (direction === 'up' && minIdx - gridColumns < 0) return;
    if (direction === 'down' && maxIdx + gridColumns >= images.length) return;

    const newImages = [...images];
    let newSelectedIdxs = new Set();
    let newFocusIdx = focusIndex;

    const itemsToMove = sorted.map(i => images[i]);

    // Remove items
    for (let i = sorted.length - 1; i >= 0; i--) {
      newImages.splice(sorted[i], 1);
    }

    // Calculate insert position
    let insertPos = minIdx;
    if (direction === 'left') insertPos = minIdx - 1;
    else if (direction === 'right') insertPos = minIdx + 1;
    else if (direction === 'up') insertPos = minIdx - gridColumns;
    else if (direction === 'down') insertPos = minIdx + gridColumns;

    newImages.splice(insertPos, 0, ...itemsToMove);

    // Update selection/focus
    itemsToMove.forEach((_, i) => newSelectedIdxs.add(insertPos + i));

    // Focus follows relative position
    const focusOffset = focusIndex - minIdx;
    newFocusIdx = insertPos + focusOffset;

    setImages(newImages);
    if (isImplicit) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(newSelectedIdxs);
    }
    setFocusIndex(newFocusIdx);
  }, [images, selectedIndices, focusIndex, gridColumns, showMessage, t]);

  // Cut operation
  const handleCut = useCallback(() => {
    let targets = selectedIndices;
    let isImplicit = false;
    if (targets.size === 0) {
      targets = new Set([focusIndex]);
      isImplicit = true;
    }

    if (targets.size === 0 || focusIndex >= images.length) { // Check valid logic
      showMessage(t('selectImage'));
      return;
    }
    setCutIndices(new Set(targets));
    setCutWasImplicit(isImplicit);
    showMessage(t('cutImages', { count: targets.size }));
  }, [selectedIndices, focusIndex, images.length, showMessage, t]);

  // Paste operation
  const handlePaste = useCallback(() => {
    if (cutIndices.size === 0) {
      showMessage(t('noCutImages'));
      return;
    }

    const cutImages = Array.from(cutIndices)
      .sort((a, b) => a - b)
      .map(i => images[i]);

    const remainingImages = images.filter((_, i) => !cutIndices.has(i));

    // Calculate insert position
    let insertPos = focusIndex;
    // Adjust for removed items before focus
    const removedBefore = Array.from(cutIndices).filter(i => i < focusIndex).length;
    insertPos = Math.max(0, insertPos - removedBefore);

    const newImages = [
      ...remainingImages.slice(0, insertPos),
      ...cutImages,
      ...remainingImages.slice(insertPos)
    ];

    setImages(newImages);
    setCutIndices(new Set());
    setSelectedIndices(new Set());
    showMessage(t('pastedImages', { count: cutImages.length }));
  }, [cutIndices, images, focusIndex, showMessage, t]);

  // Cancel cut
  const handleCancelCut = useCallback(() => {
    if (cutIndices.size > 0) {
      if (!cutWasImplicit) {
        setSelectedIndices(new Set(cutIndices));
      } else {
        setSelectedIndices(new Set());
      }
      setCutIndices(new Set());
      setCutWasImplicit(false);
      showMessage(t('cutCancelled'));
    } else if (selectedIndices.size > 0) {
      // Esc to unselect
      setSelectedIndices(new Set());
    }
  }, [cutIndices, selectedIndices, showMessage, t]);

  // Delete to trash
  const handleDelete = useCallback(() => {
    if (activeArea === 'main') {
      if (focusIndex >= images.length) return; // dummy tile

      // Safety check: if we have a selection but focus is outside it, just move focus to selection
      if (selectedIndices.size > 0 && !selectedIndices.has(focusIndex)) {
        const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
        const lastSelected = sorted[sorted.length - 1];
        setFocusIndex(lastSelected);
        return;
      }

      const targets = selectedIndices.size > 0 ? selectedIndices : new Set([focusIndex]);

      const sortedTargets = Array.from(targets).sort((a, b) => b - a); // Descending for deletion

      const newImages = [...images];
      const newTrash = [...trashImages];

      sortedTargets.forEach(idx => {
        if (idx < newImages.length) {
          newTrash.push({ ...newImages[idx], originalMainIndex: idx });
          newImages.splice(idx, 1);
        }
      });

      setTrashImages(newTrash);
      setImages(newImages);
      setSelectedIndices(new Set()); // Clear selection

      // Update focus
      // If we deleted focusIndex, move to prev?
      // If we deleted selection, focus should essentially stay or move to nearest?
      // Logic: if current focus was deleted (likely), move to closest valid.
      // Easiest: keep focusIndex bounded.
      setFocusIndex(prev => Math.min(newImages.length, prev)); // Can be end if all deleted?
      // Actually dummy is always at end.

      if (focusIndex >= newImages.length) { // if focus was on dummy or beyond
        setFocusIndex(Math.max(0, newImages.length - 1)); // -1? No, dummy is at length.
        // If list empty, focus 0 (dummy).
        // If list has 5. Max index 4. Dummy 5.
        setFocusIndex(Math.min(focusIndex, newImages.length));
      }

      showMessage(t('trashMoved', { count: targets.size }));
    } else {
      // Restore from trash
      if (trashFocusIndex >= trashImages.length) return;

      const imageToRestore = trashImages[trashFocusIndex];
      const restoreIdx = Math.min(imageToRestore.originalMainIndex, images.length);

      setImages(prev => [
        ...prev.slice(0, restoreIdx),
        imageToRestore,
        ...prev.slice(restoreIdx)
      ]);
      setTrashImages(prev => prev.filter((_, i) => i !== trashFocusIndex));

      // If trash becomes empty, switch back to main area and focus the restored item (or end)
      if (trashImages.length <= 1) { // We just removed the last one
        setActiveArea('main');
        setFocusIndex(Math.min(images.length, restoreIdx)); // Focus the restored item
        // Wait, images.length is BEFORE update here? No, setImages is async but calculation is based on prev + current.
        // Actually, better to just focus the end of main list or where we inserted.
        // Effect dependency might handle it but let's be explicit.
        // Since we are adding an item, the new index will be valid.
      } else if (trashFocusIndex >= trashImages.length - 1) {
        setTrashFocusIndex(Math.max(0, trashImages.length - 2));
      }
      showMessage(t('restored'));
    }
  }, [activeArea, focusIndex, trashFocusIndex, images, trashImages, showMessage, t]);

  // Set main image
  const handleSetMain = useCallback(() => {
    if (activeArea === 'main' && focusIndex < images.length) {
      setMainImageId(images[focusIndex].id);
      showMessage(t('mainSetSuccess'));
    }
  }, [activeArea, focusIndex, images, showMessage, t]);

  // Set tab image
  const handleSetTab = useCallback(() => {
    if (activeArea === 'main' && focusIndex < images.length) {
      setTabImageId(images[focusIndex].id);
      showMessage(t('tabSetSuccess'));
    }
  }, [activeArea, focusIndex, images, showMessage, t]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setAutoZoomMode(false);
    setImageSize(prev => Math.min(300, prev + 20));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAutoZoomMode(false);
    setImageSize(prev => Math.max(50, prev - 20));
  }, []);

  const handleZoomReset = useCallback(() => {
    setAutoZoomMode(true);
    setImageSize(autoFitSize);
  }, [autoFitSize]);

  // Export
  const handleExport = useCallback(async () => {
    const validCounts = [8, 16, 24, 32, 40];
    if (!validCounts.includes(images.length)) {
      showMessage(t('invalidCount', { count: images.length }));
      return;
    }
    if (!mainImageId) {
      showMessage(t('setMain'));
      return;
    }
    if (!tabImageId) {
      showMessage(t('setTab'));
      return;
    }

    showMessage(t('exporting'));
    try {
      const mainImage = images.find(img => img.id === mainImageId);
      const tabImage = images.find(img => img.id === tabImageId);
      await exportZip(images, mainImage, tabImage);
      showMessage(t('exported'));
    } catch (err) {
      showMessage(t('exportError', { message: err.message }));
    }
  }, [images, mainImageId, tabImageId, showMessage, t]);

  // Navigation
  const handleNavigate = useCallback((direction, shift) => {
    const maxIndex = images.length; // include dummy tile

    if (activeArea === 'main') {
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
        case 'down': {
          const targetIndex = focusIndex + gridColumns;
          const lastRowStart = Math.floor(images.length / gridColumns) * gridColumns;

          if (targetIndex <= maxIndex) {
            newIndex = targetIndex;
          } else if (focusIndex >= lastRowStart) {
            if (trashImages.length > 0) {
              setActiveArea('trash');
              setTrashFocusIndex(0);
              return;
            }
          } else {
            newIndex = maxIndex;
          }
          break;
        }
      }

      if (newIndex !== focusIndex) {
        setFocusIndex(newIndex);

        if (shift && newIndex < images.length) {
          // Extend selection
          if (selectionAnchor === null) {
            setSelectionAnchor(focusIndex < images.length ? focusIndex : null);
          }

          const anchor = selectionAnchor !== null ? selectionAnchor : focusIndex;
          if (anchor < images.length) {
            const start = Math.min(anchor, newIndex);
            const end = Math.max(anchor, newIndex);
            const newSelected = new Set();
            for (let i = start; i <= end && i < images.length; i++) {
              newSelected.add(i);
            }
            setSelectedIndices(newSelected);
          }
        } else if (!shift) {
          setSelectionAnchor(null);
        }
      }
    } else {
      // Trash area navigation
      const trashMaxIndex = trashImages.length - 1;

      switch (direction) {
        case 'left':
          setTrashFocusIndex(Math.max(0, trashFocusIndex - 1));
          break;
        case 'right':
          setTrashFocusIndex(Math.min(trashMaxIndex, trashFocusIndex + 1));
          break;
        case 'up':
          setActiveArea('main');
          break;
        case 'down':
          break;
      }
    }
  }, [activeArea, focusIndex, trashFocusIndex, images.length, trashImages.length, gridColumns, selectionAnchor]);

  // Toggle selection with space
  const handleToggleSelection = useCallback(() => {
    if (activeArea === 'main' && focusIndex < images.length) {
      setSelectedIndices(prev => {
        const newSet = new Set(prev);
        if (newSet.has(focusIndex)) {
          newSet.delete(focusIndex);
        } else {
          newSet.add(focusIndex);
        }
        return newSet;
      });
    }
  }, [activeArea, focusIndex, images.length]);

  // Set up keyboard navigation
  useKeyboardNavigation({
    onNavigate: handleNavigate,
    onMove: moveSelected,
    onToggleSelection: handleToggleSelection,
    onCut: handleCut,
    onPaste: handlePaste,
    onCancel: handleCancelCut,
    onDelete: handleDelete,
    onSetMain: handleSetMain,
    onSetTab: handleSetTab,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
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
            {mainImageId && ` | ${t('mainSet')}`}
            {tabImageId && ` | ${t('tabSet')}`}
          </span>
          <button onClick={toggleLanguage} className="lang-toggle">
            {language === 'en' ? 'JA' : 'EN'}
          </button>
          <button onClick={toggleTheme} title="テーマ切り替え">
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
            ref={gridRef}
            images={images}
            focusIndex={activeArea === 'main' ? focusIndex : -1}
            selectedIndices={selectedIndices}
            cutIndices={cutIndices}
            mainImageId={mainImageId}
            tabImageId={tabImageId}
            imageSize={imageSize}
          />
        )}
      </main>

      {trashImages.length > 0 && (
        <TrashArea
          images={trashImages}
          focusIndex={activeArea === 'trash' ? trashFocusIndex : -1}
          imageSize={Math.min(80, imageSize)}
        />
      )}

      <StatusBar
        message={message}
        imageCount={images.length}
        hasMain={!!mainImageId}
        hasTab={!!tabImageId}
      />
    </div>
  );
}

export default App;
