export const translations = {
    ja: {
        title: 'LINE Sticker Arranger',
        addImages: '画像を追加',
        imageCount: '枚',
        mainSet: 'メイン✓',
        tabSet: 'タブ✓',
        mainParams: 'メイン',
        tabParams: 'タブ',
        loading: '読み込み中...',
        dropHere: 'ここに画像をドラッグ＆ドロップ',
        orClickButton: 'または「画像を追加」ボタンをクリック',
        continuousSelection: '連続した範囲を選択してください',
        selectImage: '画像を選択してください',
        cutImages: '{count}枚の画像をカットしました',
        noCutImages: 'カットされた画像がありません',
        pastedImages: '{count}枚の画像を挿入しました',
        cutCancelled: 'カットを取り消しました',
        trashMoved: '{count}枚をゴミ箱に移動しました',
        restored: '元の位置に復元しました',
        mainSetSuccess: 'メイン画像に設定しました',
        tabSetSuccess: 'タブ画像に設定しました',
        invalidCount: '画像数が無効です（{count}枚）。8, 16, 24, 32, 40枚のいずれかにしてください',
        setMain: 'メイン画像を設定してください（Mキー）',
        setTab: 'タブ画像を設定してください（Tキー）',
        exporting: 'エクスポート中...',
        exported: 'ZIPファイルをダウンロードしました',
        exportError: 'エクスポートエラー: {message}',

        // StatusBar
        shortcuts: '矢印:移動 / Space:選択 / Alt+矢印:並替 / Shift+矢印:範囲 / M:メイン / T:タブ / Del:削除',
        anyOf: '({counts}枚のいずれか)',
        exportReady: 'Eキーでエクスポート',
        exportNotReady: 'エクスポート不可',
        valid: '✓',
        invalid: '×',

        // TrashArea
        trashTitle: 'ゴミ箱（{count}枚）- Delete/BackSpaceで復元',

        // Language Toggle
        langEn: 'English',
        langJa: '日本語',
    },
    en: {
        title: 'LINE Sticker Arranger',
        addImages: 'Add Images',
        imageCount: ' images',
        mainSet: 'Main✓',
        tabSet: 'Tab✓',
        mainParams: 'Main',
        tabParams: 'Tab',
        loading: 'Loading...',
        dropHere: 'Drag & Drop images here',
        orClickButton: 'Or click "Add Images" button',
        continuousSelection: 'Please select a continuous range',
        selectImage: 'Please select images',
        cutImages: 'Cut {count} images',
        noCutImages: 'No images to paste',
        pastedImages: 'Pasted {count} images',
        cutCancelled: 'Cancelled cut',
        trashMoved: 'Moved {count} images to trash',
        restored: 'Restored to original position',
        mainSetSuccess: 'Set as Main Image',
        tabSetSuccess: 'Set as Tab Image',
        invalidCount: 'Invalid image count ({count}). Must be 8, 16, 24, 32, or 40',
        setMain: 'Please set Main Image (M key)',
        setTab: 'Please set Tab Image (T key)',
        exporting: 'Exporting...',
        exported: 'Downloaded ZIP file',
        exportError: 'Export error: {message}',

        // StatusBar
        shortcuts: 'Arrows:Move / Space:Select / Alt+Arrow:Reorder / Shift+Arrow:Range / M:Main / T:Tab / Del:Delete',
        anyOf: '(Any of {counts})',
        exportReady: 'Press E to Export',
        exportNotReady: 'Cannot Export',
        valid: '✓',
        invalid: '×',

        // TrashArea
        trashTitle: 'Trash ({count}) - Delete/BackSpace to Restore',

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
