#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "Pillow>=12.1.0",
#     "scipy",
#     "numpy",
# ]
# ///

import sys
import subprocess
import shutil
from pathlib import Path
from PIL import Image
import math
import statistics
import numpy as np
from scipy import ndimage

def count_holes(image_path):
    """Count the number of separate transparent regions (holes) in the image."""
    try:
        with Image.open(image_path) as img:
            img_rgba = img.convert("RGBA")
            alpha = np.array(img_rgba.split()[-1])
            
            # Create binary mask: 1 = transparent, 0 = opaque
            transparent_mask = (alpha == 0).astype(int)
            
            # Label connected components of transparent regions
            labeled, num_holes = ndimage.label(transparent_mask)
            
            return num_holes
    except Exception as e:
        print(f"Error counting holes: {e}", file=sys.stderr)
        return 0

def get_average_border_color(image_path, border_width=10):
    """Calculates the average color of the outer border of the image."""
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGB")
            width, height = img.size
            
            # Collect pixels from the top, bottom, left, and right borders
            pixels = []
            
            # Top and Bottom
            for x in range(width):
                for y in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for y in range(height - border_width, height):
                    pixels.append(img.getpixel((x, y)))
                    
            # Left and Right (excluding corners already covered)
            for y in range(border_width, height - border_width):
                for x in range(border_width):
                    pixels.append(img.getpixel((x, y)))
                for x in range(width - border_width, width):
                    pixels.append(img.getpixel((x, y)))
            
            if not pixels:
                return None

            avg_r = statistics.mean(p[0] for p in pixels)
            avg_g = statistics.mean(p[1] for p in pixels)
            avg_b = statistics.mean(p[2] for p in pixels)
            
            return (int(avg_r), int(avg_g), int(avg_b))
    except Exception as e:
        print(f"Error analyzing image border: {e}", file=sys.stderr)
        return None

            

def analyze_crops(crops, bg_color):
    """
    Selects the best crop from a list of (fuzz, width, height, filepath, opaque_count, holes).
    Uses halo detection to push for higher fuzz if edges are still dirty.
    """
    # Filter out empty or broken crops
    valid_crops = [c for c in crops if c[1] > 0 and c[2] > 0]
    
    if not valid_crops:
        return None

    # Selection Heuristic:
    # Find the highest fuzz where hole count is stable.
    # But if the hole count increases significantly, stop.
    
    # Sort all crops by fuzz
    all_sorted = sorted(valid_crops, key=lambda x: x[0])
    
    selected = all_sorted[0]
    baseline_holes = all_sorted[0][5]
    min_holes = baseline_holes
    
    print(f"    Baseline holes at fuzz {all_sorted[0][0]}%: {baseline_holes}")
    
    for i in range(1, len(all_sorted)):
        curr = all_sorted[i]
        prev = all_sorted[i-1]
        
        curr_holes = curr[5]
        prev_holes = prev[5]
        
        # Track minimum holes seen so far
        min_holes = min(min_holes, curr_holes)
        
        # 1. Step Surge: Large jump between consecutive steps
        ratio_step = curr_holes / max(prev_holes, 1)
        diff_step = curr_holes - prev_holes
        is_surge_step = (ratio_step > 1.8 and diff_step >= 50)
        
        # 2. Baseline Surge: Significant accumulation vs baseline (Good for f.png)
        ratio_vs_baseline = curr_holes / max(baseline_holes, 1)
        is_surge_baseline = (ratio_vs_baseline > 1.4 and (curr_holes - baseline_holes) >= 10)
        
        # 3. Minimum-based Surge: Sensitive detection at higher fuzz (Good for h, k, l)
        ratio_vs_min = curr_holes / max(min_holes, 1)
        diff_vs_min = curr_holes - min_holes
        is_surge_min = (curr[0] >= 30 and ratio_vs_min > 1.05 and diff_vs_min >= 5)
        
        is_surge = is_surge_step or is_surge_baseline or is_surge_min
        
        if is_surge:
            print(f"    Hole count surge at fuzz {curr[0]}% ({prev_holes} -> {curr_holes})")
            if is_surge_step:
                print(f"      -> Step Surge (Ratio: {ratio_step:.2f}, Diff: {diff_step})")
            if is_surge_baseline:
                print(f"      -> Baseline Surge (Ratio vs Baseline: {ratio_vs_baseline:.2f}, Total Diff: {curr_holes - baseline_holes})")
            if is_surge_min:
                print(f"      -> Min-based Surge (Ratio vs Min: {ratio_vs_min:.2f}, Total Diff: {diff_vs_min})")
            print(f"      -> Stopping.")
            selected = prev
            break
        else:
             selected = curr
    
    print(f"    Final selection: Fuzz {selected[0]}%") 
    
    return selected

def process_image(image_path):
    image_path = Path(image_path)
    if not image_path.exists():
        print(f"File not found: {image_path}", file=sys.stderr)
        return

    print(f"Processing: {image_path.name}")
    
    # 1. Get Average Color
    avg_color = get_average_border_color(image_path)
    if not avg_color:
        print("  Could not determine background color.", file=sys.stderr)
        return

    rgb_str = f"rgb({avg_color[0]},{avg_color[1]},{avg_color[2]})"
    print(f"  Detected Background Color: {rgb_str}")

    # 2. Try multiple fuzz values
    fuzz_values = [10, 15, 20, 25, 30, 35, 40, 45, 50] # Expanded range
    results = []
    
    temp_dir = Path(f"temp_processing_{image_path.stem}")
    temp_dir.mkdir(exist_ok=True)
    
    try:
        for fuzz in fuzz_values:
            temp_out = temp_dir / f"fuzz_{fuzz}_{image_path.name}"
            
            # Construct ImageMagick command:
            # 1. -transparent: Remove matching color globally (handles enclosed areas)
            # 2. -channel A -morphology Erode Disk:1: Erode alpha to remove halo fringe
            cmd = [
                "convert", 
                str(image_path), 
                "-fuzz", f"{fuzz}%",
                "-transparent", rgb_str,
                "-channel", "A",
                "-morphology", "Erode", "Disk:2",
                "-blur", "0x1",
                "+channel",
                "-trim", "+repage",
                str(temp_out)
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                
                # Count opaque pixels and holes for detection
                with Image.open(temp_out) as img:
                    img_rgba = img.convert("RGBA")
                    w, h = img_rgba.size
                    alpha_array = np.array(img_rgba.split()[-1])
                    opaque_count = np.sum(alpha_array > 0)
                
                holes = count_holes(temp_out)
                    
                results.append((fuzz, w, h, temp_out, opaque_count, holes))
                print(f"    Fuzz {fuzz}%: {w}x{h}, opaque={opaque_count}, holes={holes}")
                
            except subprocess.CalledProcessError as e:
                print(f"    Fuzz {fuzz}% failed: {e}", file=sys.stderr)
            except Exception as e:
                 print(f"    Error checking output {temp_out}: {e}", file=sys.stderr)

        # 3. Analyze results
        best = analyze_crops(results, avg_color)
        
        if best:
            fuzz, w, h, path, _, _ = best
            print(f"  Selected Best: Fuzz {fuzz}% ({w}x{h})")
            
            final_out = image_path.with_name(f"{image_path.stem}-nobg.png")
            shutil.copy(path, final_out)
            print(f"  Saved to: {final_out}")
        else:
            print("  Failed to find a good result.")

    finally:
        # Cleanup temp files
        if temp_dir.exists():
            print(f"  Temp files kept in: {temp_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run remove_bg.py <image_file> [image_file2] ...")
        sys.exit(1)
    
    for in_file in sys.argv[1:]:
        process_image(in_file)
        print()
