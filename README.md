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
- `adjust-aspect-ratio.sh`: 画像を指定の縦横比（216x185）にリサイズ・パディングするシェルスクリプト
- `divide-crop-3x3.sh`: 画像を3x3に分割してクロップするシェルスクリプト

## 使い方

### 1. 背景の除去
タイル画像の背景色を自動で判定して除去します。

```bash
# 実行（依存ライブラリはuvによって自動的に管理されます）
uv run remove_bg.py target_image.png
```
`target_image-nobg.png` が生成されます。

### 2. 画像の分割と自動トリミング
背景を除去した画像を1枚ずつ（3x3の計9枚）に切り出し、余白をトリミングします。

```bash
./divide-crop-3x3.sh target_image-nobg.png
```
`target_image-nobg-0.png` 〜 `target_image-nobg-8.png` が生成されます。

### 3. 縦横比の調整 (LINEスタンプメーカー用)
スマートフォン版のLINEスタンプメーカーアプリでそのまま読み込めるよう、指定の縦横比に余白を追加します。

```bash
# 画像が含まれるディレクトリを指定して実行
./adjust-aspect-ratio.sh directory_name
```
`directory_name-216x185/` ディレクトリに調整済みの画像が生成されます。
