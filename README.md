# LINE Sticker Tools

LINEスタンプ作成を支援するシンプルなツール群です。

## 必要なもの

- **Python 3.11以上**
- **uv** (Python パッケージマネージャー)
- **ImageMagick** (`convert` コマンドを使用)
- **Node.js** (PCで申請する場合に必要)

## インストール方法

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync

# PCで申請する場合 (sticker-gui)
cd sticker-gui
npm install
cd ..
```

## 使い方

### 1. 背景の除去 (必須)
```bash
uv run remove_bg.py image.png
uv run remove_bg.py image1.png image2.png image3.png
```

`image-nobg.png` のように `-nobg` が付いたファイルが生成されます。

### 2. 画像の分割 (3x3) (必須)
```bash
./divide-crop-3x3.sh image-nobg.png
```

ここから先は、申請方法に合わせてどちらかを行ってください。

### 3. スマートフォンアプリで申請する場合 (縦横比の調整)
```bash
./adjust-aspect-ratio.sh directory_name
```

### 4. パソコンで申請する場合 (sticker-gui)

ブラウザ上でスタンプのシミュレーションや管理ができるGUIツールです。

```bash
cd sticker-gui
npm run dev
```

表示されるURL (例: `http://localhost:5173`) にブラウザでアクセスしてください。

## ファイル構成

- `remove_bg.py` - 背景除去メインスクリプト
- `src/` - 画像処理のソースコード
- `sticker-gui/` - スタンプ確認・管理用Webアプリ (React + Vite)
- `divide-crop-3x3.sh` - 画像分割スクリプト
- `adjust-aspect-ratio.sh` - アスペクト比調整スクリプト
