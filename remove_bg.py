#!/usr/bin/env python3

import sys
from pathlib import Path
from src.image_analyzer import get_border_color
from src.background_remover import remove_background


def main():
    if len(sys.argv) < 2:
        print("Usage: python remove_bg.py <image_file> [image_file2] ...", file=sys.stderr)
        return 1
    
    image_files = sys.argv[1:]
    any_failed = False
    
    for image_file in image_files:
        image_path = Path(image_file)
        
        if not image_path.exists():
            print(f"File not found: {image_file}", file=sys.stderr)
            any_failed = True
            continue
            
        print(f"Processing {image_file}...")
        
        # Get background color
        bg_color = get_border_color(str(image_path))
        if not bg_color:
            print(f"Could not detect background color for {image_file}", file=sys.stderr)
            any_failed = True
            continue
        
        # Remove background
        success = remove_background(image_path, bg_color)
        
        if success:
            output_name = str(image_path).replace('.png', '-nobg.png')
            print(f"Success: {output_name}")
        else:
            print(f"Failed to process {image_file}")
            any_failed = True
    
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
