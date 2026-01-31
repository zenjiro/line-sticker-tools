import { useEffect, useCallback } from 'react';

export function useKeyboardNavigation({
    onNavigate,
    onAdjustH,
    onAdjustV,
    onExport,
}) {
    const handleKeyDown = useCallback((e) => {
        const key = e.key.toLowerCase();

        // Arrow key navigation
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
            e.preventDefault();
            const direction = key.replace('arrow', '');
            onNavigate(direction);
            return;
        }

        // H/L: Horizontal adjustment
        if (key === 'h') {
            e.preventDefault();
            onAdjustH(-1); // Decrease
            return;
        }
        if (key === 'l') {
            e.preventDefault();
            onAdjustH(1); // Increase
            return;
        }

        // J/K: Vertical adjustment
        if (key === 'k') {
            e.preventDefault();
            onAdjustV(-1); // Decrease
            return;
        }
        if (key === 'j') {
            e.preventDefault();
            onAdjustV(1); // Increase
            return;
        }

        // E: Export
        if (key === 'e' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            onExport();
            return;
        }
    }, [onNavigate, onAdjustH, onAdjustV, onExport]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
