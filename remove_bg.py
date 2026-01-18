#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "Pillow==10.4.0",
#     "scipy==1.14.1",
#     "numpy==2.1.3",
# ]
# ///

"""Refactored background removal tool for LINE stickers with performance optimizations."""

import sys
import logging
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Tuple

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

import image_analyzer
import background_remover


def setup_logging(verbose: bool = False) -> None:
    """Set up logging configuration with performance timing."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s: %(message)s',
        datefmt='%H:%M:%S'
    )


def show_progress(current: int, total: int, filename: str = "", width: int = 50) -> None:
    """Display a progress bar for batch processing.
    
    Args:
        current: Current progress count
        total: Total items to process
        filename: Current filename being processed
        width: Width of progress bar in characters
    """
    if total == 0:
        return
        
    percent = (current / total) * 100
    filled = int(width * current // total)
    bar = '█' * filled + '░' * (width - filled)
    
    # Truncate filename if too long
    display_name = filename
    if len(display_name) > 30:
        display_name = display_name[:27] + "..."
    
    print(f'\r[{bar}] {percent:5.1f}% ({current}/{total}) {display_name}', end='', flush=True)
    
    if current == total:
        print()  # New line when complete


def process_image_with_timing(image_path: Path) -> Tuple[bool, float, str]:
    """Process a single image file with timing information.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Tuple of (success, processing_time, status_message)
    """
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    if not image_path.exists():
        return False, 0.0, f"File not found: {image_path}"

    try:
        # Get average border color
        avg_color = image_analyzer.get_average_border_color(str(image_path))
        if not avg_color:
            return False, time.time() - start_time, "Could not determine background color"

        rgb_str = f"rgb({avg_color[0]},{avg_color[1]},{avg_color[2]})"
        logger.debug(f"Detected background color for {image_path.name}: {rgb_str}")

        # Remove background with optimized settings
        success = background_remover.remove_background(image_path, avg_color)
        
        processing_time = time.time() - start_time
        
        if success:
            return True, processing_time, f"Successfully processed in {processing_time:.1f}s"
        else:
            return False, processing_time, f"Failed to process after {processing_time:.1f}s"
            
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error processing {image_path}: {e}")
        return False, processing_time, f"Error: {str(e)}"


def process_images_parallel(image_paths: List[Path], max_workers: int = 2) -> Tuple[int, int, float]:
    """Process multiple images in parallel with progress tracking.
    
    Args:
        image_paths: List of image file paths to process
        max_workers: Maximum number of parallel workers
        
    Returns:
        Tuple of (success_count, total_count, total_time)
    """
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    success_count = 0
    completed_count = 0
    total_count = len(image_paths)
    failed_files = []
    
    logger.info(f"Processing {total_count} images with {max_workers} parallel workers")
    
    # Use ThreadPoolExecutor for I/O bound operations
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_path = {
            executor.submit(process_image_with_timing, path): path 
            for path in image_paths
        }
        
        # Process completed tasks
        for future in as_completed(future_to_path):
            path = future_to_path[future]
            completed_count += 1
            
            try:
                success, proc_time, message = future.result()
                
                if success:
                    success_count += 1
                    logger.debug(f"✓ {path.name}: {message}")
                else:
                    failed_files.append((path.name, message))
                    logger.warning(f"✗ {path.name}: {message}")
                
                # Update progress
                show_progress(completed_count, total_count, path.name)
                
            except Exception as e:
                failed_files.append((path.name, f"Exception: {str(e)}"))
                logger.error(f"✗ {path.name}: Exception during processing: {e}")
                show_progress(completed_count, total_count, path.name)
    
    total_time = time.time() - start_time
    
    # Summary
    print()  # Ensure we're on a new line after progress bar
    logger.info(f"Batch processing complete in {total_time:.1f}s")
    logger.info(f"Success: {success_count}/{total_count} files")
    
    if failed_files:
        logger.warning("Failed files:")
        for filename, reason in failed_files:
            logger.warning(f"  - {filename}: {reason}")
    
    return success_count, total_count, total_time


def validate_image_files(file_paths: List[str]) -> List[Path]:
    """Validate and filter image file paths.
    
    Args:
        file_paths: List of file path strings
        
    Returns:
        List of valid Path objects for image files
    """
    logger = logging.getLogger(__name__)
    valid_paths = []
    
    for file_path in file_paths:
        path = Path(file_path)
        
        if not path.exists():
            logger.warning(f"File not found: {path}")
            continue
            
        if not path.is_file():
            logger.warning(f"Not a file: {path}")
            continue
            
        # Check file extension
        if path.suffix.lower() not in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp']:
            logger.warning(f"Unsupported file type: {path}")
            continue
            
        valid_paths.append(path)
    
    return valid_paths


def main() -> int:
    """Main entry point with enhanced performance and progress tracking."""
    if len(sys.argv) < 2:
        print("Usage: uv run remove_bg.py <image_file> [image_file2] ...")
        print("\nOptions:")
        print("  -v, --verbose    Enable verbose logging")
        print("  -j N, --jobs N   Number of parallel jobs (default: 2)")
        print("\nExamples:")
        print("  uv run remove_bg.py image.png")
        print("  uv run remove_bg.py -j 4 *.png")
        print("  uv run remove_bg.py --verbose image1.png image2.png")
        return 1
    
    # Parse arguments
    verbose = False
    max_workers = 2
    image_files = []
    
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        
        if arg in ['-v', '--verbose']:
            verbose = True
        elif arg in ['-j', '--jobs']:
            if i + 1 < len(sys.argv):
                try:
                    max_workers = int(sys.argv[i + 1])
                    max_workers = max(1, min(max_workers, 8))  # Limit to 1-8 workers
                    i += 1  # Skip next argument
                except ValueError:
                    print(f"Error: Invalid number of jobs: {sys.argv[i + 1]}")
                    return 1
            else:
                print("Error: --jobs requires a number")
                return 1
        elif not arg.startswith('-'):
            image_files.append(arg)
        else:
            print(f"Error: Unknown option: {arg}")
            return 1
            
        i += 1
    
    if not image_files:
        print("Error: No image files specified")
        return 1
    
    setup_logging(verbose)
    logger = logging.getLogger(__name__)
    
    # Validate input files
    valid_paths = validate_image_files(image_files)
    
    if not valid_paths:
        logger.error("No valid image files found")
        return 1
    
    if len(valid_paths) != len(image_files):
        logger.warning(f"Processing {len(valid_paths)} valid files out of {len(image_files)} specified")
    
    # Process images
    if len(valid_paths) == 1:
        # Single file - no need for parallel processing
        logger.info("Processing single image...")
        success, proc_time, message = process_image_with_timing(valid_paths[0])
        
        if success:
            logger.info(f"✓ {message}")
            return 0
        else:
            logger.error(f"✗ {message}")
            return 1
    else:
        # Multiple files - use parallel processing
        success_count, total_count, total_time = process_images_parallel(valid_paths, max_workers)
        
        if success_count == total_count:
            logger.info("All files processed successfully!")
            return 0
        else:
            logger.error(f"Failed to process {total_count - success_count} files")
            return 1


if __name__ == "__main__":
    sys.exit(main())
