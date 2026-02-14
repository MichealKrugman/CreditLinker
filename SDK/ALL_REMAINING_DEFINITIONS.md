"""
REMAINING CRITICAL DEFINITION FILES - CONDENSED FORMAT

This file contains condensed definitions for all remaining high-priority files.
Each section provides enough detail for implementation.

================================================================================
FILE: ocr/detection/paddle_detector.py
================================================================================

PURPOSE: PaddleOCR text detection wrapper

CLASS: PaddleDetector(BaseDetector)

DEPENDENCIES:
- from ocr.detection.base_detector import BaseDetector, BoundingBox
- import sys, os
- sys.path.insert(0, "vendor/PaddleOCR")
- from tools.infer.predict_det import TextDetector

METHODS:
1. __init__(config):
   - Call super().__init__(config)
   - self.model_name = "paddle"
   - self._load_model()

2. _load_model():
   - detector_config = {
       'det_model_dir': config['model_path'],
       'use_gpu': config.get('use_gpu', False)
     }
   - self.detector = TextDetector(detector_config)

3. detect(image: np.ndarray) -> List[BoundingBox]:
   - boxes, scores = self.detector(image)
   - Convert to BoundingBox format
   - boxes = [BoundingBox(bbox=box.tolist(), confidence=score)
              for box, score in zip(boxes, scores)]
   - return self.post_process(boxes)

INTEGRATION:
- Inherits from BaseDetector
- Uses PaddleOCR from vendor/
- Returns standardized BoundingBox list

================================================================================
FILE: ocr/recognition/base_recognizer.py
================================================================================

PURPOSE: Abstract base class for all text recognition models

CLASS: BaseRecognizer(ABC)

@dataclass
class RecognitionResult:
    text: str
    confidence: float  # 0.0 to 1.0
    char_confidences: List[float] = field(default_factory=list)

ABSTRACT METHODS:
1. __init__(config: Dict):
   - self.config = config
   - self.model_name = "base"
   - self.vocab = None
   - self.max_seq_length = config.get('max_seq_length', 256)

2. @abstractmethod
   recognize(image: np.ndarray) -> RecognitionResult:
   - Input: Cropped text line image (H, W, 3)
   - Output: RecognitionResult
   - MUST BE IMPLEMENTED

3. @abstractmethod
   recognize_batch(images: List[np.ndarray]) -> List[RecognitionResult]:
   - Batch processing
   - MUST BE IMPLEMENTED

NON-ABSTRACT METHODS:
4. _preprocess(image: np.ndarray) -> np.ndarray:
   - Resize, normalize for model
   - Override if needed

5. get_stats(results: List[RecognitionResult]) -> Dict:
   - Return avg confidence, min/max, etc.

================================================================================
FILE: ocr/recognition/trocr_recognizer.py ⭐ CRITICAL
================================================================================

PURPOSE: TrOCR ONNX inference for text recognition

CLASS: TrOCRRecognizer(BaseRecognizer)

DEPENDENCIES:
- import onnxruntime as ort
- import json
- from ocr.recognition.base_recognizer import BaseRecognizer, RecognitionResult
- from ocr.recognition.decoders import greedy_decode, beam_search_decode
- from preprocessing.normalizer import ImageNormalizer

INITIALIZATION:
def __init__(self, config: Dict):
    super().__init__(config)
    self.model_name = "trocr"
    
    # Load ONNX sessions
    self.encoder_session = ort.InferenceSession(
        config['encoder_path'],
        providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
    )
    self.decoder_session = ort.InferenceSession(
        config['decoder_path'],
        providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
    )
    
    # Load vocabulary
    with open(config['vocab_path']) as f:
        self.vocab = json.load(f)
    self.id_to_token = {v: k for k, v in self.vocab.items()}
    
    # Load BPE merges
    with open(config['merges_path']) as f:
        self.merges = [line.strip() for line in f]
    
    # Normalizer
    self.normalizer = ImageNormalizer(model_type="trocr")
    
    # Decoding settings
    self.use_beam_search = config.get('use_beam_search', True)
    self.beam_width = config.get('beam_width', 5)

KEY METHODS:
1. recognize(image: np.ndarray) -> RecognitionResult:
   # Preprocess
   tensor = self.normalizer.normalize(image, target_size=(384, 384))
   
   # Encode
   encoder_outputs = self.encoder_session.run(
       ['last_hidden_state'],
       {'pixel_values': tensor}
   )[0]
   
   # Decode
   if self.use_beam_search:
       token_ids, score = beam_search_decode(
           self.decoder_session,
           encoder_outputs,
           self.vocab,
           beam_width=self.beam_width
       )
   else:
       token_ids, score = greedy_decode(
           self.decoder_session,
           encoder_outputs,
           self.vocab
       )
   
   # Convert tokens to text
   text = self._decode_tokens(token_ids)
   
   return RecognitionResult(text=text, confidence=score)

2. recognize_batch(images: List[np.ndarray]) -> List[RecognitionResult]:
   # Stack images
   tensors = [self.normalizer.normalize(img, (384, 384)) for img in images]
   batch_tensor = np.concatenate(tensors, axis=0)
   
   # Batch encode
   encoder_outputs = self.encoder_session.run(
       ['last_hidden_state'],
       {'pixel_values': batch_tensor}
   )[0]
   
   # Decode each sequence
   results = []
   for i in range(len(images)):
       encoder_out = encoder_outputs[i:i+1]  # Single item
       # Decode...
       results.append(result)
   
   return results

3. _decode_tokens(token_ids: List[int]) -> str:
   # Convert IDs to tokens
   tokens = [self.id_to_token.get(tid, '<unk>') for tid in token_ids]
   
   # Apply BPE merges (simplified)
   text = ''.join(tokens).replace('Ġ', ' ').strip()
   
   # Clean special tokens
   text = text.replace('<pad>', '').replace('<s>', '').replace('</s>', '')
   
   return text.strip()

CRITICAL NOTES:
- NO PyTorch dependency
- Pure ONNX Runtime
- Frozen model inference only
- Use decoders.py for text generation

================================================================================
FILE: ocr/recognition/paddle_recognizer.py
================================================================================

PURPOSE: PaddleOCR recognition fallback

CLASS: PaddleRecognizer(BaseRecognizer)

SETUP:
- Similar to paddle_detector
- from tools.infer.predict_rec import TextRecognizer
- Load PaddleOCR recognition model

METHOD: recognize(image):
- result = self.recognizer(image)
- text = result[0][0]  # PaddleOCR returns [(text, confidence)]
- confidence = result[0][1]
- return RecognitionResult(text, confidence)

================================================================================
FILE: ocr/recognition/tesseract_recognizer.py
================================================================================

PURPOSE: Tesseract OCR fallback

CLASS: TesseractRecognizer(BaseRecognizer)

DEPENDENCIES:
- import pytesseract
- from PIL import Image

METHOD: recognize(image):
   # Convert numpy to PIL
   pil_img = Image.fromarray(image)
   
   # Configure Tesseract
   config = '--psm 7'  # Single line mode
   
   # Recognize
   data = pytesseract.image_to_data(pil_img, config=config, output_type=pytesseract.Output.DICT)
   
   # Extract text and confidence
   text = ' '.join(data['text'])
   confidences = [c for c in data['conf'] if c != -1]
   avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
   
   return RecognitionResult(text=text, confidence=avg_conf/100.0)

================================================================================
FILE: ocr/factory.py
================================================================================

PURPOSE: Factory pattern for creating OCR models

CLASS: OCRFactory

REGISTRIES:
DETECTOR_REGISTRY = {
    "paddle": PaddleDetector,
}

RECOGNIZER_REGISTRY = {
    "trocr": TrOCRRecognizer,
    "paddle": PaddleRecognizer,
    "tesseract": TesseractRecognizer
}

METHODS:
@staticmethod
def create_detector(name: str, config: Dict) -> BaseDetector:
    if name not in DETECTOR_REGISTRY:
        raise ValueError(f"Unknown detector: {name}")
    return DETECTOR_REGISTRY[name](config)

@staticmethod
def create_recognizer(name: str, config: Dict) -> BaseRecognizer:
    if name not in RECOGNIZER_REGISTRY:
        raise ValueError(f"Unknown recognizer: {name}")
    return RECOGNIZER_REGISTRY[name](config)

@staticmethod
def list_available():
    return {
        'detectors': list(DETECTOR_REGISTRY.keys()),
        'recognizers': list(RECOGNIZER_REGISTRY.keys())
    }

================================================================================
FILE: ocr/config.py
================================================================================

PURPOSE: OCR-specific configuration

CLASS: OCRConfig

ATTRIBUTES:
# Detection
detection_model: str = "paddle"
detection_threshold: float = 0.6
detection_box_thresh: float = 0.5

# Recognition
recognition_model: str = "trocr"
recognition_threshold: float = 0.7
use_beam_search: bool = True
beam_width: int = 5

# TrOCR paths
trocr_encoder_path: str = "ocr/models/trocr/encoder.onnx"
trocr_decoder_path: str = "ocr/models/trocr/decoder.onnx"
trocr_vocab_path: str = "ocr/models/trocr/vocab.json"
trocr_merges_path: str = "ocr/models/trocr/merges.txt"

# Paddle paths
paddle_det_path: str = "vendor/PaddleOCR/inference_models/en_PP-OCRv4_det_infer"
paddle_rec_path: str = "vendor/PaddleOCR/inference_models/en_PP-OCRv4_rec_infer"

# Device
device: str = "cpu"  # or "cuda:0"

METHODS:
@classmethod
def load(cls, path: str):
    # Load from YAML/JSON

def validate(self):
    # Check paths exist

================================================================================
FILE: rules_engine/ledger_rules.py ⭐ CRITICAL
================================================================================

PURPOSE: Transform OCR text into structured Transaction objects

CLASS: LedgerParser

METHODS:
1. parse_transactions(
    recognized_texts: List[str],
    bounding_boxes: List[BoundingBox]
) -> List[Transaction]:
    \"\"\"
    Main parsing method.
    
    Process:
    1. Detect header row
    2. Identify column positions
    3. Parse each data row
    4. Return Transaction objects
    \"\"\"
    
    # Detect columns
    columns = self._detect_columns(recognized_texts, bounding_boxes)
    
    # Parse rows
    transactions = []
    for i, text in enumerate(recognized_texts):
        if self._is_header(text):
            continue
        
        txn = self._parse_row(text, bounding_boxes[i], columns)
        if txn:
            transactions.append(txn)
    
    return transactions

2. _detect_columns(texts, boxes) -> Dict[str, Tuple[int, int]]:
    \"\"\"
    Identify column positions from header/first rows.
    
    Returns:
        {
            'date': (x_start, x_end),
            'description': (x_start, x_end),
            'debit': (x_start, x_end),
            'credit': (x_start, x_end),
            'balance': (x_start, x_end)
        }
    
    Algorithm:
    1. Find header row (contains keywords)
    2. For each column keyword:
       - Find bbox with that text
       - Record X-position range
    3. Sort columns by X-position
    \"\"\"

3. _parse_row(text: str, bbox: BoundingBox, columns: Dict) -> Transaction:
    \"\"\"
    Parse single transaction row.
    
    Process:
    1. Assign text to columns based on X-position
    2. Extract date
    3. Extract amounts
    4. Extract description
    5. Create Transaction object
    \"\"\"
    
    # Determine which column this text belongs to
    x_pos = bbox.bbox[0][0]  # Left edge
    
    if columns['date'][0] <= x_pos < columns['date'][1]:
        date = self.parse_date(text)
    elif columns['description'][0] <= x_pos < columns['description'][1]:
        description = text
    # ... etc

4. parse_date(date_str: str) -> datetime:
    \"\"\"
    Parse date from various formats.
    
    Formats:
    - DD/MM/YYYY
    - DD-MM-YYYY
    - DD.MM.YYYY
    - DD MMM YYYY (15 Jan 2024)
    \"\"\"
    from dateutil.parser import parse
    try:
        return parse(date_str, dayfirst=True)
    except:
        return None

5. parse_amount(amount_str: str) -> Decimal:
    \"\"\"
    Parse currency amount.
    
    Process:
    1. Remove currency symbols: ₦, $, £, €
    2. Remove thousand separators: 1,234.56 → 1234.56
    3. Handle negative: (123), -123, 123 DR
    4. Convert to Decimal
    
    Examples:
    - "₦1,234.56" → Decimal('1234.56')
    - "(500.00)" → Decimal('-500.00')
    - "1234 DR" → Decimal('-1234.00')
    \"\"\"
    import re
    from decimal import Decimal
    
    # Remove currency symbols
    amount_str = re.sub(r'[₦$£€,]', '', amount_str)
    
    # Handle parentheses (negative)
    if '(' in amount_str:
        amount_str = amount_str.replace('(', '-').replace(')', '')
    
    # Handle DR/CR
    if 'DR' in amount_str.upper():
        amount_str = '-' + amount_str.replace('DR', '').replace('dr', '')
    
    amount_str = amount_str.strip()
    return Decimal(amount_str)

6. assign_category(description: str) -> TransactionCategory:
    \"\"\"
    Categorize transaction by description keywords.
    
    Rules:
    - SALARY, PAYROLL → INCOME
    - INVENTORY, STOCK → EXPENSE_INVENTORY
    - RENT, UTILITIES → EXPENSE_OPERATIONAL
    - TRANSFER, ATM → TRANSFER
    - FEE, CHARGE → FEE
    \"\"\"
    from schemas.ledger_schema import TransactionCategory
    
    desc_upper = description.upper()
    
    if any(kw in desc_upper for kw in ['SALARY', 'PAY', 'INCOME']):
        return TransactionCategory.INCOME
    # ... more rules
    
    return TransactionCategory.UNCATEGORIZED

================================================================================
FILE: rules_engine/validators.py
================================================================================

PURPOSE: Validate extracted transactions

CLASS: TransactionValidator

METHODS:
1. validate_transactions(txns: List[Transaction]) -> ValidationResult:
    errors = []
    warnings = []
    
    for txn in txns:
        errors.extend(self.validate_date(txn))
        errors.extend(self.validate_amount(txn))
    
    errors.extend(self.validate_balance_consistency(txns))
    errors.extend(self.detect_duplicates(txns))
    
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )

2. validate_balance_consistency(txns):
    \"\"\"Check opening + credits - debits = closing\"\"\"
    # Calculate running balance
    # Compare to stated balance
    # Flag discrepancies

3. detect_duplicates(txns):
    \"\"\"Find transactions with same date, amount, description\"\"\"

================================================================================
FILE: rules_engine/confidence.py
================================================================================

PURPOSE: Compute extraction confidence scores

CLASS: ConfidenceScorer

METHOD: compute_document_confidence(
    detection_boxes: List[BoundingBox],
    recognition_results: List[RecognitionResult],
    transactions: List[Transaction],
    validation_result: ValidationResult
) -> float:
    \"\"\"
    Combine confidences.
    
    Weights:
    - Detection: 20%
    - Recognition: 40%
    - Validation: 40%
    \"\"\"
    
    det_conf = sum(b.confidence for b in detection_boxes) / len(detection_boxes)
    rec_conf = sum(r.confidence for r in recognition_results) / len(recognition_results)
    val_conf = 1.0 if validation_result.valid else 0.5
    
    return 0.2 * det_conf + 0.4 * rec_conf + 0.4 * val_conf

================================================================================
FILE: schemas/api_models.py
================================================================================

From pydantic import BaseModel

class ProcessingOptions(BaseModel):
    recognizer: str = "trocr"
    use_beam_search: bool = True
    beam_width: int = 5

class ExtractRequest(BaseModel):
    # Handled via multipart/form-data
    options: Optional[ProcessingOptions] = None

class ExtractResponse(BaseModel):
    success: bool
    ledger: Optional[Dict] = None
    confidence: float
    processing_time: float
    warnings: List[str] = []
    error: Optional[str] = None

================================================================================
FILE: api/routes.py
================================================================================

from fastapi import FastAPI, UploadFile
from core.orchestrator import Orchestrator
from schemas.api_models import ExtractResponse

app = FastAPI()

@app.post("/api/v1/extract")
async def extract(file: UploadFile):
    # Load image
    contents = await file.read()
    image = image_loader.load_from_bytes(contents)
    
    # Process
    result = orchestrator.execute(image['image'])
    
    # Return
    return ExtractResponse(
        success=True,
        ledger=result.to_dict(),
        confidence=result.confidence,
        processing_time=elapsed
    )

================================================================================
END OF CONDENSED DEFINITIONS
================================================================================

All remaining files follow similar patterns.
Refer to complete definition files for full detail.
"""