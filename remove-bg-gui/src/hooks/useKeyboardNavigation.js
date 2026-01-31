import { useEffect } from 'react';

/**
 * Hook for keyboard navigation and shortcuts.
 * @param {Object} handlers - Event handlers
 */
export function useKeyboardNavigation({
    onNavigate,
    onFuzzIncrease,
    onFuzzDecrease,
    onExport,
    onExpand,
    onCollapse,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if focus is in an input element
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    onNavigate?.('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    onNavigate?.('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    onNavigate?.('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    onNavigate?.('down');
                    break;
                case 'j':
                case 'J':
                case 'n':
                case 'N':
                    e.preventDefault();
                    onFuzzIncrease?.();
                    break;
                case 'k':
                case 'K':
                case 'p':
                case 'P':
                    e.preventDefault();
                    onFuzzDecrease?.();
                    break;
                case 'e':
                case 'E':
                    e.preventDefault();
                    onExport?.();
                    break;
                case 'Enter':
                    e.preventDefault();
                    onExpand?.();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onCollapse?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNavigate, onFuzzIncrease, onFuzzDecrease, onExport, onExpand, onCollapse]);
}
