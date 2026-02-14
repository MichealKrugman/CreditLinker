# CreditLinker SDK - Complete Structure Reference

## Overview
This SDK extracts structured transaction data from financial documents (bank statements, ledgers) using OCR and business rules.

---

## Directory Structure

```
SDK/
├── api/                          API layer for platform integration
├── core/                         Core extraction pipeline
├── preprocessing/                Image preprocessing
├── ocr/                          OCR engines (detection + recognition)
│   ├── detection/
│   ├── recognition/
│   └── models/
│       └── trocr/               ← ONNX model files (see INSTRUCTION.txt)
├── rules_engine/                 Transaction parsing and validation
├── schemas/                      Data models
├── training/                     Model training (dev only)
├── vendor/                       External dependencies
│   └── PaddleOCR/               ← Cloned repository (see SETUP.txt)
├── COMPLETE_DEFINITIONS.md       ← Full file specifications
├── README.md                     ← This file
└── requirements.txt              ← Python dependencies
```

---

## Quick Start

### 1. Setup Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Setup PaddleOCR (for detection)
cd vendor/
git clone https://github.com/PaddlePaddle/PaddleOCR.git
cd PaddleOCR && git checkout release/2.7.3
# Download models - see vendor/PADDLEOCR_SETUP.txt

# Setup TrOCR (for recognition)
cd ocr/models/trocr/
# Download ONNX models - see INSTRUCTION.txt in that directory
```

### 2. Configure

```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

### 3. Run Extraction

```python
from SDK import Orchestrator, Config

# Load config
config = Config.load("config.yaml")

# Initialize orchestrator
orchestrator = Orchestrator(config)

# Register models
from SDK.ocr.detection.paddle_detector import PaddleDetector
from SDK.ocr.recognition.trocr_recognizer import TrOCRRecognizer

orchestrator.register_detector("paddle", PaddleDetector)
orchestrator.register_recognizer("trocr", TrOCRRecognizer)

# Process document
import cv2
image = cv2.imread("bank_statement.jpg")
result = orchestrator.execute(image)

# Access transactions
for transaction in result.transactions:
    print(f"{transaction.date}: {transaction.description} - ${transaction.amount}")
```

---

## File Definitions

All files have detailed specifications in **COMPLETE_DEFINITIONS.md**.

### Core Files (Must Implement)
- `core/pipeline.py` - Main extraction pipeline
- `core/orchestrator.py` - Model management and execution
- `core/config.py` - Configuration management

### Preprocessing Files
- `preprocessing/image_loader.py` - Load images from various sources
- `preprocessing/cropper.py` - Extract text regions
- `preprocessing/normalizer.py` - Normalize for model input
- `preprocessing/augmentations.py` - Image quality enhancement

### OCR Detection
- `ocr/detection/base_detector.py` - Abstract detector interface
- `ocr/detection/paddle_detector.py` - PaddleOCR detection implementation

### OCR Recognition
- `ocr/recognition/base_recognizer.py` - Abstract recognizer interface
- `ocr/recognition/paddle_recognizer.py` - PaddleOCR recognizer
- `ocr/recognition/tesseract_recognizer.py` - Tesseract fallback
- `ocr/recognition/trocr_recognizer.py` - TrOCR ONNX inference ⭐
- `ocr/recognition/decoders.py` - Text generation algorithms

### OCR Utilities
- `ocr/factory.py` - Model factory pattern
- `ocr/config.py` - OCR-specific configuration

### Rules Engine
- `rules_engine/ledger_rules.py` - Parse transactions from text
- `rules_engine/validators.py` - Validate extracted data
- `rules_engine/confidence.py` - Confidence scoring

### Data Models
- `schemas/ledger_schema.py` - Transaction and ledger models
- `schemas/api_models.py` - Request/response models

### Training (Development Only)
- `training/dataset.py` - Dataset loading
- `training/train.py` - Model training
- `training/evaluate.py` - Model evaluation

---

## External Assets Required

### 1. TrOCR ONNX Models
Location: `ocr/models/trocr/`

Required files:
- encoder.onnx (~300MB)
- decoder.onnx (~400MB)
- vocab.json (~1MB)
- merges.txt (~500KB)

**See**: `ocr/models/trocr/INSTRUCTION.txt` for download instructions.

### 2. PaddleOCR Library
Location: `vendor/PaddleOCR/`

Required:
- Clone PaddleOCR repository
- Download detection models
- (Optional) Download recognition models

**See**: `vendor/PADDLEOCR_SETUP.txt` for setup instructions.

---

## Development Workflow

### Phase 1: Core Infrastructure
1. Implement `core/config.py`
2. Implement `core/pipeline.py` (without models initially)
3. Implement `core/orchestrator.py`

### Phase 2: Preprocessing
1. Implement `preprocessing/image_loader.py`
2. Implement `preprocessing/normalizer.py`
3. Implement `preprocessing/cropper.py`
4. (Optional) Implement `preprocessing/augmentations.py`

### Phase 3: OCR Engines
1. Implement `ocr/detection/base_detector.py`
2. Implement `ocr/detection/paddle_detector.py`
3. Implement `ocr/recognition/base_recognizer.py`
4. Implement `ocr/recognition/trocr_recognizer.py`
5. Implement `ocr/recognition/decoders.py`
6. Implement `ocr/factory.py`

### Phase 4: Rules Engine
1. Implement `schemas/ledger_schema.py`
2. Implement `rules_engine/ledger_rules.py`
3. Implement `rules_engine/validators.py`
4. Implement `rules_engine/confidence.py`

### Phase 5: Integration
1. Wire all components in `core/pipeline.py`
2. Test end-to-end extraction
3. Tune thresholds and parameters

### Phase 6: API Layer
1. Implement `api/routes.py`
2. Implement `api/models.py`
3. Deploy service

---

## Testing Strategy

### Unit Tests
Test each module independently:
```bash
pytest tests/unit/test_pipeline.py
pytest tests/unit/test_cropper.py
pytest tests/unit/test_trocr_recognizer.py
```

### Integration Tests
Test full pipeline:
```bash
pytest tests/integration/test_full_extraction.py
```

### Test Data
Create test dataset:
```
tests/data/
├── images/
│   ├── statement1.jpg
│   ├── statement2.pdf
│   └── ledger1.png
└── expected/
    ├── statement1.json
    ├── statement2.json
    └── ledger1.json
```

---

## Configuration

Example `config.yaml`:

```yaml
# Model selection
default_detector: paddle
default_recognizer: trocr

# Model paths
model_paths:
  trocr:
    encoder: ocr/models/trocr/encoder.onnx
    decoder: ocr/models/trocr/decoder.onnx
    vocab: ocr/models/trocr/vocab.json
    merges: ocr/models/trocr/merges.txt
  paddle:
    detection: vendor/PaddleOCR/inference_models/en_PP-OCRv4_det_infer

# Thresholds
detection_threshold: 0.6
recognition_threshold: 0.7

# Device
device: cuda:0  # or cpu

# Processing
batch_size: 8
use_beam_search: true
beam_width: 5

# Preprocessing
target_size: [384, 384]
apply_denoising: false

# Rules
currency: "₦"
date_format: "DD/MM/YYYY"
```

---

## Performance Benchmarks

Target performance on single-page bank statement:
- Detection: ~1 second
- Recognition: ~2 seconds (batch processing)
- Rules & Validation: ~0.5 seconds
- **Total: < 5 seconds**

Optimization tips:
- Use GPU for recognition (5-10x speedup)
- Batch process multiple images
- Cache loaded models
- Use ONNX Runtime optimizations

---

## Troubleshooting

### Common Issues

**Issue**: "No module named 'paddle'"
- **Solution**: Install paddlepaddle: `pip install paddlepaddle`

**Issue**: TrOCR models not found
- **Solution**: Download ONNX models following `ocr/models/trocr/INSTRUCTION.txt`

**Issue**: Poor OCR accuracy
- **Solution**: Check image quality, try preprocessing augmentations

**Issue**: Wrong transaction ordering
- **Solution**: Verify `cropper.py` spatial sorting logic

**Issue**: Out of memory
- **Solution**: Reduce `batch_size` in config, use CPU instead of GPU

---

## Contributing

1. Read `COMPLETE_DEFINITIONS.md` for file specifications
2. Follow existing code structure
3. Add unit tests for new features
4. Update documentation

---

## License

See LICENSE file

---

## Support

For issues or questions:
- Check `COMPLETE_DEFINITIONS.md`
- Review `ocr/models/trocr/INSTRUCTION.txt` for TrOCR setup
- Review `vendor/PADDLEOCR_SETUP.txt` for PaddleOCR setup
- Open issue on project repository

---

**Next Steps**:
1. Setup external dependencies (TrOCR models, PaddleOCR)
2. Review `COMPLETE_DEFINITIONS.md` for implementation specs
3. Implement files following specifications
4. Test with sample bank statements
