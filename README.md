# LINE Sticker Tools

LINEスタンプ作成を支援するツール群です。

## 必要なもの

このツールを使用するには、以下のツールがインストールされている必要があります。

- **[uv](https://docs.astral.sh/uv/)**: Pythonのパッケージ管理・実行ツール
- **ImageMagick**: 画像処理ツール (`convert`, `identify` コマンドを使用)
- **Python 3.11以上**
- **bc, awk**: 数値計算用の標準的なコマンド（通常、多くのLinux環境に含まれています）

## 含まれるファイル

- `remove_bg.py`: 画像の背景を削除するPythonスクリプト
- `divide-crop-3x3.sh`: 画像を3x3に分割してクロップするシェルスクリプト
- `adjust-aspect-ratio.sh`: 画像を指定の縦横比（216x185）にリサイズ・パディングするシェルスクリプト

## 使い方

### 1. 背景の除去
タイル画像の背景色を自動で判定して除去します。複数のファイルを同時に指定できます。

```bash
# 1つだけ処理する場合
uv run remove_bg.py target_image.png

# 複数のファイルをまとめて処理する場合
uv run remove_bg.py image1.png image2.png image3.png
```
`target_image-nobg.png` のように、元のファイル名に `-nobg` が付いたファイルが生成されます。

### 2. 画像の分割と自動トリミング
背景を除去した画像を1枚ずつ（3x3の計9枚）に切り出し、余白をトリミングします。こちらも複数のファイルを同時に指定できます。

```bash
# 1つだけ処理する場合
./divide-crop-3x3.sh target_image-nobg.png

# 複数のファイルをまとめて処理する場合
./divide-crop-3x3.sh image1-nobg.png image2-nobg.png
```
`target_image-nobg-0.png` 〜 `target_image-nobg-8.png` が生成されます。

### 3. 縦横比の調整 (LINEスタンプメーカー用)
スマートフォン版のLINEスタンプメーカーアプリでそのまま読み込めるよう、指定の縦横比になるように余白を追加します。
**※このスクリプトはディレクトリを1つだけ指定して実行します。複数指定やファイルの直接指定はできません。**

```bash
# 画像が含まれるディレクトリを指定して実行
./adjust-aspect-ratio.sh directory_name
```
`directory_name-216x185/` ディレクトリに、そのディレクトリ内のすべての画像が調整されて出力されます。
