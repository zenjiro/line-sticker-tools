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

ブラウザ上でスタンプのシミュレーションや管理ができるGUIツールです。GitHub Pagesにデプロイされているので、すぐに使えます。

**🔗 [sticker-gui を開く](https://zenjiro.github.io/line-sticker-tools/)**

主な機能:
- **ドラッグ＆ドロップ** で画像をインポート
- **キーボードショートカット** で素早く整理
- **メイン・タブ画像** の設定
- **ZIPエクスポート** で申請用ファイルを作成

詳しい使い方は [sticker-gui/README.md](sticker-gui/README.md) を参照してください。

## 開発について

ローカルでの開発方法やテストの実行については [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。
