# LINE Sticker Tools

LINEスタンプ作成を支援するシンプルなツール群です。

## 必要なもの

- **Python 3.11以上**
- **uv** (Python パッケージマネージャー)
- **ImageMagick** (`convert` コマンドを使用)

## インストール方法

```bash
git clone <repository-url>
cd line-sticker-tools
uv sync
```

## 使い方

### 1. 背景の除去
```bash
uv run remove_bg.py image.png
uv run remove_bg.py image1.png image2.png image3.png
```

`image-nobg.png` のように `-nobg` が付いたファイルが生成されます。

### 2. 画像の分割 (3x3)
```bash
./divide-crop-3x3.sh image-nobg.png
```

### 3. 縦横比の調整
```bash
./adjust-aspect-ratio.sh directory_name
```

## ファイル構成

- `remove_bg.py` - 背景除去メインスクリプト
- `src/image_analyzer.py` - 画像解析機能
- `src/background_remover.py` - 背景除去処理
- `tests/` - テストスイート
- `divide-crop-3x3.sh` - 画像分割スクリプト
- `adjust-aspect-ratio.sh` - アスペクト比調整スクリプト
