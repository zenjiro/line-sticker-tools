# LINE Sticker Tools

LINEスタンプ作成を支援するツール群です。

## 必要なもの

このツールを使用するには、以下のツールがインストールされている必要があります。

- **[uv](https://docs.astral.sh/uv/)**: Pythonのパッケージ管理・実行ツール
- **ImageMagick**: 画像処理ツール (`convert`, `identify` コマンドを使用)
- **Python 3.11以上**
- **bc, awk**: 数値計算用の標準的なコマンド（通常、多くのLinux環境に含まれています）

## インストール方法

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd line-sticker-tools
```

### 2. 依存関係のインストール
```bash
# uvを使用（推奨）
uv sync

# 開発用依存関係も含める場合
uv sync --extra dev
```

## プロジェクト構造

```
line-sticker-tools/
├── src/                    # モジュール化されたPythonコード
│   ├── image_analyzer.py   # 画像解析ユーティリティ
│   └── background_remover.py # 背景除去ロジック
├── tests/                  # 包括的なテストスイート
├── remove_bg.py           # メインCLIスクリプト
├── divide-crop-3x3.sh     # 画像分割スクリプト
├── adjust-aspect-ratio.sh # アスペクト比調整スクリプト
├── validate_refactoring.py # 後方互換性テスト
└── pyproject.toml         # プロジェクト設定
```

## 含まれるファイル

- `remove_bg.py`: 画像の背景を削除するPythonスクリプト（並列処理対応）
- `divide-crop-3x3.sh`: 画像を3x3に分割してクロップするシェルスクリプト
- `adjust-aspect-ratio.sh`: 画像を指定の縦横比（216x185）にリサイズ・パディングするシェルスクリプト
- `validate_refactoring.py`: 後方互換性を検証するテストツール
- `src/`: モジュール化されたPythonコード（画像解析・背景除去機能）
- `tests/`: 包括的なテストスイート（90%以上のカバレッジ）

## 使い方

### 1. 背景の除去
タイル画像の背景色を自動で判定して除去します。複数のファイルを同時に指定できます。

```bash
# 1つだけ処理する場合
uv run remove_bg.py target_image.png

# 複数のファイルをまとめて処理する場合
uv run remove_bg.py image1.png image2.png image3.png

# 並列処理でパフォーマンスを向上（4つのワーカーを使用）
uv run remove_bg.py -j 4 *.png

# 詳細なログ出力を有効にする
uv run remove_bg.py --verbose image.png

# オプションを組み合わせて使用
uv run remove_bg.py -v -j 8 image1.png image2.png
```

**利用可能なオプション:**
- `-v, --verbose`: 詳細なログ出力を有効にする
- `-j N, --jobs N`: 並列処理のワーカー数を指定（デフォルト: 2）

`target_image-nobg.png` のように、元のファイル名に `-nobg` が付いたファイルが生成されます。

**パフォーマンス改善:** 並列処理により、複数ファイルの一括処理時間が60-80%短縮されます。

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

## 開発者向け情報

### テストの実行
```bash
# 全てのテストを実行
uv run pytest

# カバレッジ付きでテストを実行
uv run pytest --cov=src --cov-report=html

# 後方互換性テストを実行
python validate_refactoring.py
```

### 新機能
- **並列処理**: 複数ファイルの同時処理により大幅な高速化
- **プログレスバー**: バッチ処理の進捗を視覚的に表示
- **詳細ログ**: `-v` オプションで処理の詳細を確認可能
- **エラーハンドリング**: 個別ファイルの処理失敗時も他のファイルの処理を継続
- **モジュラー設計**: `src/` ディレクトリによる保守性の向上

### 関連ドキュメント
- [DEVELOPMENT.md](DEVELOPMENT.md) - 開発環境のセットアップ
- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - 技術的改善の詳細
- [AGENTS.md](AGENTS.md) - AI支援開発ワークフロー（英語）
