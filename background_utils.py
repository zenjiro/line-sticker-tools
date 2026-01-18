#!/usr/bin/env python3

import subprocess
from pathlib import Path


def remove_background(image_path, bg_color):
    """Remove background using ImageMagick with fixed 25% fuzz."""
    try:
        output_path = Path(str(image_path).replace('.png', '-nobg.png'))
        rgb_str = f"rgb({bg_color[0]},{bg_color[1]},{bg_color[2]})"
        
        cmd = [
            "convert", 
            str(image_path), 
            "-fuzz", "25%",
            "-transparent", rgb_str,
            "-trim", "+repage",
            f"png32:{output_path}"
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return True
        
    except Exception:
        return False
