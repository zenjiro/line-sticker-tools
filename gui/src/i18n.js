export const translations = {
    ja: {
        title: 'LINE Sticker Tools',
        subtitle: 'スタンプ作成を効率化するための専用ツールセット',
        removeBgTitle: '背景削除',
        removeBgDesc: '画像の背景を簡単に除去・調整できます。',
        divideCropTitle: '画像分割・クロップツール',
        divideCropDesc: '画像を自動で分割・切り抜きします。',
        arrangeTitle: 'Arrange GUI',
        arrangeDesc: 'スタンプの並び替えとパッケージングを行います。',
        openTool: 'Open Tool →',
        langEn: 'English',
        langJa: '日本語',
        keyboardHelp: '矢印:移動 / J/N:ファジー増 / K/P:ファジー減 / E:エクスポート',
        shortcuts: '矢印:フォーカス / H/L:横分割 / J/K:縦分割 / E:エクスポート',

        // Arrange GUI specific
        arrangeAppTitle: 'LINE Sticker Arranger',
        shortcuts_arrange: '矢印:移動 / Space:選択 / Alt+矢印:並替 / Shift+矢印:範囲 / M:メイン / T:タブ / Del:削除',
        addImages: '画像を追加',
        imageCount: '枚',
        valid: '(OK)',
        anyOf: '{{counts}}枚のいずれか',
        invalid: '×',
        mainParams: 'メイン',
        tabParams: 'タブ',
        exportReady: 'エクスポート可能',
        exportNotReady: 'エクスポート不可',
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
        keyboardHelp: 'Arrows:Move / J/N:Fuzz+ / K/P:Fuzz- / E:Export',
        shortcuts: 'Arrows:Focus / H/L:Split H / J/K:Split V / E:Export',

        // Arrange GUI specific
        arrangeAppTitle: 'LINE Sticker Arranger',
        shortcuts_arrange: 'Arrows:Move / Space:Select / Alt+Arrows:Reorder / Shift+Arrows:Range / M:Main / T:Tab / Del:Delete',
        addImages: 'Add Images',
        imageCount: ' images',
        valid: '(OK)',
        anyOf: 'one of {{counts}}',
        invalid: '×',
        mainParams: 'Main',
        tabParams: 'Tab',
        exportReady: 'Export Ready',
        exportNotReady: 'Export Not Ready',
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
