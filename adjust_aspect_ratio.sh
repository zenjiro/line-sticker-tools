#!/bin/bash

#
# このスクリプトは、指定されたディレクトリにあるすべてのPNG画像を、
# 目標の縦横比になるように透明な余白を追加してリサイズします。
#

# --- 設定 ---
# 目標の縦横比（幅 / 高さ）
TARGET_W=216
TARGET_H=185
# --- 設定ここまで ---


# --- スクリプト本体 ---

# 引数の数を確認
if [ "$#" -ne 1 ]; then
    echo "使用法: $0 <画像が含まれるディレクトリ>"
    exit 1
fi

# 入力ディレクトリを変数に格納（末尾のスラッシュを削除）
INPUT_DIR=${1%/}

# 入力ディレクトリの存在を確認
if [ ! -d "$INPUT_DIR" ]; then
    echo "エラー: ディレクトリ '$INPUT_DIR' が見つかりません。"
    exit 1
fi

# 出力ディレクトリ名を生成
OUTPUT_DIR="${INPUT_DIR}-216x185"


# 依存コマンドの存在チェック
if ! command -v convert &> /dev/null || ! command -v identify &> /dev/null; then
    echo "エラー: ImageMagick (convert, identify) がインストールされていません。スクリプトを実行するにはインストールしてください。"
    exit 1
fi
if ! command -v bc &> /dev/null; then
    echo "エラー: 'bc' がインストールされていません。スクリプトを実行するにはインストールしてください。"
    exit 1
fi

echo "入力ディレクトリ: $INPUT_DIR"
echo "出力ディレクトリ: $OUTPUT_DIR"
echo "目標の縦横比: $TARGET_W : $TARGET_H"

# 安全性チェック: OUTPUT_DIRが空でないか、ルートディレクトリでないかを確認
if [ -z "$OUTPUT_DIR" ] || [ "$OUTPUT_DIR" = "/" ]; then
    echo "エラー: 出力ディレクトリ名が不正です。処理を中止します。"
    exit 1
fi

# 出力ディレクトリが存在する場合、既存PNGファイルを削除
if [ -d "$OUTPUT_DIR" ]; then
    echo "出力ディレクトリ内の既存PNGファイルを削除しています..."
    # -f オプションでファイルが無くてもエラーにしない
    rm -f "$OUTPUT_DIR"/*.png
fi

# 出力ディレクトリを作成（存在しない場合も含む）
mkdir -p "$OUTPUT_DIR"

# 画像を入力ディレクトリから出力ディレクトリへコピー
echo "画像をコピーしています..."
cp "$INPUT_DIR"/*.png "$OUTPUT_DIR/" 2>/dev/null || true

# コピーされたPNGファイルが存在するか確認
if ! ls "$OUTPUT_DIR"/*.png &>/dev/null; then
    echo "警告: '$INPUT_DIR' にPNGファイルが見つからなかったか、コピーに失敗しました。"
    rmdir "$OUTPUT_DIR" # 空のディレクトリは削除
    exit 0
fi

# 目標の縦横比を浮動小数点数で計算
TARGET_ASPECT=$(awk "BEGIN {print $TARGET_W/$TARGET_H}")

# 出力ディレクトリ内のすべてのPNGファイルを処理
for file in "$OUTPUT_DIR"/*.png
do
  echo "処理中: $(basename "$file")..."

  # 画像のサイズを取得
  orig_dims=$(identify -format "%wx%h" "$file")
  orig_w=$(echo "$orig_dims" | cut -d'x' -f1)
  orig_h=$(echo "$orig_dims" | cut -d'x' -f2)

  # サイズが正しく取得できたか確認
  if [ -z "$orig_w" ] || [ -z "$orig_h" ] || [ "$orig_h" -eq 0 ]; then
    echo "警告: $(basename "$file") のサイズが取得できませんでした。スキップします。"
    continue
  fi

  current_aspect=$(awk "BEGIN {print $orig_w/$orig_h}")

  # 縦横比を比較
  is_wider=$(echo "$current_aspect > $TARGET_ASPECT" | bc -l)

  if [ "$is_wider" -eq 1 ]; then
    # 画像が目標より「横長」の場合：幅を維持し、高さを調整
    final_w=$orig_w
    final_h=$(awk "BEGIN {print int($orig_w / $TARGET_ASPECT + 0.5)}")
  else
    # 画像が目標より「縦長」または同じ比率の場合：高さを維持し、幅を調整
    final_h=$orig_h
    final_w=$(awk "BEGIN {print int($orig_h * $TARGET_ASPECT + 0.5)}")
  fi

  # 最終的なサイズを偶数に調整
  if [ $((final_w % 2)) -ne 0 ]; then
    final_w=$((final_w + 1))
  fi
  if [ $((final_h % 2)) -ne 0 ]; then
    final_h=$((final_h + 1))
  fi

  # 画像をパディングして新しいサイズに調整（ファイルを上書き）
  convert "$file" \
    -background transparent -gravity center \
    -extent "${final_w}x${final_h}" \
    "$file"
done

echo "-------------------------------------"
echo "すべての処理が完了しました。"
echo "リサイズされた画像は '$OUTPUT_DIR' に保存されています。"