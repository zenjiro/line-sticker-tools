const translations = {
    en: {
        title: 'Remove Background',
        addImages: 'Add Images',
        dropHere: 'Drop images here',
        orClickButton: 'or click the button above',
        loading: 'Loading...',
        imageCount: ' images',
        imported: '{count} image(s) imported',
        fuzzLabel: 'Fuzz',
        fuzzIncreased: 'Fuzz increased to {value}%',
        fuzzDecreased: 'Fuzz decreased to {value}%',
        exporting: 'Exporting...',
        exported: 'Export complete!',
        exportError: 'Export failed: {message}',
        noImages: 'No images to export',
        keyboardHelp: 'Keyboard: ←↑→↓ Navigate | J/N Increase fuzz | K/P Decrease fuzz | E Export',
    },
    ja: {
        title: '背景削除',
        addImages: '画像を追加',
        dropHere: 'ここに画像をドロップ',
        orClickButton: 'または上のボタンをクリック',
        loading: '読み込み中...',
        imageCount: '枚',
        imported: '{count}枚の画像を読み込みました',
        fuzzLabel: 'ファジー',
        fuzzIncreased: 'ファジー値を{value}%に増加',
        fuzzDecreased: 'ファジー値を{value}%に減少',
        exporting: 'エクスポート中...',
        exported: 'エクスポート完了！',
        exportError: 'エクスポート失敗: {message}',
        noImages: 'エクスポートする画像がありません',
        keyboardHelp: 'キーボード: ←↑→↓ 移動 | J/N ファジー増 | K/P ファジー減 | E エクスポート',
    },
};

export function getTranslation(language, key, params = {}) {
    let text = translations[language]?.[key] || translations.en[key] || key;
    Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
    });
    return text;
}

export default translations;
