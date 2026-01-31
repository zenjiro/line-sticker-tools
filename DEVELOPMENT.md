# 開発ガイド

このドキュメントでは、LINE Sticker Toolsをローカルで開発・実行する方法について説明します。

## 必要なもの

- **Python 3.11以上**
- **uv** (Python パッケージマネージャー)
- **ImageMagick** (`convert` コマンドを使用)
- **Node.js** (GUIsをローカルで開発する場合)

## インストール方法

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync

# GUIをローカルで開発する場合
cd gui
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

## GUI ツールの開発 (React + Vite)

### ローカルサーバーの起動

```bash
cd gui
npm run dev
```

表示されるURL (例: `http://localhost:5173/line-sticker-tools/`) にブラウザでアクセスしてください。

### コードのチェック

```bash
cd gui
npm run lint
```

### テストの実行 (Playwright)

```bash
cd gui
npx playwright install  # 初回のみ
npx playwright test
```

### ビルド

```bash
cd gui
npm run build
```

---

## ファイル構成 (開発者向け)

```
.
├── remove_bg.py             # 背景除去メインスクリプト
├── src/                     # Python画像処理のソースコード
├── tests/                   # Pythonテストスイート
├── gui/                     # 統合Webアプリ (React + Vite)
│   ├── src/                 # React ソースコード (各ツールは pages/ 以下)
│   ├── tests/               # Playwright テスト
│   ├── public/              # 静的アセット
│   └── vite.config.js       # MPA 構成
├── divide-crop-3x3.sh       # 画像分割スクリプト
└── adjust-aspect-ratio.sh   # アスペクト比調整スクリプト
```
