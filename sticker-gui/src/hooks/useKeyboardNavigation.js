import { useEffect, useCallback } from 'react';

export function useKeyboardNavigation({
    onNavigate,
    onMove,
    onToggleSelection,
    onCut,
    onPaste,
    onCancel,
    onDelete,
    onSetMain,
    onSetTab,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onExport,
}) {
    const handleKeyDown = useCallback((e) => {
        // Prevent default for handled keys
        const key = e.key.toLowerCase();

        // Arrow key navigation
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
            e.preventDefault();

            const direction = key.replace('arrow', '');

            if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                // Alt + Arrow: Move selected images
                onMove(direction);
            } else if (e.shiftKey && !e.altKey && !e.ctrlKey) {
                // Shift + Arrow: Extend selection
                onNavigate(direction, true);
            } else if (!e.altKey && !e.shiftKey && !e.ctrlKey) {
                // Plain Arrow: Navigate focus
                onNavigate(direction, false);
            }
            return;
        }

        // Space: Toggle selection
        if (key === ' ' || e.code === 'Space') {
            e.preventDefault();
            onToggleSelection();
            return;
        }

        // Ctrl+X: Cut
        if (e.ctrlKey && key === 'x') {
            e.preventDefault();
            onCut();
            return;
        }

        // Ctrl+V: Paste
        if (e.ctrlKey && key === 'v') {
            e.preventDefault();
            onPaste();
            return;
        }

        // Escape: Cancel cut
        if (key === 'escape') {
            e.preventDefault();
            onCancel();
            return;
        }

        // Delete or Backspace: Delete/Restore
        if (key === 'delete' || key === 'backspace') {
            e.preventDefault();
            onDelete();
            return;
        }

        // M: Set as main image
        if (key === 'm' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            onSetMain();
            return;
        }

        // T: Set as tab image
        if (key === 't' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            onSetTab();
            return;
        }

        // Ctrl++ or Ctrl+= or Ctrl+; (Japanese keyboard): Zoom in
        if (e.ctrlKey && (key === '+' || key === '=' || e.code === 'Equal' || key === ';' || e.code === 'Semicolon')) {
            e.preventDefault();
            onZoomIn();
            return;
        }

        // Ctrl+-: Zoom out
        if (e.ctrlKey && (key === '-' || e.code === 'Minus')) {
            e.preventDefault();
            onZoomOut();
            return;
        }

        // Ctrl+0: Reset zoom
        if (e.ctrlKey && (key === '0' || e.code === 'Digit0')) {
            e.preventDefault();
            onZoomReset();
            return;
        }

        // E: Export
        if (key === 'e' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            onExport();
            return;
        }
    }, [onNavigate, onMove, onToggleSelection, onCut, onPaste, onCancel, onDelete, onSetMain, onSetTab, onZoomIn, onZoomOut, onZoomReset, onExport]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
