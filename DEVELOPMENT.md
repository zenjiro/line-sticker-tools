# 開発ガイド

このドキュメントでは、LINE Sticker Toolsをローカルで開発・実行する方法について説明します。

## 必要なもの

- **Python 3.11以上**
- **uv** (Python パッケージマネージャー)
- **ImageMagick** (`convert` コマンドを使用)
- **Node.js** (sticker-guiをローカルで開発する場合)

## インストール方法

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync

# sticker-guiをローカルで開発する場合
cd sticker-gui
npm install
```

---

## Python ツールの開発

### 背景除去ツール

```bash
uv run remove_bg.py image.png
```

### テストの実行

```bash
uv run pytest
```

---

## sticker-gui の開発

### ローカルサーバーの起動

```bash
cd sticker-gui
npm run dev
```

表示されるURL (例: `http://localhost:5173`) にブラウザでアクセスしてください。

### コードのチェック

```bash
npm run lint
```

### テストの実行

```bash
npx playwright install  # 初回のみ
npx playwright test
```

### ビルド

```bash
npm run build
```

---

## ファイル構成 (開発者向け)

```
.
├── remove_bg.py             # 背景除去メインスクリプト
├── src/                     # Python画像処理のソースコード
│   ├── image_analyzer.py    # 画像解析機能
│   └── background_remover.py# 背景除去処理
├── tests/                   # Pythonテストスイート
├── sticker-gui/             # スタンプ確認・管理用Webアプリ
│   ├── src/                 # React ソースコード
│   ├── tests/               # Playwright テスト
│   └── ...
├── divide-crop-3x3.sh       # 画像分割スクリプト
└── adjust-aspect-ratio.sh   # アスペクト比調整スクリプト
```
