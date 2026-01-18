#!/bin/bash

# Enhanced divide-crop-3x3.sh with improved error handling and validation

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v convert &> /dev/null; then
        missing_deps+=("ImageMagick (convert)")
    fi
    
    if ! command -v identify &> /dev/null; then
        missing_deps+=("ImageMagick (identify)")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - $dep"
        done
        log_error "Please install ImageMagick to continue."
        exit 1
    fi
}

# Validate image file
validate_image() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        log_warn "File '$file' not found"
        return 1
    fi
    
    if [ ! -r "$file" ]; then
        log_warn "File '$file' is not readable"
        return 1
    fi
    
    # Check if it's a valid image using identify
    if ! identify "$file" &> /dev/null; then
        log_warn "File '$file' is not a valid image"
        return 1
    fi
    
    return 0
}

# Process a single image file
process_image() {
    local file="$1"
    local filename extension basename basepath
    
    filename=$(basename -- "$file")
    extension="${filename##*.}"
    basename="${filename%.*}"
    basepath="${file%.*}"
    
    log_info "Processing $file -> ${basepath}-0.${extension} ... ${basepath}-8.${extension}"
    
    # Check if output files already exist
    local existing_files=()
    for i in {0..8}; do
        if [ -f "${basepath}-${i}.${extension}" ]; then
            existing_files+=("${basepath}-${i}.${extension}")
        fi
    done
    
    if [ ${#existing_files[@]} -gt 0 ]; then
        log_warn "Output files already exist and will be overwritten:"
        for existing_file in "${existing_files[@]}"; do
            log_warn "  - $existing_file"
        done
    fi
    
    # Perform the conversion with error handling
    if convert "$file" -crop 3x3@ +repage -trim +repage +adjoin "${basepath}-%d.${extension}"; then
        # Verify all 9 files were created
        local created_count=0
        for i in {0..8}; do
            if [ -f "${basepath}-${i}.${extension}" ]; then
                ((created_count+=1))
            fi
        done
        
        if [ $created_count -eq 9 ]; then
            log_info "Successfully created $created_count files"
            return 0
        else
            log_error "Expected 9 files, but only $created_count were created"
            return 1
        fi
    else
        log_error "Failed to process $file"
        return 1
    fi
}

# Show usage information
show_usage() {
    echo "Usage: $0 file1.png [file2.png ...]"
    echo ""
    echo "This script divides images into 3x3 grids (9 pieces) and trims whitespace."
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 image.png"
    echo "  $0 *.png"
    echo "  $0 image1.png image2.png image3.png"
}

# Main function
main() {
    # Parse arguments
    if [ "$#" -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    # Handle help option
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
    esac
    
    # Check dependencies
    check_dependencies
    
    # Process files
    local success_count=0
    local total_count=0
    local failed_files=()
    
    for file in "$@"; do
        ((total_count+=1))
        
        if validate_image "$file"; then
            if process_image "$file"; then
                ((success_count+=1))
            else
                failed_files+=("$file")
            fi
        else
            failed_files+=("$file")
        fi
        
        echo  # Add blank line between files
    done
    
    # Summary
    log_info "Processing complete: $success_count/$total_count files successful"
    
    if [ ${#failed_files[@]} -gt 0 ]; then
        log_warn "Failed to process the following files:"
        for failed_file in "${failed_files[@]}"; do
            log_warn "  - $failed_file"
        done
        exit 1
    fi
    
    log_info "All files processed successfully!"
}

# Run main function
main "$@"