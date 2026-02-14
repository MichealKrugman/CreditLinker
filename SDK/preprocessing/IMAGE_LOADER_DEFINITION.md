"""
IMAGE_LOADER.PY DEFINITION
==========================

PURPOSE:
--------
Universal image input handler that accepts various formats and normalizes them into a standard representation.
This is the FIRST step in any OCR pipeline - ensures consistent input format.

RESPONSIBILITIES:
-----------------
1. Accept multiple input formats (file path, bytes, PIL Image, numpy array, base64)
2. Auto-detect image format (JPEG, PNG, TIFF, BMP, PDF)
3. Handle multi-page PDFs (extract all pages as separate images)
4. Convert all formats to standardized RGB numpy array
5. Extract metadata (DPI, dimensions, color space)
6. Handle corrupted/malformed images gracefully
7. Validate image quality (resolution, size, aspect ratio)

SUPPORTED INPUT FORMATS:
------------------------
1. File path (str): "/path/to/image.jpg"
2. Bytes (bytes): Raw image data from HTTP upload
3. PIL Image (PIL.Image.Image): Pillow image object
4. NumPy array (np.ndarray): Already loaded image
5. Base64 string (str): "data:image/jpeg;base64,/9j/4AAQ..."
6. PDF path (str): "/path/to/document.pdf" - extracts all pages

STANDARD OUTPUT FORMAT:
-----------------------
{
  "image": np.ndarray,  # Shape: (H, W, 3), dtype: uint8, color: RGB
  "metadata": {
    "format": "JPEG" | "PNG" | "PDF" | "TIFF",
    "dpi": int | None,
    "original_size": (width, height),
    "color_space": "RGB" | "GRAYSCALE" | "RGBA",
    "page_number": int | None,  # For PDFs
    "total_pages": int | None,  # For PDFs
    "file_size_bytes": int | None
  }
}

FUNCTION SIGNATURES:
--------------------

def load(
    source: Union[str, bytes, PIL.Image.Image, np.ndarray],
    validate: bool = True
) -> Dict[str, Any]:
    '''
    Load image from any supported format.
    
    Args:
        source: Image source (path, bytes, PIL Image, numpy array)
        validate: Whether to validate image quality
    
    Returns:
        Dictionary with 'image' (numpy array) and 'metadata'
    
    Raises:
        ImageLoadError: If image cannot be loaded
        UnsupportedFormatError: If format not supported
        CorruptedImageError: If image is corrupted
    '''

def load_pdf(
    pdf_path: str,
    page_numbers: Optional[List[int]] = None,
    dpi: int = 300
) -> List[Dict[str, Any]]:
    '''
    Load images from PDF file.
    
    Args:
        pdf_path: Path to PDF file
        page_numbers: Specific pages to extract (None = all pages)
        dpi: Resolution for PDF rendering
    
    Returns:
        List of image dictionaries (one per page)
    
    Raises:
        PDFLoadError: If PDF cannot be loaded
    '''

def validate_image(
    image: np.ndarray,
    min_size: Tuple[int, int] = (100, 100),
    max_size: Tuple[int, int] = (10000, 10000),
    min_dpi: int = 72,
    max_aspect_ratio: float = 10.0
) -> bool:
    '''
    Validate image quality.
    
    Args:
        image: Image array to validate
        min_size: Minimum (width, height)
        max_size: Maximum (width, height)
        min_dpi: Minimum DPI (if available)
        max_aspect_ratio: Max width/height ratio
    
    Returns:
        True if valid
    
    Raises:
        ValidationError: If image fails validation (with specific reason)
    '''

def extract_metadata(
    image: Union[PIL.Image.Image, np.ndarray],
    source_path: Optional[str] = None
) -> Dict[str, Any]:
    '''
    Extract metadata from image.
    
    Args:
        image: PIL Image or numpy array
        source_path: Optional source file path (for file size, etc.)
    
    Returns:
        Metadata dictionary
    '''

IMPLEMENTATION LOGIC:
---------------------

Loading from file path:
1. Check file exists
2. Detect format from extension (.jpg, .png, .pdf, etc.)
3. For images: Use PIL.Image.open()
4. For PDFs: Use pdf2image or PyMuPDF
5. Convert to RGB numpy array
6. Extract metadata from EXIF/file properties

Loading from bytes:
1. Detect format from magic bytes (JPEG starts with FF D8, PNG with 89 50 4E 47)
2. Create BytesIO stream
3. Load with PIL.Image.open(stream)
4. Convert to RGB numpy array

Loading from PIL Image:
1. Convert color space to RGB if needed (L → RGB, RGBA → RGB)
2. Convert to numpy array
3. Ensure uint8 dtype

Loading from numpy array:
1. Validate shape (must be HWC or HW)
2. If grayscale (HW), convert to RGB (HW → HWC)
3. Ensure uint8 dtype
4. Ensure RGB channel order (not BGR)

PDF handling:
1. Use pdf2image.convert_from_path() with specified DPI
2. Each page → separate PIL Image
3. Convert each to numpy array
4. Return list of images with page metadata

FORMAT DETECTION:
-----------------
Magic bytes for common formats:
- JPEG: FF D8 FF
- PNG: 89 50 4E 47 0D 0A 1A 0A
- TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
- PDF: 25 50 44 46 (%PDF)
- BMP: 42 4D (BM)

ERROR HANDLING:
---------------

1. File not found:
   raise ImageLoadError(f"File not found: {path}")

2. Corrupted image:
   Try PIL loading
   If fails → try OpenCV loading
   If still fails → raise CorruptedImageError

3. Unsupported format:
   raise UnsupportedFormatError(f"Format not supported: {format}")

4. Out of memory (large image):
   Try downsampling
   If still OOM → raise MemoryError

5. PDF without pdf2image installed:
   raise DependencyError("pdf2image not installed. Run: pip install pdf2image")

COLOR SPACE CONVERSION:
-----------------------

RGBA → RGB:
  RGB = RGBA[:, :, :3]  # Drop alpha channel

CMYK → RGB:
  Use PIL's ImageCms module for proper conversion

Grayscale → RGB:
  RGB = np.stack([gray, gray, gray], axis=-1)

BGR → RGB (from OpenCV):
  RGB = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

VALIDATION RULES:
-----------------

Minimum size: 100x100 pixels
  - Smaller images won't have enough detail for OCR

Maximum size: 10,000x10,000 pixels
  - Larger images may cause OOM
  - Should be downsampled first

Minimum DPI: 72
  - Lower DPI may have poor text clarity

Maximum aspect ratio: 10:1
  - Extremely elongated images may be invalid

USAGE EXAMPLES:
---------------

# Load from file
result = load("statement.jpg")
image = result["image"]  # numpy array (H, W, 3)
print(f"Loaded {result['metadata']['format']} image")

# Load from uploaded bytes
file_bytes = request.files['image'].read()
result = load(file_bytes)

# Load from base64
base64_str = "data:image/png;base64,iVBORw0KGg..."
result = load(base64_str)

# Load PDF (all pages)
pages = load_pdf("statement.pdf")
for i, page in enumerate(pages):
    print(f"Page {i+1}: {page['metadata']['original_size']}")

# Load specific PDF pages
pages = load_pdf("statement.pdf", page_numbers=[1, 2, 5])

# Validate image
try:
    validate_image(image, min_size=(200, 200), min_dpi=150)
except ValidationError as e:
    print(f"Invalid image: {e}")

DEPENDENCIES:
-------------
- Pillow (PIL): Image loading and manipulation
- numpy: Array operations
- pdf2image: PDF to image conversion
- python-magic: File type detection (optional)

Install:
pip install Pillow numpy pdf2image python-magic-bin
"""
