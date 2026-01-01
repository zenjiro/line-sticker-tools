#!/bin/bash

# ImageMagickのconvertコマンドがインストールされているか確認
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick (convert) is not installed."
    exit 1
fi

# 引数がない場合は使用方法を表示
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 file1.png [file2.png ...]"
    exit 1
fi

# 各ファイルを処理
for file in "$@"; do
    if [ ! -f "$file" ]; then
        echo "Warning: File '$file' not found. Skipping."
        continue
    fi

    # ファイル名と拡張子を取得
    filename=$(basename -- "$file")
    extension="${filename##*.}"
    basename="${filename%.*}"

    echo "Processing $file -> ${basename}-0.${extension} ... ${basename}-8.${extension}"

    # 1. -crop 3x3@ : 画像を3x3の9枚に均等分割
    # 2. +repage    : クロップ後の仮想キャンバス情報をリセット
    # 3. -trim      : 透明部分などの余白を自動削除
    # 4. +repage    : トリム後の仮想キャンバス情報をリセット
    # 5. +adjoin    : 個別のファイルとして保存 (%dは連番0-8に置換)
    convert "$file" -crop 3x3@ +repage -trim +repage +adjoin "${basename}-%d.${extension}"
done

echo "Done."