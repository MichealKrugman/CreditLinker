"""
PIPELINE.PY DEFINITION
======================

PURPOSE:
--------
The deterministic execution engine that transforms bank statement images into structured transaction data.
This is the CORE of the entire SDK.

CRITICAL REQUIREMENT:
---------------------
MUST BE DETERMINISTIC: Same input + same config = same output (always)
MUST BE REPRODUCIBLE: Can replay extraction with identical results

RESPONSIBILITIES:
-----------------
1. Accept image input (from API or direct call)
2. Execute preprocessing pipeline
3. Run text detection
4. Run text recognition on detected regions
5. Reconstruct text into tabular rows using spatial coordinates
6. Apply business rules to convert text into Transaction objects
7. Validate extracted data
8. Return structured LedgerDocument

PIPELINE STAGES:
----------------

Stage 1: LOAD
  Input: Image file path, bytes, or numpy array
  Action: Call preprocessing.image_loader.load()
  Output: Normalized RGB numpy array + metadata
  Error handling: Catch corrupted files, invalid formats

Stage 2: PREPROCESS
  Input: Raw image array
  Action: 
    - preprocessing.normalizer.normalize() - resize, pixel normalization
    - preprocessing.augmentations.enhance() - optional quality improvement
  Output: Preprocessed image ready for detection
  Error handling: Handle out-of-memory, invalid dimensions

Stage 3: DETECT
  Input: Preprocessed image
  Action: Call detector.detect() to find text regions
  Output: List of bounding boxes with coordinates and confidence
  Error handling: Handle no detections, low confidence regions
  Logging: Number of regions detected, average confidence

Stage 4: CROP
  Input: Image + bounding boxes
  Action: preprocessing.cropper.extract_regions()
  Output: List of cropped text line images, sorted by position
  Error handling: Skip invalid crops, ensure minimum size

Stage 5: RECOGNIZE
  Input: List of cropped images
  Action: recognizer.recognize_batch()
  Output: List of RecognitionResult (text + confidence)
  Error handling: Retry failed recognitions, use fallback recognizer
  Logging: Average confidence, processing time per image

Stage 6: RECONSTRUCT
  Input: Recognized text + bounding box positions
  Action: Align text into tabular rows based on spatial layout
  Output: List of table rows (each row = list of cells)
  Logic:
    - Group texts by Y-coordinate (same row if Y within threshold)
    - Sort texts within row by X-coordinate (left to right)
    - Identify columns (date, description, debit, credit, balance)
  Error handling: Handle misaligned text, merged cells

Stage 7: APPLY RULES
  Input: Raw text rows
  Action: rules_engine.ledger_rules.parse_rows()
  Output: List of Transaction objects
  Logic:
    - Identify row type (header, transaction, summary)
    - Parse date column
    - Parse numeric columns (debit, credit, balance)
    - Extract description text
    - Handle multi-line descriptions
  Error handling: Skip invalid rows, flag ambiguous data

Stage 8: VALIDATE
  Input: List of Transaction objects
  Action: rules_engine.validators.validate_ledger()
  Output: Validated transactions + validation report
  Checks:
    - Date sequence (ascending)
    - Balance equation: opening + credits - debits = closing
    - No duplicate transactions
    - All required fields present
  Error handling: Return validation errors with row numbers

Stage 9: FINALIZE
  Input: Validated transactions
  Action: Create LedgerDocument schema object
  Output: Structured LedgerDocument
  Include:
    - List of transactions
    - Summary statistics (total credits, total debits, net)
    - Confidence score (average across all transactions)
    - Metadata (processing time, model used, page count)

FUNCTION SIGNATURE:
-------------------
def run(
    image: Union[str, bytes, np.ndarray],
    config: Optional[Config] = None,
    orchestrator: Optional[Orchestrator] = None
) -> LedgerDocument:
    '''
    Execute the full OCR pipeline.
    
    Args:
        image: Input image (file path, bytes, or numpy array)
        config: Optional config override (uses default if None)
        orchestrator: Optional orchestrator (creates default if None)
    
    Returns:
        LedgerDocument with extracted transactions
    
    Raises:
        PipelineError: If any stage fails critically
        ValidationError: If extracted data fails validation
    '''

ERROR HANDLING STRATEGY:
------------------------
1. Recoverable errors: Log warning, use fallback, continue
   Example: Low confidence region → skip region, continue with others

2. Critical errors: Log error, abort pipeline, return error response
   Example: No text detected in entire image → cannot proceed

3. Partial success: Return what was extracted + warnings
   Example: 10 rows detected, 8 validated → return 8 + warning about 2

LOGGING REQUIREMENTS:
---------------------
Log at each stage:
- Stage name
- Input summary (image dimensions, number of regions, etc.)
- Processing time
- Success/failure status
- Error details (if failed)

Example log output:
  [Pipeline] Stage 1: LOAD - Success (0.12s) - Image: 2480x3508 pixels
  [Pipeline] Stage 2: PREPROCESS - Success (0.23s)
  [Pipeline] Stage 3: DETECT - Success (0.45s) - Detected 24 regions (avg confidence: 0.89)
  [Pipeline] Stage 4: CROP - Success (0.08s) - Extracted 24 crops
  [Pipeline] Stage 5: RECOGNIZE - Success (1.23s) - Recognized 24 texts (avg confidence: 0.87)
  [Pipeline] Stage 6: RECONSTRUCT - Success (0.15s) - Created 12 table rows
  [Pipeline] Stage 7: APPLY RULES - Success (0.34s) - Parsed 10 transactions
  [Pipeline] Stage 8: VALIDATE - Warning (0.05s) - 2 transactions failed validation
  [Pipeline] Stage 9: FINALIZE - Success (0.02s)
  [Pipeline] TOTAL: 2.67s - Extracted 10 transactions

PERFORMANCE TARGETS:
--------------------
- Single page statement: < 3 seconds
- 10 page statement: < 20 seconds
- GPU utilization: > 70% during recognition stage
- Memory usage: < 2GB per pipeline instance

TESTING REQUIREMENTS:
---------------------
- Unit tests for each stage independently
- Integration test for full pipeline
- Regression tests with known good outputs
- Performance benchmarks on standard test set
- Stress test with corrupted/edge-case inputs

THREAD SAFETY:
--------------
- Pipeline instance is NOT thread-safe
- Each request should create new pipeline instance
- Models (detector, recognizer) can be shared across instances
- Use orchestrator to manage model lifecycle

EXAMPLE USAGE:
--------------
from sdk.core.pipeline import run
from sdk.core.config import Config

# Simple usage
result = run("statement.jpg")
print(f"Extracted {len(result.transactions)} transactions")

# With custom config
config = Config(recognizer="trocr", use_beam_search=True)
result = run("statement.jpg", config=config)

# With existing orchestrator (reuse loaded models)
from sdk.core.orchestrator import Orchestrator
orch = Orchestrator()
result = run("statement.jpg", orchestrator=orch)
"""
