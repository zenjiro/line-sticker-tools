export const translations = {
    ja: {
        title: '画像分割・クロップツール',
        addImages: '画像を追加',
        imageCount: '枚',
        loading: '読み込み中...',
        dropHere: 'ここに画像をドラッグ＆ドロップ',
        orClickButton: 'または「画像を追加」ボタンをクリック',
        exporting: 'エクスポート中...',
        exported: 'ZIPファイルをダウンロードしました',
        exportError: 'エクスポートエラー: {message}',

        // Controls
        divisions: '分割数: 横{cols} x 縦{rows}',

        // StatusBar
        shortcuts: '矢印:フォーカス / H/L:横分割 / J/K:縦分割 / E:ZIP保存',

        // Language Toggle
        langEn: 'English',
        langJa: '日本語',
    },
    en: {
        title: 'Image Divide & Crop Tool',
        addImages: 'Add Images',
        imageCount: ' images',
        loading: 'Loading...',
        dropHere: 'Drag & Drop images here',
        orClickButton: 'Or click "Add Images" button',
        exporting: 'Exporting...',
        exported: 'Downloaded ZIP file',
        exportError: 'Export error: {message}',

        // Controls
        divisions: 'Split: {cols}W x {rows}H',

        // StatusBar
        shortcuts: 'Arrows:Focus / H/L:Width / J/K:Height / E:Export ZIP',

        // Language Toggle
        langEn: 'English',
        langJa: '日本語',
    }
};

export const getInitialLanguage = () => {
    // If running in browser check navigator, otherwise default to en
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language || navigator.userLanguage || 'en';
        return lang.startsWith('ja') ? 'ja' : 'en';
    }
    return 'en';
};
