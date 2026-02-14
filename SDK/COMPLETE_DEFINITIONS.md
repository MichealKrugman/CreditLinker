"""
SDK COMPLETE FILE DEFINITIONS - REMAINING MODULES

This document contains definitions for all remaining SDK files.
Each section defines what the file should contain.

================================================================================
PREPROCESSING MODULES
================================================================================

preprocessing/image_loader.py
------------------------------
CLASS: ImageLoader

METHODS:
- load_from_path(file_path: str) -> np.ndarray
  * Read from filesystem
  * Support: JPEG, PNG, TIFF, BMP, PDF
  * Handle multi-page PDFs (return list of images)
  * Auto-detect format using magic bytes
  * Return RGB numpy array (H, W, 3)

- load_from_bytes(data: bytes) -> np.ndarray
  * Decode image from bytes
  * Handle base64 encoded strings
  * Validate format

- load_from_pil(pil_image: PIL.Image) -> np.ndarray
  * Convert PIL Image to numpy
  * Ensure RGB (convert from RGBA, grayscale, etc.)

- extract_metadata(image_data) -> dict
  * Extract DPI, dimensions, color space
  * Return metadata dict

ERROR HANDLING:
- Catch corrupted images → Return clear error
- Unsupported formats → Suggest conversion
- PDF errors → Indicate which page failed

OUTPUT:
{
  "image": np.ndarray,  # (H, W, 3) uint8
  "metadata": {
    "format": "JPEG",
    "dpi": 300,
    "width": 2480,
    "height": 3508,
    "color_space": "RGB"
  }
}

---

preprocessing/cropper.py
------------------------
CLASS: ImageCropper

METHODS:
- extract_regions(image: np.ndarray, bboxes: List[BoundingBox]) -> List[np.ndarray]
  * For each bbox, crop region from image
  * Add padding (2-5 pixels) around box
  * Handle bbox at image edges (clip to bounds)
  * Preserve aspect ratio
  * Return list of cropped images

- sort_regions_spatial(bboxes: List[BoundingBox]) -> List[BoundingBox]
  * Sort top-to-bottom (primary)
  * Sort left-to-right within same row (secondary)
  * Row detection: Group boxes with similar Y-coordinates (± 10 pixels)
  * CRITICAL: Correct ordering = correct transaction sequence

- filter_small_regions(bboxes: List[BoundingBox], min_size: int) -> List[BoundingBox]
  * Remove boxes smaller than min_size pixels
  * Remove extreme aspect ratios (> 20:1 or < 1:20)

- add_padding(image: np.ndarray, bbox: BoundingBox, padding: int) -> np.ndarray
  * Expand bbox by padding pixels
  * Clip to image boundaries
  * Fill out-of-bounds areas with white

CRITICAL FOR LEDGERS:
- Spatial ordering determines transaction chronology
- Incorrect sort = wrong financial data
- Must handle multi-line descriptions (merge vertically adjacent boxes)

---

preprocessing/normalizer.py
---------------------------
CLASS: ImageNormalizer

METHODS:
- normalize(image: np.ndarray, target_size: tuple, model: str) -> np.ndarray
  * Resize to target_size (e.g., 384x384 for TrOCR)
  * Apply model-specific normalization:
    - TrOCR: ImageNet stats
    - Paddle: PaddleOCR normalization
    - Tesseract: No normalization needed
  * Maintain aspect ratio with padding OR stretch (configurable)
  * Return normalized tensor

- resize_with_padding(image: np.ndarray, target_size: tuple) -> np.ndarray
  * Resize maintaining aspect ratio
  * Pad to target size with white background
  * Center image in padded space

- resize_with_stretch(image: np.ndarray, target_size: tuple) -> np.ndarray
  * Stretch image to exact target size
  * May distort aspect ratio

- apply_normalization(image: np.ndarray, mean: tuple, std: tuple) -> np.ndarray
  * Convert to float [0, 1]
  * Apply: (pixel - mean) / std
  * Return normalized array

- to_tensor(image: np.ndarray) -> np.ndarray
  * Rearrange: (H, W, C) → (C, H, W)
  * Add batch dimension: (C, H, W) → (1, C, H, W)
  * Ensure contiguous memory layout

NORMALIZATION VALUES:
- ImageNet: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
- PaddleOCR: mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]

CRITICAL:
- Wrong normalization = garbage model output
- Must match training normalization exactly

---

preprocessing/augmentations.py
------------------------------
CLASS: ImageAugmenter

PURPOSE: Improve OCR on degraded/poor quality scans

METHODS:
- assess_quality(image: np.ndarray) -> dict
  * Compute: blur score, contrast score, brightness
  * Return quality metrics
  * Decide if augmentation needed

- denoise(image: np.ndarray, method: str) -> np.ndarray
  * Methods: "gaussian", "bilateral", "nlm" (non-local means)
  * Remove noise while preserving edges
  * Use when: quality_score["noise"] > threshold

- enhance_contrast(image: np.ndarray, method: str) -> np.ndarray
  * Methods: "histogram_eq", "clahe", "gamma"
  * Improve text visibility
  * Use when: quality_score["contrast"] < threshold

- binarize(image: np.ndarray, method: str) -> np.ndarray
  * Methods: "otsu", "adaptive", "sauvola"
  * Convert to black & white
  * Good for: low contrast, faded text

- deskew(image: np.ndarray) -> np.ndarray
  * Detect text rotation angle
  * Rotate to horizontal
  * Use Hough transform or projection profile

- remove_shadows(image: np.ndarray) -> np.ndarray
  * Detect shadow regions
  * Normalize lighting
  * Background subtraction

AUTO-APPLY LOGIC:
```python
quality = assess_quality(image)
if quality["blur"] > 0.5:
    image = denoise(image, "nlm")
if quality["contrast"] < 0.3:
    image = enhance_contrast(image, "clahe")
if quality["skew_angle"] > 2:
    image = deskew(image)
return image
```

IMPORTANT:
- Only apply if needed (can worsen good images)
- Not for training augmentation
- Not for creating synthetic data

================================================================================
OCR/MODELS DIRECTORY - INSTRUCTION
================================================================================

ocr/models/trocr/INSTRUCTION.txt
---------------------------------
REQUIRED FILES:

1. encoder.onnx
   - TrOCR vision encoder model
   - Converts image patches to embeddings
   - Input: (1, 3, 384, 384) image tensor
   - Output: (1, sequence_length, hidden_size) embeddings

2. decoder.onnx
   - TrOCR text decoder model
   - Generates character sequence from embeddings
   - Input: encoder embeddings + previous tokens
   - Output: next token probabilities

3. vocab.json
   - BPE vocabulary mapping
   - Format: {"token": token_id}
   - Example: {"a": 0, "the": 256, "##ing": 512}

4. merges.txt
   - BPE merge operations
   - Format: "token1 token2" (one per line)
   - Used for tokenization

HOW TO OBTAIN:

Option 1: Export from Hugging Face
```bash
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch

model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-printed")
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-printed")

# Export encoder
dummy_input = torch.randn(1, 3, 384, 384)
torch.onnx.export(
    model.encoder,
    dummy_input,
    "encoder.onnx",
    input_names=["pixel_values"],
    output_names=["last_hidden_state"],
    dynamic_axes={"pixel_values": {0: "batch"}}
)

# Export decoder (more complex, see full export script)

# Save vocab and merges
processor.tokenizer.save_pretrained("./")
# This creates vocab.json and merges.txt
```

Option 2: Download pre-exported
- Check project releases for pre-exported ONNX models
- Ensure version compatibility

VERIFICATION:
- encoder.onnx size: ~300MB
- decoder.onnx size: ~400MB
- vocab.json: ~1MB
- merges.txt: ~500KB

TEST INFERENCE:
```python
import onnxruntime as ort
session = ort.InferenceSession("encoder.onnx")
# Should load without errors
```

================================================================================
OCR/RECOGNITION - NEW FILES
================================================================================

ocr/recognition/trocr_recognizer.py
------------------------------------
CLASS: TrOCRRecognizer(BaseRecognizer)

DEPENDENCIES:
- onnxruntime
- numpy
- json (for vocab loading)

INITIALIZATION:
def __init__(self, config: Config):
    - Load encoder.onnx using onnxruntime
    - Load decoder.onnx using onnxruntime
    - Load vocab.json
    - Load merges.txt
    - Initialize BPE tokenizer
    - Set device (CPU or CUDA)

METHODS:
- recognize(image_crop: np.ndarray) -> RecognitionResult
  1. Preprocess: resize to 384x384, normalize
  2. Run encoder: embeddings = encoder_session.run(image)
  3. Initialize decoder with BOS token
  4. Generate sequence:
     - If use_beam_search: call decoders.beam_search()
     - Else: call decoders.greedy_decode()
  5. Decode tokens to text using vocab
  6. Compute confidence from probabilities
  7. Return RecognitionResult

- recognize_batch(images: List[np.ndarray]) -> List[RecognitionResult]
  * Stack images into batch
  * Run encoder on batch
  * Decode each sequence
  * Return list of results

- _preprocess(image: np.ndarray) -> np.ndarray
  * Resize to 384x384
  * Convert to RGB
  * Normalize with ImageNet stats
  * Rearrange to (1, C, H, W)

- _decode_tokens(token_ids: List[int]) -> str
  * Convert token IDs to text using vocab
  * Handle BPE merges
  * Remove special tokens (BOS, EOS, PAD)

ONNX SESSION CREATION:
```python
import onnxruntime as ort

encoder_session = ort.InferenceSession(
    config.trocr_encoder_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)

decoder_session = ort.InferenceSession(
    config.trocr_decoder_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
```

NO PYTORCH REQUIRED:
- Pure ONNX Runtime inference
- No transformers library at runtime
- Frozen models only

---

ocr/recognition/decoders.py
---------------------------
PURPOSE: Text generation algorithms for sequence models

FUNCTION: greedy_decode
```python
def greedy_decode(
    decoder_session,
    encoder_outputs: np.ndarray,
    vocab: dict,
    max_length: int = 256,
    bos_token_id: int = 2,
    eos_token_id: int = 3
) -> tuple[List[int], float]:
    """
    Greedy decoding: select highest probability token at each step.
    
    Args:
        decoder_session: ONNX decoder session
        encoder_outputs: Encoder embeddings
        vocab: Token vocabulary
        max_length: Maximum sequence length
        bos_token_id: Begin of sequence token
        eos_token_id: End of sequence token
    
    Returns:
        (token_ids, confidence)
    
    Algorithm:
    1. Start with BOS token
    2. Loop until EOS or max_length:
        a. Run decoder with current tokens
        b. Get logits for next token
        c. Select token with highest probability
        d. Append to sequence
        e. If token is EOS, stop
    3. Return sequence and average confidence
    """
```

FUNCTION: beam_search_decode
```python
def beam_search_decode(
    decoder_session,
    encoder_outputs: np.ndarray,
    vocab: dict,
    beam_width: int = 5,
    max_length: int = 256,
    bos_token_id: int = 2,
    eos_token_id: int = 3,
    length_penalty: float = 1.0
) -> tuple[List[int], float]:
    """
    Beam search: keep top-k candidates at each step.
    
    Args:
        beam_width: Number of beams to maintain
        length_penalty: Penalty for longer sequences (< 1.0 = prefer longer)
    
    Returns:
        (best_token_ids, best_confidence)
    
    Algorithm:
    1. Initialize beam with BOS token
    2. Loop until all beams end or max_length:
        a. For each beam:
           - Run decoder
           - Get top-k next tokens
           - Create k new candidates
        b. Keep top beam_width candidates by score
        c. If all end with EOS, stop
    3. Apply length penalty
    4. Return best sequence
    
    Score = log_prob / (length ** length_penalty)
    """
```

UTILITIES:
- softmax(logits) -> probabilities
- log_softmax(logits) -> log probabilities
- top_k(probabilities, k) -> top k tokens and scores

================================================================================
OCR/FACTORY AND CONFIG
================================================================================

ocr/factory.py
--------------
PURPOSE: Create detector/recognizer instances

PATTERN: Factory Pattern

CLASS: OCRFactory

REGISTRY:
```python
DETECTOR_REGISTRY = {
    "paddle": PaddleDetector,
    # Future: "dbnet": DBNetDetector
}

RECOGNIZER_REGISTRY = {
    "trocr": TrOCRRecognizer,
    "paddle": PaddleRecognizer,
    "tesseract": TesseractRecognizer
}
```

METHODS:
```python
@staticmethod
def create_detector(name: str, config: Config) -> BaseDetector:
    """
    Create detector instance.
    
    Example:
        detector = OCRFactory.create_detector("paddle", config)
    """
    if name not in DETECTOR_REGISTRY:
        raise ValueError(f"Unknown detector: {name}")
    
    detector_class = DETECTOR_REGISTRY[name]
    return detector_class(config)

@staticmethod
def create_recognizer(name: str, config: Config) -> BaseRecognizer:
    """Create recognizer instance."""
    if name not in RECOGNIZER_REGISTRY:
        raise ValueError(f"Unknown recognizer: {name}")
    
    recognizer_class = RECOGNIZER_REGISTRY[name]
    return recognizer_class(config)

@staticmethod
def list_available_detectors() -> List[str]:
    """Return list of registered detectors."""
    return list(DETECTOR_REGISTRY.keys())

@staticmethod
def list_available_recognizers() -> List[str]:
    """Return list of registered recognizers."""
    return list(RECOGNIZER_REGISTRY.keys())
```

USAGE:
```python
from ocr.factory import OCRFactory

detector = OCRFactory.create_detector("paddle", config)
recognizer = OCRFactory.create_recognizer("trocr", config)
```

---

ocr/config.py
-------------
OCR-specific configuration values.

Extends core.config.Config with OCR-specific settings:

```python
class OCRConfig:
    # Detection
    detection_model: str = "paddle"
    detection_threshold: float = 0.6
    detection_box_thresh: float = 0.5
    detection_unclip_ratio: float = 1.5
    
    # Recognition
    recognition_model: str = "trocr"
    recognition_threshold: float = 0.7
    use_beam_search: bool = True
    beam_width: int = 5
    
    # TrOCR specific
    trocr_max_length: int = 256
    trocr_temperature: float = 1.0
    
    # Tesseract specific
    tesseract_lang: str = "eng"
    tesseract_psm: int = 7  # Single text line
    
    # Model paths
    model_dir: str = "ocr/models/"
    cache_dir: str = ".cache/ocr/"
```

================================================================================
RULES ENGINE
================================================================================

rules_engine/ledger_rules.py
-----------------------------
PURPOSE: Transform raw OCR text into structured transaction data

CLASS: LedgerParser

METHODS:
- parse_transactions(raw_rows: List[str]) -> List[Transaction]
  1. Detect header row (contains "Date", "Description", "Debit", etc.)
  2. Identify column positions from header
  3. For each row:
     a. Extract fields based on column positions
     b. Parse date
     c. Parse amounts (debit, credit, balance)
     d. Clean description
     e. Assign category
  4. Return list of Transaction objects

- detect_columns(header_row: str) -> ColumnMapping
  * Find column positions by keyword matching
  * Keywords: "date", "description", "narration", "debit", "credit", "balance"
  * Handle variations: "Dr", "Cr", "Dr./Cr."
  * Return: {col_name: (start_pos, end_pos)}

- parse_date(date_str: str) -> datetime
  * Try multiple formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  * Handle edge cases: missing leading zeros, year shortcuts (26 → 2026)
  * Return: datetime object

- parse_amount(amount_str: str) -> float
  * Remove currency symbols: ₦, $, etc.
  * Remove thousand separators: 1,234.56 → 1234.56
  * Handle negative indicators: (123), -123, 123 DR
  * Return: float value

- merge_multiline_descriptions(rows: List[dict]) -> List[dict]
  * Detect continuation rows (no date, amount fields)
  * Merge with previous transaction
  * Join description text

- assign_category(description: str, amount: float) -> TransactionCategory
  * Keyword matching:
    - "SALARY", "PAY" → INCOME
    - "TRANSFER TO", "ATM" → TRANSFER
    - "FEE", "CHARGE" → FEE
    - "PURCHASE", "POS" → EXPENSE
  * Amount-based rules:
    - Large regular amounts → SALARY
    - Round numbers → TRANSFER
  * Return: TransactionCategory enum

---

rules_engine/validators.py
---------------------------
CLASS: TransactionValidator

METHODS:
- validate_transactions(transactions: List[Transaction]) -> ValidationResult
  * Run all validation checks
  * Collect errors and warnings
  * Return: {valid: bool, errors: List, warnings: List}

- validate_date_format(transaction: Transaction) -> bool
  * Check date is valid datetime
  * Check date is within reasonable range (not future, not too old)

- validate_amount(transaction: Transaction) -> bool
  * Check amounts are numeric
  * Check amounts are not negative (unless debit)
  * Check reasonable magnitude (not 0.00000001 or 999999999999)

- validate_balance_consistency(transactions: List[Transaction]) -> bool
  * Compute running balance
  * Check: opening + credits - debits = closing
  * Allow small floating-point tolerance (±0.01)

- detect_duplicates(transactions: List[Transaction]) -> List[int]
  * Find transactions with:
    - Same date
    - Same amount
    - Similar description (fuzzy match)
  * Return indices of suspected duplicates

- check_missing_fields(transaction: Transaction) -> List[str]
  * Verify all required fields present:
    - date
    - amount (debit or credit)
    - description
  * Return list of missing fields

VALIDATION LEVELS:
- STRICT: Fail on any error
- MEDIUM: Warn on errors, allow proceed
- LENIENT: Log errors, continue processing

---

rules_engine/confidence.py
---------------------------
CLASS: ConfidenceScorer

PURPOSE: Compute extraction confidence for quality assessment

METHODS:
- compute_document_confidence(
    transactions: List[Transaction],
    detection_results: List[DetectionBox],
    recognition_results: List[RecognitionResult],
    validation_result: ValidationResult
) -> float:
    """
    Combine multiple confidence sources into single score.
    
    Weights:
    - Detection confidence: 20%
    - Recognition confidence: 40%
    - Validation success: 40%
    """

- compute_detection_confidence(boxes: List[DetectionBox]) -> float
  * Average confidence of all detected boxes
  * Penalize if few boxes detected

- compute_recognition_confidence(results: List[RecognitionResult]) -> float
  * Average confidence of all recognized texts
  * Penalize low-confidence words

- compute_validation_confidence(validation: ValidationResult) -> float
  * 1.0 if all validations pass
  * Reduce by 0.2 for each error
  * Reduce by 0.1 for each warning

CONFIDENCE THRESHOLDS:
- > 0.9: High confidence (auto-approve)
- 0.7 - 0.9: Medium (auto-approve with review flag)
- < 0.7: Low (requires manual review)

================================================================================
SCHEMAS
================================================================================

schemas/ledger_schema.py
------------------------
DATA MODELS for structured ledger output

Using Pydantic for validation:

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List, Optional
from enum import Enum

class TransactionCategory(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    FEE = "fee"
    UNKNOWN = "unknown"

class Transaction(BaseModel):
    date: datetime
    description: str
    debit: Optional[float] = None
    credit: Optional[float] = None
    balance: Optional[float] = None
    category: TransactionCategory = TransactionCategory.UNKNOWN
    currency: str = "NGN"
    confidence: float = Field(ge=0.0, le=1.0)
    
    @validator('debit', 'credit', 'balance')
    def validate_amounts(cls, v):
        if v is not None and v < 0:
            raise ValueError("Amounts cannot be negative")
        return v
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class LedgerPage(BaseModel):
    page_number: int
    transactions: List[Transaction]
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    date_range: Optional[tuple[datetime, datetime]] = None

class LedgerDocument(BaseModel):
    pages: List[LedgerPage]
    total_transactions: int
    total_credits: float
    total_debits: float
    currency: str
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    statement_period: Optional[tuple[datetime, datetime]] = None
    confidence: float
    warnings: List[str] = []
    processing_metadata: dict = {}
    
    def to_dict(self) -> dict:
        """Export to JSON-serializable dict."""
        return self.dict()
    
    def to_json(self, indent: int = 2) -> str:
        """Export to JSON string."""
        return self.json(indent=indent)
```

---

schemas/api_models.py
---------------------
Request/response models for API

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class RecognizerType(str, Enum):
    TROCR = "trocr"
    PADDLE = "paddle"
    TESSERACT = "tesseract"

class ProcessingOptions(BaseModel):
    recognizer: RecognizerType = RecognizerType.TROCR
    use_beam_search: bool = True
    beam_width: int = 5
    apply_preprocessing: bool = True
    include_debug_info: bool = False

class ExtractRequest(BaseModel):
    # Handled via multipart/form-data
    # Documented here for OpenAPI spec
    pass

class ExtractResponse(BaseModel):
    success: bool
    ledger: Optional[dict] = None  # LedgerDocument.to_dict()
    processing_time: float
    confidence: float
    warnings: List[str] = []
    error: Optional[str] = None

class BatchExtractResponse(BaseModel):
    success: bool
    results: List[ExtractResponse]
    total_processed: int
    total_failed: int

class HealthCheckResponse(BaseModel):
    status: str  # "healthy" | "degraded" | "unhealthy"
    models_loaded: List[str]
    gpu_available: bool
    version: str
```

================================================================================
TRAINING
================================================================================

training/dataset.py
-------------------
Dataset loader for model training

CLASS: LedgerDataset

```python
from torch.utils.data import Dataset
from typing import List, Tuple
import json

class LedgerDataset(Dataset):
    """
    Dataset for training OCR models on ledger data.
    
    Expected format:
    {
        "images": ["path/to/img1.jpg", "path/to/img2.jpg"],
        "annotations": [
            {"text": "12/01/2024", "bbox": [10, 20, 100, 40]},
            {"text": "Salary Payment", "bbox": [110, 20, 300, 40]}
        ]
    }
    """
    
    def __init__(self, annotation_file: str, image_dir: str, transform=None):
        with open(annotation_file) as f:
            self.data = json.load(f)
        self.image_dir = image_dir
        self.transform = transform
    
    def __len__(self):
        return len(self.data["images"])
    
    def __getitem__(self, idx):
        image_path = os.path.join(self.image_dir, self.data["images"][idx])
        image = Image.open(image_path).convert("RGB")
        
        annotation = self.data["annotations"][idx]
        text = annotation["text"]
        bbox = annotation["bbox"]
        
        if self.transform:
            image = self.transform(image)
        
        return {
            "image": image,
            "text": text,
            "bbox": bbox
        }
```

METHODS:
- create_splits(train_ratio=0.8, val_ratio=0.1, test_ratio=0.1)
  * Split dataset into train/val/test
  * Ensure balanced distribution

- get_augmented_dataset(augmentations)
  * Apply data augmentation
  * Return augmented version

---

training/train.py
-----------------
Training script for fine-tuning models

```python
def train_trocr(
    train_dataset,
    val_dataset,
    config: TrainingConfig,
    output_dir: str
):
    """
    Fine-tune TrOCR on custom ledger data.
    
    Steps:
    1. Load pretrained TrOCR
    2. Freeze encoder (optional)
    3. Train decoder on ledger text
    4. Validate on val_dataset
    5. Save checkpoints
    6. Export to ONNX
    """
    
    # Training loop
    for epoch in range(num_epochs):
        for batch in train_loader:
            # Forward pass
            outputs = model(images, labels=labels)
            loss = outputs.loss
            
            # Backward pass
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
        
        # Validation
        val_loss = evaluate(model, val_loader)
        
        # Save checkpoint
        if val_loss < best_val_loss:
            save_checkpoint(model, output_dir)
            best_val_loss = val_loss
    
    # Export to ONNX
    export_to_onnx(model, output_dir)
```

---

training/evaluate.py
--------------------
(Already created previously - has complete evaluation metrics)

================================================================================
VENDOR
================================================================================

vendor/PaddleOCR/INSTRUCTION.txt
---------------------------------
PADDLEOCR INTEGRATION

PURPOSE:
PaddleOCR is used for text detection. It's vendored to avoid version conflicts.

INSTALLATION:

Option 1: Clone PaddleOCR repository
```bash
cd SDK/vendor/
git clone https://github.com/PaddlePaddle/PaddleOCR.git
cd PaddleOCR
git checkout release/2.7  # Use stable version
```

Option 2: Install via pip (not recommended for production)
```bash
pip install paddleocr paddlepaddle
```

REQUIRED FILES:
- PaddleOCR/
  - ppocr/
    - __init__.py
    - data/
    - modeling/
    - losses/
    - optimizer/
    - postprocess/
    - utils/
  - tools/
    - infer/
      - predict_det.py  (detection inference)
      - predict_rec.py  (recognition inference)

MODELS:
Download pretrained models:
```bash
cd SDK/vendor/PaddleOCR/

# Detection model
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_det_infer.tar
tar -xf en_PP-OCRv3_det_infer.tar

# Recognition model (optional, we use TrOCR)
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_rec_infer.tar
tar -xf en_PP-OCRv3_rec_infer.tar
```

VERIFICATION:
```python
import sys
sys.path.insert(0, "SDK/vendor/PaddleOCR")

from ppocr.utils.utility import check_and_read_gif
# Should import without errors
```

IMPORTANT:
- Do NOT modify PaddleOCR code
- Keep as frozen dependency
- Update only when necessary and with full testing

VERSION PINNING:
- Recommended: PaddleOCR v2.7.x
- PaddlePaddle: 2.5.x

================================================================================
ROOT SDK FILES
================================================================================

SDK/__init__.py
---------------
Package initialization

```python
"""
CreditLinker SDK - Financial Document OCR

Main Components:
- core.pipeline: Document extraction pipeline
- core.orchestrator: Model management
- api: REST API interface
- ocr: Detection and recognition models
- rules_engine: Transaction parsing and validation
- schemas: Data models
"""

__version__ = "1.0.0"

from .core.pipeline import ExtractionPipeline
from .core.orchestrator import Orchestrator
from .core.config import Config
from .schemas.ledger_schema import LedgerDocument, Transaction

__all__ = [
    "ExtractionPipeline",
    "Orchestrator",
    "Config",
    "LedgerDocument",
    "Transaction"
]
```

---

SDK/README.md
-------------
```markdown
# CreditLinker SDK

Financial document OCR and extraction system.

## Features
- Multi-backend OCR (TrOCR, PaddleOCR, Tesseract)
- Bank statement parsing
- Transaction extraction
- Confidence scoring

## Quick Start

```python
from SDK import Orchestrator, Config

# Load config
config = Config.load("config.yaml")

# Initialize
orchestrator = Orchestrator(config)
orchestrator.register_recognizer("trocr", TrOCRRecognizer)

# Extract
import cv2
image = cv2.imread("statement.jpg")
result = orchestrator.execute(image)

# Access transactions
for txn in result.transactions:
    print(txn.date, txn.amount)
```

## Installation
See INSTALL.md

## Documentation
See docs/
```

---

SDK/requirements.txt
--------------------
```
# Core
numpy>=1.21.0
opencv-python>=4.5.0
Pillow>=9.0.0

# OCR
onnxruntime>=1.12.0  # or onnxruntime-gpu
pytesseract>=0.3.9

# PaddlePaddle (optional, for detection)
paddlepaddle>=2.5.0  # or paddlepaddle-gpu

# Data models
pydantic>=2.0.0

# API
fastapi>=0.100.0
uvicorn>=0.22.0
python-multipart>=0.0.6

# Utils
pyyaml>=6.0
python-dateutil>=2.8.0
```

================================================================================
END OF DEFINITIONS
================================================================================

All files are now defined with clear specifications.
Each file has:
- Purpose
- Methods/Functions
- Input/Output formats
- Error handling
- Usage examples

Next steps:
1. Review these definitions
2. Implement each file according to spec
3. Write unit tests for each module
4. Integration test full pipeline
"""