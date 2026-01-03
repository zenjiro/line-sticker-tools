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

def calculate_halo_ratio(image_path, bg_color, threshold=60):
    """
    Calculates the ratio of border pixels that are close to the background color.
    High ratio means background color is still present at the edges (halo).
    """
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGBA")
            alpha = np.array(img.split()[-1])
            rgb = np.array(img.convert("RGB"))
            
            # Find contour (pixels that are opaque but touch transparent)
            # Dilate opacity mask and subtract original opacity mask to get boundary of transparency
            # Or erode opacity mask and subtract to get inner boundary
            
            # Mask of opaque pixels
            opaque_mask = alpha > 0
            
            # Erode to find interior pixels
            eroded_mask = ndimage.binary_erosion(opaque_mask, iterations=1)
            
            # Boundary pixels are opaque but were removed by erosion (inner edge)
            boundary_mask = opaque_mask & ~eroded_mask
            
            if not np.any(boundary_mask):
                return 0.0
            
            # Get colors of boundary pixels
            boundary_colors = rgb[boundary_mask]
            
            # Calculate distance to background color
            # Simple Euclidean distance in RGB
            bg_arr = np.array(bg_color)
            distances = np.sqrt(np.sum((boundary_colors - bg_arr) ** 2, axis=1))
            
            # Count pixels close to background color
            halo_pixels = np.sum(distances < threshold)
            total_boundary = np.sum(boundary_mask)
            
            return halo_pixels / total_boundary

    except Exception as e:
        print(f"Error calculating halo: {e}", file=sys.stderr)
        return 0.0

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
    # But if the "stable" choice still has a halo (purple edge), try to push further.
    
    # Sort all crops by fuzz
    all_sorted = sorted(valid_crops, key=lambda x: x[0])
    
    selected = all_sorted[0]
    
    print(f"    Baseline holes at fuzz {all_sorted[0][0]}%: {all_sorted[0][5]}")
    
    for i in range(1, len(all_sorted)):
        curr = all_sorted[i]
        prev = all_sorted[i-1]
        
        curr_holes = curr[5]
        prev_holes = prev[5]
        
        # Check if previous had halo
        prev_halo_ratio = calculate_halo_ratio(prev[3], bg_color)
        
        # If hole count increases significantly
        if curr_holes > prev_holes:
            ratio = curr_holes / max(prev_holes, 1)
            diff = curr_holes - prev_holes
            
            is_surge = (ratio > 1.2 and diff >= 20)
            
            if is_surge:
                # Hole surge detected. Normally we stop here.
                # BUT, if the previous image still has a strong halo, maybe this surge is worth it?
                # Or maybe the surge is just noise revealing more halo?
                
                print(f"    Hole count surge at fuzz {curr[0]}% ({prev_holes} -> {curr_holes}), Prev Halo Ratio: {prev_halo_ratio:.2%}")
                
                # Catastrophic surge check
                # If hole count increases by a massive factor (e.g. 5x) or a huge number, we MUST stop.
                if ratio > 5.0 or (curr_holes - prev_holes) > 200:
                    print(f"      -> Stopping due to CATASTROPHIC surge (Ratio: {ratio:.1f}, Diff: {curr_holes - prev_holes}).")
                    selected = prev
                    break
                
                if prev_halo_ratio > 0.01: # If more than 1% of border is still background color
                    print(f"      -> Ignoring surge because previous image has excessive halo.")
                    selected = curr
                else:
                    print(f"      -> Stopping because halo is acceptable ({prev_halo_ratio:.2%}) or surge is too risky.")
                    selected = prev
                    break
            else:
                 selected = curr
        else:
            # Hole count stable or decreasing (merging), this fuzz is safe
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
    fuzz_values = [5, 10, 15, 20, 25, 30, 35, 40] # Expanded range
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
            shutil.rmtree(temp_dir)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run remove_bg.py <image_file> [image_file2] ...")
        sys.exit(1)
    
    for in_file in sys.argv[1:]:
        process_image(in_file)
        print()
