export const translations = {
    ja: {
        title: 'LINE Sticker Tools',
        subtitle: 'スタンプ作成を効率化するための専用ツールセット',
        removeBgTitle: 'Remove BG GUI',
        removeBgDesc: '画像の背景を簡単に除去・調整できます。',
        divideCropTitle: 'Divide & Crop GUI',
        divideCropDesc: '画像を自動で分割・切り抜きします。',
        arrangeTitle: 'Arrange GUI',
        arrangeDesc: 'スタンプの並び替えとパッケージングを行います。',
        openTool: 'Open Tool →',
        langEn: 'English',
        langJa: '日本語',

        // Arrange GUI specific
        arrangeAppTitle: 'LINE Sticker Arranger',
        addImages: '画像を追加',
        imageCount: '枚',
        mainSet: 'メイン✓',
        tabSet: 'タブ✓',
        loading: '読み込み中...',
        dropHere: 'ここに画像をドラッグ＆ドロップ',
        orClickButton: 'または「画像を追加」ボタンをクリック',
        // ... (can add more as we migrate specific apps)
    },
    en: {
        title: 'LINE Sticker Tools',
        subtitle: 'Specialized toolset for efficient sticker creation',
        removeBgTitle: 'Remove BG GUI',
        removeBgDesc: 'Easily remove and adjust image backgrounds.',
        divideCropTitle: 'Divide & Crop GUI',
        divideCropDesc: 'Automatically divide and crop images.',
        arrangeTitle: 'Arrange GUI',
        arrangeDesc: 'Reorder and package stickers.',
        openTool: 'Open Tool →',
        langEn: 'English',
        langJa: '日本語',

        // Arrange GUI specific
        arrangeAppTitle: 'LINE Sticker Arranger',
        addImages: 'Add Images',
        imageCount: ' images',
        mainSet: 'Main✓',
        tabSet: 'Tab✓',
        loading: 'Loading...',
        dropHere: 'Drag & Drop images here',
        orClickButton: 'Or click "Add Images" button',
    }
};

export const getInitialLanguage = () => {
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language || navigator.userLanguage || 'en';
        return lang.startsWith('ja') ? 'ja' : 'en';
    }
    return 'en';
};
