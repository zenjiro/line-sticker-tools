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

# arrange-guiをローカルで開発する場合
cd arrange-gui
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

## GUI ツールの開発 (arrange-gui など)

### ローカルサーバーの起動

```bash
cd arrange-gui  # または remove-bg-gui, divide-crop-gui
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
├── arrange-gui/             # スタンプ確認・管理用Webアプリ (旧 sticker-gui)
│   ├── src/                 # React ソースコード
│   ├── tests/               # Playwright テスト
│   └── ...
├── remove-bg-gui/           # 背景除去GUI
├── divide-crop-gui/         # 分割・切り抜きGUI
├── divide-crop-3x3.sh       # 画像分割スクリプト
└── adjust-aspect-ratio.sh   # アスペクト比調整スクリプト
```
