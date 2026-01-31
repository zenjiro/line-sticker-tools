import { useLanguage } from '../../LanguageContext';
import Layout from '../../layouts/Layout';

export default function Home() {
    const { t } = useLanguage();

    return (
        <Layout title="LINE Sticker Tools">
            <div className="container">
                <header>
                    <h1>{t('title')}</h1>
                    <p className="subtitle">{t('subtitle')}</p>
                </header>

                <div className="card-grid">
                    <a href="./remove-bg/" className="card">
                        <div className="card-content">
                            <span className="card-icon">🎨</span>
                            <h2>{t('removeBgTitle')}</h2>
                            <p>{t('removeBgDesc')}</p>
                            <div className="card-arrow">{t('openTool')}</div>
                        </div>
                    </a>

                    <a href="./divide-crop/" className="card">
                        <div className="card-content">
                            <span className="card-icon">✂️</span>
                            <h2>{t('divideCropTitle')}</h2>
                            <p>{t('divideCropDesc')}</p>
                            <div className="card-arrow">{t('openTool')}</div>
                        </div>
                    </a>

                    <a href="./arrange/" className="card">
                        <div className="card-content">
                            <span className="card-icon">📦</span>
                            <h2>{t('arrangeTitle')}</h2>
                            <p>{t('arrangeDesc')}</p>
                            <div className="card-arrow">{t('openTool')}</div>
                        </div>
                    </a>
                </div>
            </div>
        </Layout>
    );
}
