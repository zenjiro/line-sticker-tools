"""Background removal utilities for LINE sticker processing.

This module provides the core functionality for removing backgrounds from images
using ImageMagick with intelligent parameter selection. It includes utilities for
processing images with multiple fuzz values and selecting the optimal result
based on hole count analysis.

Example:
    Basic usage for background removal:
    
    >>> import background_remover
    >>> success = background_remover.remove_background(Path("image.png"), (255, 255, 255))
    >>> if success:
    ...     print("Background removed successfully")
"""

import subprocess
import shutil
from pathlib import Path
from typing import List, Tuple, Optional
import logging

import image_analyzer

logger = logging.getLogger(__name__)


class CropResult:
    """Container for crop processing results.
    
    This class holds the results of processing an image with a specific fuzz value,
    including metadata about the resulting image quality and characteristics.
    
    Attributes:
        fuzz: The fuzz percentage used for processing (0-100)
        width: Width of the processed image in pixels
        height: Height of the processed image in pixels  
        filepath: Path to the processed image file
        opaque_count: Number of opaque (non-transparent) pixels
        holes: Number of separate transparent regions (holes)
        
    Example:
        >>> result = CropResult(25, 800, 600, Path("output.png"), 120000, 2)
        >>> print(f"Processed with {result.fuzz}% fuzz, found {result.holes} holes")
        Processed with 25% fuzz, found 2 holes
    """
    
    def __init__(self, fuzz: int, width: int, height: int, filepath: Path, 
                 opaque_count: int, holes: int) -> None:
        """Initialize a CropResult instance.
        
        Args:
            fuzz: Fuzz percentage used (0-100)
            width: Image width in pixels
            height: Image height in pixels
            filepath: Path to the processed image
            opaque_count: Number of opaque pixels
            holes: Number of transparent regions
        """
        self.fuzz = fuzz
        self.width = width
        self.height = height
        self.filepath = filepath
        self.opaque_count = opaque_count
        self.holes = holes


def process_fuzz_value(image_path: Path, fuzz: int, bg_color: Tuple[int, int, int], 
                      temp_dir: Path) -> Optional[CropResult]:
    """Process an image with a specific fuzz value for background removal.
    
    This function applies ImageMagick operations to remove the background color
    from an image using the specified fuzz tolerance. It also applies morphological
    operations to clean up edges and reduce color bleeding.
    
    Args:
        image_path: Path to the input image file
        fuzz: Fuzz percentage for color matching tolerance (0-100)
        bg_color: Background color as RGB tuple (r, g, b)
        temp_dir: Directory for temporary output files
        
    Returns:
        CropResult object with processing results, or None if processing failed
        
    Note:
        The ImageMagick command sequence includes:
        - Transparent color removal with fuzz tolerance
        - Alpha channel erosion to remove color bleeding
        - Gaussian blur for edge smoothing
        - Trimming to remove excess transparent areas
        
    Example:
        >>> temp_dir = Path("temp")
        >>> temp_dir.mkdir(exist_ok=True)
        >>> result = process_fuzz_value(
        ...     Path("input.png"), 25, (255, 255, 255), temp_dir
        ... )
        >>> if result:
        ...     print(f"Success: {result.width}x{result.height}")
    """
    temp_out = temp_dir / f"fuzz_{fuzz}_{image_path.name}"
    rgb_str = f"rgb({bg_color[0]},{bg_color[1]},{bg_color[2]})"
    
    # ImageMagick command for background removal with edge cleanup
    cmd = [
        "convert", 
        str(image_path), 
        "-fuzz", f"{fuzz}%",
        "-transparent", rgb_str,
        "-channel", "A",
        "-morphology", "Erode", "Disk:2",  # Remove color bleeding
        "-blur", "0x1",                     # Smooth edges
        "+channel",
        "-trim", "+repage",                 # Remove excess transparency
        str(temp_out)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        
        dimensions = image_analyzer.get_image_dimensions(str(temp_out))
        if not dimensions:
            logger.warning(f"Could not get dimensions for fuzz {fuzz}% result")
            return None
            
        w, h = dimensions
        opaque_count = image_analyzer.count_opaque_pixels(str(temp_out))
        holes = image_analyzer.count_holes(str(temp_out))
        
        logger.debug(f"Fuzz {fuzz}%: {w}x{h}, opaque={opaque_count}, holes={holes}")
        
        return CropResult(fuzz, w, h, temp_out, opaque_count, holes)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"ImageMagick failed for fuzz {fuzz}%: {e}")
        return None
    except Exception as e:
        logger.error(f"Error processing fuzz {fuzz}%: {e}")
        return None


def analyze_crops(crops: List[CropResult]) -> Optional[CropResult]:
    """Select the best crop result from a list of processed images.
    
    This function implements a sophisticated algorithm to select the optimal
    background removal result by analyzing hole count patterns across different
    fuzz values. It detects when increasing fuzz values start creating too
    many unwanted holes in the subject matter.
    
    The algorithm uses three surge detection methods:
    1. Step Surge: Large increase between consecutive fuzz values
    2. Baseline Surge: Significant increase from the initial baseline
    3. Minimum-based Surge: Sensitive detection at higher fuzz values
    
    Args:
        crops: List of CropResult objects sorted by fuzz value
        
    Returns:
        Best CropResult based on hole count analysis, or None if no valid crops
        
    Algorithm Details:
        - Sorts crops by fuzz value (lowest to highest)
        - Tracks minimum hole count seen so far
        - Detects surges using ratio and difference thresholds
        - Stops at the fuzz value before a significant surge
        
    Example:
        >>> crops = [
        ...     CropResult(10, 100, 100, Path("f10.png"), 5000, 2),
        ...     CropResult(20, 100, 100, Path("f20.png"), 4800, 3),
        ...     CropResult(30, 100, 100, Path("f30.png"), 4500, 50)  # Surge!
        ... ]
        >>> best = analyze_crops(crops)
        >>> print(f"Selected fuzz: {best.fuzz}%")
        Selected fuzz: 20%
    """
    # Filter out invalid crops (zero dimensions)
    valid_crops = [c for c in crops if c.width > 0 and c.height > 0]
    
    if not valid_crops:
        logger.warning("No valid crops found for analysis")
        return None

    # Sort by fuzz value to ensure proper progression analysis
    sorted_crops = sorted(valid_crops, key=lambda x: x.fuzz)
    
    selected = sorted_crops[0]
    baseline_holes = sorted_crops[0].holes
    min_holes = baseline_holes
    
    logger.debug(f"Baseline holes at fuzz {sorted_crops[0].fuzz}%: {baseline_holes}")
    
    # Analyze hole count progression to detect over-processing
    for i in range(1, len(sorted_crops)):
        curr = sorted_crops[i]
        prev = sorted_crops[i-1]
        
        curr_holes = curr.holes
        prev_holes = prev.holes
        
        # Track minimum holes seen (for sensitive detection)
        min_holes = min(min_holes, curr_holes)
        
        # Surge Detection Method 1: Step Surge
        # Large jump between consecutive fuzz values
        ratio_step = curr_holes / max(prev_holes, 1)
        diff_step = curr_holes - prev_holes
        is_surge_step = (ratio_step > 1.8 and diff_step >= 50)
        
        # Surge Detection Method 2: Baseline Surge  
        # Significant accumulation vs initial baseline
        ratio_vs_baseline = curr_holes / max(baseline_holes, 1)
        is_surge_baseline = (ratio_vs_baseline > 1.4 and (curr_holes - baseline_holes) >= 10)
        
        # Surge Detection Method 3: Minimum-based Surge
        # Sensitive detection at higher fuzz values
        ratio_vs_min = curr_holes / max(min_holes, 1)
        diff_vs_min = curr_holes - min_holes
        is_surge_min = (curr.fuzz >= 30 and ratio_vs_min > 1.05 and diff_vs_min >= 5)
        
        is_surge = is_surge_step or is_surge_baseline or is_surge_min
        
        if is_surge:
            logger.debug(f"Hole count surge detected at fuzz {curr.fuzz}% ({prev_holes} -> {curr_holes})")
            if is_surge_step:
                logger.debug(f"  Step Surge: ratio={ratio_step:.2f}, diff={diff_step}")
            if is_surge_baseline:
                logger.debug(f"  Baseline Surge: ratio={ratio_vs_baseline:.2f}, total_diff={curr_holes - baseline_holes}")
            if is_surge_min:
                logger.debug(f"  Min-based Surge: ratio={ratio_vs_min:.2f}, diff={diff_vs_min}")
            
            # Stop before the surge - use previous result
            selected = prev
            break
        else:
            # No surge detected, continue with current result
            selected = curr
    
    logger.debug(f"Final selection: Fuzz {selected.fuzz}% with {selected.holes} holes")
    return selected


def remove_background(image_path: Path, bg_color: Tuple[int, int, int], 
                     fuzz_values: Optional[List[int]] = None) -> bool:
    """Remove background from an image using multiple fuzz values with intelligent selection.
    
    This is the main function for background removal. It processes the image with
    multiple fuzz values, analyzes the results, and selects the best one based on
    hole count analysis to avoid over-processing.
    
    Args:
        image_path: Path to the input image file
        bg_color: Background color to remove as RGB tuple (r, g, b)
        fuzz_values: List of fuzz percentages to try (default: [10,15,20,25,30,35,40,45,50])
        
    Returns:
        True if background removal was successful, False otherwise
        
    Side Effects:
        - Creates a temporary directory for processing
        - Saves the result as "{original_name}-nobg.png"
        - Cleans up temporary files automatically
        
    Example:
        >>> from pathlib import Path
        >>> success = remove_background(
        ...     Path("sticker.png"), 
        ...     (255, 255, 255),  # White background
        ...     [15, 25, 35]      # Custom fuzz values
        ... )
        >>> if success:
        ...     print("Background removed! Check sticker-nobg.png")
        Background removed! Check sticker-nobg.png
        
    Note:
        The function automatically determines the best fuzz value by analyzing
        hole counts. Higher fuzz values remove more background but may create
        holes in the subject. The algorithm stops when hole count surges indicate
        over-processing.
    """
    if fuzz_values is None:
        fuzz_values = [10, 15, 20, 25, 30, 35, 40, 45, 50]
    
    # Use a more unique temp directory name to avoid conflicts
    import os
    temp_dir = Path(f"temp_processing_{image_path.stem}_{os.getpid()}")
    temp_dir.mkdir(exist_ok=True)
    
    try:
        results = []
        
        # Process image with each fuzz value
        for fuzz in fuzz_values:
            result = process_fuzz_value(image_path, fuzz, bg_color, temp_dir)
            if result:
                results.append(result)
        
        if not results:
            logger.error("No successful processing results obtained")
            return False
        
        # Analyze results and select the best one
        best = analyze_crops(results)
        
        if best:
            # Save the best result
            final_out = image_path.with_name(f"{image_path.stem}-nobg.png")
            shutil.copy(best.filepath, final_out)
            logger.info(f"Background removal successful. Saved to: {final_out}")
            logger.debug(f"Selected parameters: Fuzz {best.fuzz}%, {best.holes} holes detected")
            return True
        else:
            logger.error("Failed to select a suitable result from processing attempts")
            return False

    except Exception as e:
        logger.error(f"Error during background removal: {e}")
        return False
    finally:
        # Cleanup temporary files with error handling
        if temp_dir.exists():
            try:
                shutil.rmtree(temp_dir)
                logger.debug(f"Cleaned up temporary files in: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temporary directory {temp_dir}: {e}")
