import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../LanguageContext';
import Layout from '../../layouts/Layout';

export default function Home() {
    const { t } = useLanguage();
    const [focusIndex, setFocusIndex] = useState(0);

    const tools = [
        { id: 'remove-bg', path: './remove-bg/', icon: '🎨', titleKey: 'removeBgTitle', descKey: 'removeBgDesc' },
        { id: 'divide-crop', path: './divide-crop/', icon: '✂️', titleKey: 'divideCropTitle', descKey: 'divideCropDesc' },
        { id: 'arrange', path: './arrange/', icon: '📦', titleKey: 'arrangeTitle', descKey: 'arrangeDesc' }
    ];

    const handleNavigate = useCallback((direction) => {
        if (direction === 'left') {
            setFocusIndex(prev => Math.max(0, prev - 1));
        } else if (direction === 'right') {
            setFocusIndex(prev => Math.min(tools.length - 1, prev + 1));
        }
    }, [tools.length]);

    const handleSelect = useCallback(() => {
        window.location.href = tools[focusIndex].path;
    }, [focusIndex, tools]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    handleNavigate('left');
                    break;
                case 'ArrowRight':
                    handleNavigate('right');
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    handleSelect();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNavigate, handleSelect]);

    return (
        <Layout title="LINE Sticker Tools">
            <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <header>
                    <h1>{t('title')}</h1>
                    <p className="subtitle">{t('subtitle')}</p>
                </header>

                <div className="card-grid">
                    {tools.map((tool, index) => (
                        <a
                            key={tool.id}
                            href={tool.path}
                            className={`card ${index === focusIndex ? 'is-focused' : ''}`}
                            onClick={(e) => {
                                // Update focus on click but allow navigation
                                setFocusIndex(index);
                            }}
                        >
                            <div className="card-content">
                                <span className="card-icon">{tool.icon}</span>
                                <h2>{t(tool.titleKey)}</h2>
                                <p>{t(tool.descKey)}</p>
                                <div className="card-arrow">{t('openTool')}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="home-bottom-bar" style={{
                padding: '12px 24px',
                background: 'var(--header-bg)',
                borderTop: '1px solid var(--border-color)',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box'
            }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {t('homeShortcuts')}
                </div>
            </div>
        </Layout>
    );
}
