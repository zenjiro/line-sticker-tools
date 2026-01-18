#!/bin/bash

#
# Enhanced aspect ratio adjustment script with improved error handling and validation
# This script adjusts all PNG images in a directory to the target aspect ratio
# by adding transparent padding while preserving the original content.
#

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# --- Configuration ---
readonly TARGET_W=216
readonly TARGET_H=185
readonly SCRIPT_NAME=$(basename "$0")

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# --- Logging Functions ---
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [ "${DEBUG:-0}" = "1" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1" >&2
    fi
}

# --- Dependency Checking ---
check_dependencies() {
    local missing_deps=()
    
    if ! command -v convert &> /dev/null; then
        missing_deps+=("ImageMagick convert")
    fi
    
    if ! command -v identify &> /dev/null; then
        missing_deps+=("ImageMagick identify")
    fi
    
    if ! command -v bc &> /dev/null; then
        missing_deps+=("bc (calculator)")
    fi
    
    if ! command -v awk &> /dev/null; then
        missing_deps+=("awk")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - $dep"
        done
        log_error "Please install the missing dependencies to continue."
        exit 1
    fi
}

# --- Input Validation ---
validate_directory() {
    local input_dir="$1"
    
    if [ ! -d "$input_dir" ]; then
        log_error "Directory '$input_dir' does not exist."
        return 1
    fi
    
    if [ ! -r "$input_dir" ]; then
        log_error "Directory '$input_dir' is not readable."
        return 1
    fi
    
    # Check if directory contains PNG files
    if ! ls "$input_dir"/*.png &>/dev/null; then
        log_warn "No PNG files found in '$input_dir'."
        return 1
    fi
    
    return 0
}

validate_output_directory() {
    local output_dir="$1"
    
    # Safety check: ensure output directory name is not empty or root
    if [ -z "$output_dir" ] || [ "$output_dir" = "/" ]; then
        log_error "Invalid output directory name: '$output_dir'"
        return 1
    fi
    
    # Check if output directory exists and has content
    if [ -d "$output_dir" ]; then
        local png_count
        png_count=$(find "$output_dir" -name "*.png" -type f 2>/dev/null | wc -l)
        if [ "$png_count" -gt 0 ]; then
            log_warn "Output directory '$output_dir' contains $png_count PNG files that will be removed."
        fi
    fi
    
    return 0
}

# --- Image Processing ---
get_image_dimensions() {
    local file="$1"
    local dimensions
    
    if ! dimensions=$(identify -format "%wx%h" "$file" 2>/dev/null); then
        log_error "Failed to get dimensions for $(basename "$file")"
        return 1
    fi
    
    echo "$dimensions"
}

calculate_target_dimensions() {
    local orig_w="$1"
    local orig_h="$2"
    local target_aspect current_aspect final_w final_h is_wider
    
    # Calculate aspect ratios
    target_aspect=$(awk "BEGIN {print $TARGET_W/$TARGET_H}")
    current_aspect=$(awk "BEGIN {print $orig_w/$orig_h}")
    
    # Determine if image is wider than target ratio
    is_wider=$(echo "$current_aspect > $target_aspect" | bc -l)
    
    if [ "$is_wider" -eq 1 ]; then
        # Image is wider: maintain width, adjust height
        final_w=$orig_w
        final_h=$(awk "BEGIN {print int($orig_w / $target_aspect + 0.5)}")
    else
        # Image is taller or same ratio: maintain height, adjust width
        final_h=$orig_h
        final_w=$(awk "BEGIN {print int($orig_h * $target_aspect + 0.5)}")
    fi
    
    # Ensure dimensions are even numbers
    if [ $((final_w % 2)) -ne 0 ]; then
        final_w=$((final_w + 1))
    fi
    if [ $((final_h % 2)) -ne 0 ]; then
        final_h=$((final_h + 1))
    fi
    
    echo "${final_w}x${final_h}"
}

process_image() {
    local file="$1"
    local filename orig_dims orig_w orig_h final_dims
    
    filename=$(basename "$file")
    log_debug "Processing: $filename"
    
    # Get original dimensions
    if ! orig_dims=$(get_image_dimensions "$file"); then
        log_error "Skipping $filename due to dimension error"
        return 1
    fi
    
    orig_w=$(echo "$orig_dims" | cut -d'x' -f1)
    orig_h=$(echo "$orig_dims" | cut -d'x' -f2)
    
    # Validate dimensions
    if [ -z "$orig_w" ] || [ -z "$orig_h" ] || [ "$orig_h" -eq 0 ]; then
        log_error "Invalid dimensions for $filename: $orig_dims"
        return 1
    fi
    
    # Calculate target dimensions
    final_dims=$(calculate_target_dimensions "$orig_w" "$orig_h")
    
    log_debug "$filename: $orig_dims -> $final_dims"
    
    # Apply padding and resize
    if convert "$file" \
        -background transparent -gravity center \
        -extent "$final_dims" \
        "$file" 2>/dev/null; then
        return 0
    else
        log_error "Failed to process $filename"
        return 1
    fi
}

# --- Main Processing ---
process_directory() {
    local input_dir="$1"
    local output_dir="$2"
    local success_count=0
    local total_count=0
    local failed_files=()
    
    log_info "Processing images from '$input_dir' to '$output_dir'"
    log_info "Target aspect ratio: $TARGET_W:$TARGET_H"
    
    # Create and prepare output directory
    mkdir -p "$output_dir"
    
    # Remove existing PNG files in output directory
    if [ -d "$output_dir" ]; then
        rm -f "$output_dir"/*.png 2>/dev/null || true
    fi
    
    # Copy PNG files to output directory
    log_info "Copying images..."
    if ! cp "$input_dir"/*.png "$output_dir/" 2>/dev/null; then
        log_error "Failed to copy images to output directory"
        return 1
    fi
    
    # Process each PNG file in output directory
    for file in "$output_dir"/*.png; do
        if [ -f "$file" ]; then
            ((total_count++))
            if process_image "$file"; then
                ((success_count++))
            else
                failed_files+=("$(basename "$file")")
            fi
        fi
    done
    
    # Report results
    log_info "Processing complete: $success_count/$total_count files successful"
    
    if [ ${#failed_files[@]} -gt 0 ]; then
        log_warn "Failed to process the following files:"
        for failed_file in "${failed_files[@]}"; do
            log_warn "  - $failed_file"
        done
        return 1
    fi
    
    log_info "All images have been adjusted and saved to '$output_dir'"
    return 0
}

# --- Usage Information ---
show_usage() {
    cat << EOF
Usage: $SCRIPT_NAME <input_directory>

Adjust all PNG images in a directory to the target aspect ratio ($TARGET_W:$TARGET_H)
by adding transparent padding while preserving the original content.

Arguments:
  input_directory    Directory containing PNG images to process

Options:
  -h, --help        Show this help message
  -d, --debug       Enable debug output

Environment Variables:
  DEBUG=1           Enable debug output

Examples:
  $SCRIPT_NAME my_images/
  DEBUG=1 $SCRIPT_NAME my_images/

Output:
  Creates a new directory named '<input_directory>-216x185' containing
  the processed images with adjusted aspect ratios.

EOF
}

# --- Main Function ---
main() {
    local input_dir output_dir
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -d|--debug)
                export DEBUG=1
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "${input_dir:-}" ]; then
                    input_dir="$1"
                else
                    log_error "Too many arguments. Only one directory should be specified."
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if input directory was provided
    if [ -z "${input_dir:-}" ]; then
        log_error "No input directory specified."
        show_usage
        exit 1
    fi
    
    # Remove trailing slash from input directory
    input_dir=${input_dir%/}
    output_dir="${input_dir}-216x185"
    
    # Check dependencies
    check_dependencies
    
    # Validate input
    if ! validate_directory "$input_dir"; then
        exit 1
    fi
    
    if ! validate_output_directory "$output_dir"; then
        exit 1
    fi
    
    # Process the directory
    if process_directory "$input_dir" "$output_dir"; then
        log_info "Success! Processed images are available in '$output_dir'"
        exit 0
    else
        log_error "Processing failed. Some images may not have been processed correctly."
        exit 1
    fi
}

# Run main function
main "$@"