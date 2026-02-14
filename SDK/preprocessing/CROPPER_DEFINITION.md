"""
CROPPER.PY DEFINITION
=====================

PURPOSE:
--------
Extract text line images from detected bounding boxes while preserving spatial alignment.
CRITICAL for financial statements - wrong crop order = wrong transaction sequence.

RESPONSIBILITIES:
-----------------
1. Crop image regions based on bounding boxes from detector
2. Preserve spatial information (sort by position)
3. Add padding around crops for better recognition
4. Handle boundary cases (crops near image edges)
5. Filter invalid crops (too small, extreme aspect ratios)
6. Maintain image quality during cropping

FUNCTION SIGNATURES:
--------------------

def extract_regions(
    image: np.ndarray,
    bounding_boxes: List[BoundingBox],
    padding: int = 5,
    min_crop_size: Tuple[int, int] = (10, 10),
    sort_by_position: bool = True
) -> List[CroppedRegion]:
    '''
    Extract cropped regions from image.
    
    Args:
        image: Source image (H, W, 3)
        bounding_boxes: List of detected boxes
        padding: Pixels to add around each crop
        min_crop_size: Minimum (width, height) for valid crop
        sort_by_position: Whether to sort crops spatially
    
    Returns:
        List of cropped images with metadata
    
    Each CroppedRegion:
    {
      "image": np.ndarray,  # Cropped image
      "bbox": BoundingBox,  # Original bounding box
      "position": (x, y),   # Top-left corner in source image
      "size": (w, h),       # Crop dimensions
      "index": int          # Order index (after sorting)
    }
    '''

def sort_boxes_spatial(
    boxes: List[BoundingBox],
    direction: str = "top-to-bottom-left-to-right"
) -> List[BoundingBox]:
    '''
    Sort bounding boxes by spatial position.
    
    Args:
        boxes: List of bounding boxes
        direction: Sorting direction
          - "top-to-bottom-left-to-right": Row-major (tables)
          - "left-to-right-top-to-bottom": Column-major
          - "reading-order": Natural reading order
    
    Returns:
        Sorted list of boxes
    
    Logic for "top-to-bottom-left-to-right":
      1. Group boxes by Y-coordinate (same row if Y within threshold)
      2. Within each row, sort by X-coordinate (left to right)
      3. Sort rows by minimum Y-coordinate (top to bottom)
    '''

def add_padding(
    image: np.ndarray,
    bbox: BoundingBox,
    padding: int,
    fill_color: Tuple[int, int, int] = (255, 255, 255)
) -> np.ndarray:
    '''
    Add padding around cropped region.
    
    Args:
        image: Source image
        bbox: Bounding box to crop
        padding: Pixels to add on each side
        fill_color: Color for padding (default: white)
    
    Returns:
        Padded crop
    
    Handles edge cases:
      - If padding goes out of bounds, fill with specified color
      - Ensures output is always (H+2*padding, W+2*padding, 3)
    '''

def filter_invalid_crops(
    crops: List[CroppedRegion],
    min_size: Tuple[int, int] = (10, 10),
    max_aspect_ratio: float = 20.0,
    min_aspect_ratio: float = 0.05
) -> List[CroppedRegion]:
    '''
    Remove invalid crops.
    
    Args:
        crops: List of cropped regions
        min_size: Minimum (width, height)
        max_aspect_ratio: Maximum width/height ratio
        min_aspect_ratio: Minimum width/height ratio
    
    Returns:
        Filtered list of valid crops
    
    Filters:
      - Too small (width < min_width OR height < min_height)
      - Too wide (aspect_ratio > max_aspect_ratio)
      - Too tall (aspect_ratio < min_aspect_ratio)
    '''

BOUNDING BOX FORMATS:
---------------------

Quadrilateral (4 corners):
  [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]

Rectangle (x, y, width, height):
  [x, y, w, h]

Convert quadrilateral to rectangle:
  x_min = min(x1, x2, x3, x4)
  y_min = min(y1, y2, y3, y4)
  x_max = max(x1, x2, x3, x4)
  y_max = max(y1, y2, y3, y4)
  width = x_max - x_min
  height = y_max - y_min
  return [x_min, y_min, width, height]

SPATIAL SORTING LOGIC:
----------------------

For financial statements (row-major):

1. Group boxes into rows:
   - Calculate Y-coordinate threshold (e.g., mean box height / 2)
   - Boxes with |Y1 - Y2| < threshold are in same row

2. Sort within rows:
   - Within each row, sort boxes by X-coordinate (left to right)

3. Sort rows:
   - Sort rows by minimum Y-coordinate (top to bottom)

Example:
  Boxes: [(100, 50), (300, 50), (100, 100), (300, 100)]
  Rows: [[(100, 50), (300, 50)], [(100, 100), (300, 100)]]
  Sorted: [(100, 50), (300, 50), (100, 100), (300, 100)]

EDGE CASE HANDLING:
-------------------

1. Crop extends beyond image boundaries:
   x_start = max(0, x - padding)
   y_start = max(0, y - padding)
   x_end = min(image.width, x + w + padding)
   y_end = min(image.height, y + h + padding)

2. Overlapping bounding boxes:
   Keep all crops (don't deduplicate)
   Recognizer will handle duplicates

3. Rotated text (quadrilateral boxes):
   Rotate crop to horizontal before returning
   Use cv2.warpAffine() or similar

4. Very small text (< 10 pixels height):
   Skip crop (too small for recognition)
   Log warning

USAGE EXAMPLES:
---------------

from sdk.preprocessing.cropper import extract_regions, sort_boxes_spatial

# Basic usage
crops = extract_regions(image, bounding_boxes)

# Custom padding
crops = extract_regions(image, bounding_boxes, padding=10)

# No sorting (preserve detection order)
crops = extract_regions(image, bounding_boxes, sort_by_position=False)

# Manual sorting
sorted_boxes = sort_boxes_spatial(boxes, direction="top-to-bottom-left-to-right")

# Access crops
for i, crop in enumerate(crops):
    cv2.imwrite(f"crop_{i}.jpg", crop["image"])
    print(f"Crop {i} position: {crop['position']}, size: {crop['size']}")
"""
