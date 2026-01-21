import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import ImageGrid from './components/ImageGrid';
import TrashArea from './components/TrashArea';
import StatusBar from './components/StatusBar';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { exportZip } from './utils/exportZip';

function App() {
  // Image state
  const [images, setImages] = useState([]);
  const [trashImages, setTrashImages] = useState([]);

  // Selection state
  const [focusIndex, setFocusIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState(null);

  // Cut/paste state
  const [cutIndices, setCutIndices] = useState(new Set());

  // Special images
  const [mainImageId, setMainImageId] = useState(null);
  const [tabImageId, setTabImageId] = useState(null);

  // Display state
  const [imageSize, setImageSize] = useState(100);
  const [autoFitSize, setAutoFitSize] = useState(100);
  const [activeArea, setActiveArea] = useState('main'); // 'main' | 'trash'
  const [trashFocusIndex, setTrashFocusIndex] = useState(0);

  // Message for user feedback
  const [message, setMessage] = useState('');

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate grid columns based on container width
  const [gridColumns, setGridColumns] = useState(8);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 40; // padding
        const cols = Math.floor(containerWidth / (imageSize + 8)); // gap
        setGridColumns(Math.max(1, cols));
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [imageSize]);

  // Auto-scroll to focused item
  useEffect(() => {
    if (activeArea === 'main') {
      const el = document.getElementById(`tile-${focusIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [focusIndex, activeArea]);

  // Calculate auto-fit size when images load or trash visibility changes
  useEffect(() => {
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
  }, [images.length, trashImages.length]);

  // Show message temporarily
  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

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
      showMessage(`${newImages.length}枚の画像を読み込みました`);
    });
  }, [images.length, showMessage]);

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

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
      showMessage(`${newImages.length}枚の画像を読み込みました`);
    });
  }, [images.length, showMessage]);

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

    if (selectedIndices.size === 0) {
      effectiveSelection = new Set([focusIndex]);
    }

    if (effectiveSelection.size === 0) return;

    // Check continuous using effectiveSelection
    const sorted = Array.from(effectiveSelection).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 1) {
        showMessage('連続した範囲を選択してください');
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
    setSelectedIndices(newSelectedIdxs);
    setFocusIndex(newFocusIdx);
  }, [images, selectedIndices, focusIndex, gridColumns, showMessage]);

  // Cut operation
  const handleCut = useCallback(() => {
    let targets = selectedIndices;
    if (targets.size === 0) {
      targets = new Set([focusIndex]);
    }

    if (targets.size === 0 || focusIndex >= images.length) { // Check valid logic
      showMessage('画像を選択してください');
      return;
    }
    setCutIndices(new Set(targets));
    showMessage(`${targets.size}枚の画像をカットしました`);
  }, [selectedIndices, focusIndex, images.length, showMessage]);

  // Paste operation
  const handlePaste = useCallback(() => {
    if (cutIndices.size === 0) {
      showMessage('カットされた画像がありません');
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
    showMessage(`${cutImages.length}枚の画像を挿入しました`);
  }, [cutIndices, images, focusIndex, showMessage]);

  // Cancel cut
  const handleCancelCut = useCallback(() => {
    if (cutIndices.size > 0) {
      setSelectedIndices(new Set(cutIndices));
      setCutIndices(new Set());
      showMessage('カットを取り消しました');
    } else if (selectedIndices.size > 0) {
      // Esc to unselect
      setSelectedIndices(new Set());
    }
  }, [cutIndices, selectedIndices, showMessage]);

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

      showMessage(`${targets.size}枚をゴミ箱に移動しました`);
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
      if (trashFocusIndex >= trashImages.length - 1) {
        setTrashFocusIndex(Math.max(0, trashImages.length - 2));
      }
      showMessage('元の位置に復元しました');
    }
  }, [activeArea, focusIndex, trashFocusIndex, images, trashImages, showMessage]);

  // Set main image
  const handleSetMain = useCallback(() => {
    if (activeArea === 'main' && focusIndex < images.length) {
      setMainImageId(images[focusIndex].id);
      showMessage('メイン画像に設定しました');
    }
  }, [activeArea, focusIndex, images, showMessage]);

  // Set tab image
  const handleSetTab = useCallback(() => {
    if (activeArea === 'main' && focusIndex < images.length) {
      setTabImageId(images[focusIndex].id);
      showMessage('タブ画像に設定しました');
    }
  }, [activeArea, focusIndex, images, showMessage]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setImageSize(prev => Math.min(300, prev + 20));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageSize(prev => Math.max(50, prev - 20));
  }, []);

  const handleZoomReset = useCallback(() => {
    setImageSize(autoFitSize);
  }, [autoFitSize]);

  // Export
  const handleExport = useCallback(async () => {
    const validCounts = [8, 16, 24, 32, 40];
    if (!validCounts.includes(images.length)) {
      showMessage(`画像数が無効です（${images.length}枚）。8, 16, 24, 32, 40枚のいずれかにしてください`);
      return;
    }
    if (!mainImageId) {
      showMessage('メイン画像を設定してください（Mキー）');
      return;
    }
    if (!tabImageId) {
      showMessage('タブ画像を設定してください（Tキー）');
      return;
    }

    showMessage('エクスポート中...');
    try {
      const mainImage = images.find(img => img.id === mainImageId);
      const tabImage = images.find(img => img.id === tabImageId);
      await exportZip(images, mainImage, tabImage);
      showMessage('ZIPファイルをダウンロードしました');
    } catch (err) {
      showMessage(`エクスポートエラー: ${err.message}`);
    }
  }, [images, mainImageId, tabImageId, showMessage]);

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
        case 'down':
          if (focusIndex + gridColumns <= maxIndex) {
            newIndex = focusIndex + gridColumns;
          } else if (trashImages.length > 0) {
            setActiveArea('trash');
            setTrashFocusIndex(0);
            return;
          }
          break;
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
        <h1>LINE Sticker Arranger</h1>
        <div className="header-controls">
          <button onClick={() => fileInputRef.current?.click()}>
            画像を追加
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
            {images.length}枚
            {mainImageId && ' | メイン✓'}
            {tabImageId && ' | タブ✓'}
          </span>
        </div>
      </header>

      <main className="main-area">
        {images.length === 0 ? (
          <div className="drop-zone">
            <p>ここに画像をドラッグ＆ドロップ</p>
            <p>または「画像を追加」ボタンをクリック</p>
          </div>
        ) : (
          <ImageGrid
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
