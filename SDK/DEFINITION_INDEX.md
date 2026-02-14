# SDK Definition Files - Complete Index

## ✅ COMPLETED DEFINITION FILES

### Preprocessing
1. ✅ **preprocessing/image_loader.py.DEFINITION**
   - Load images from file, bytes, PIL, base64, PDF
   - 8 methods, complete error handling, testing checklist

2. ✅ **preprocessing/cropper.py.DEFINITION**
   - Extract text regions, spatial sorting
   - 8 methods, BoundingBox dataclass, critical for transaction ordering

### Schemas
3. ✅ **schemas/ledger_schema.py.DEFINITION**
   - Transaction, LedgerPage, LedgerDocument models
   - Pydantic validation, JSON/CSV export
   - Complete data models for entire SDK

### Core (from earlier)
4. ✅ **core/pipeline.py.DEFINITION**
5. ✅ **core/orchestrator.py.DEFINITION**
6. ✅ **core/config.py.DEFINITION**

### API (from earlier)
7. ✅ **api/DEFINITION.md**

### External Assets
8. ✅ **ocr/models/trocr/INSTRUCTION.txt**
9. ✅ **vendor/PADDLEOCR_SETUP.txt**

---

## 📋 REMAINING FILES TO CREATE

Follow the same pattern as completed files. Each should include:
- PURPOSE, DEPENDENCIES, DATA STRUCTURES
- METHODS TO IMPLEMENT (with full signatures)
- ERROR HANDLING, USAGE EXAMPLE
- TESTING CHECKLIST, INTEGRATION POINTS

### HIGH PRIORITY (Implement First)

#### Preprocessing
10. ❌ **preprocessing/normalizer.py.DEFINITION**
    - Resize images for TrOCR (384x384)
    - Apply ImageNet normalization
    - Convert to tensor format
    - Methods: normalize(), resize_with_padding(), apply_normalization(), to_tensor()

11. ❌ **preprocessing/augmentations.py.DEFINITION**
    - Image quality enhancement
    - Methods: assess_quality(), denoise(), enhance_contrast(), binarize(), deskew()

#### OCR Detection
12. ❌ **ocr/detection/base_detector.py.DEFINITION**
    - Abstract base class for all detectors
    - Methods: detect(), post_process(), visualize()
    - BoundingBox output format

13. ❌ **ocr/detection/paddle_detector.py.DEFINITION**
    - PaddleOCR detection wrapper
    - Inherits BaseDetector
    - Methods: __init__(), detect(), _load_model()

#### OCR Recognition - CRITICAL
14. ❌ **ocr/recognition/base_recognizer.py.DEFINITION**
    - Abstract base class for all recognizers
    - Methods: recognize(), recognize_batch()
    - RecognitionResult output format

15. ❌ **ocr/recognition/decoders.py.DEFINITION** ⭐ VERY IMPORTANT
    - greedy_decode() - simple decoding
    - beam_search_decode() - better accuracy
    - Used by TrOCR recognizer

16. ❌ **ocr/recognition/trocr_recognizer.py.DEFINITION** ⭐ CRITICAL
    - Load encoder.onnx, decoder.onnx
    - ONNX Runtime inference
    - Methods: __init__(), recognize(), recognize_batch(), _preprocess(), _decode_tokens()
    - NO PyTorch dependency

17. ❌ **ocr/recognition/paddle_recognizer.py.DEFINITION**
    - PaddleOCR recognition wrapper
    - Fallback option
    - Inherits BaseRecognizer

18. ❌ **ocr/recognition/tesseract_recognizer.py.DEFINITION**
    - Tesseract OCR wrapper
    - Emergency fallback
    - Inherits BaseRecognizer

#### OCR Utilities
19. ❌ **ocr/factory.py.DEFINITION**
    - OCRFactory class
    - Methods: create_detector(), create_recognizer()
    - Registry pattern for model selection

20. ❌ **ocr/config.py.DEFINITION**
    - OCR-specific configuration
    - Detection/recognition thresholds
    - Model paths

#### Rules Engine - CRITICAL
21. ❌ **rules_engine/ledger_rules.py.DEFINITION** ⭐ CRITICAL
    - Transform OCR text → Transaction objects
    - Methods: parse_transactions(), detect_columns(), parse_date(), parse_amount()
    - Column detection heuristics

22. ❌ **rules_engine/validators.py.DEFINITION**
    - Validate extracted transactions
    - Methods: validate_transactions(), validate_date_format(), validate_balance_consistency()

23. ❌ **rules_engine/confidence.py.DEFINITION**
    - Compute extraction confidence
    - Methods: compute_document_confidence(), compute_detection_confidence()

### MEDIUM PRIORITY

#### Schemas
24. ❌ **schemas/api_models.py.DEFINITION**
    - ExtractRequest, ExtractResponse
    - Pydantic models for API

#### API Layer
25. ❌ **api/routes.py.DEFINITION**
    - FastAPI routes
    - POST /extract, POST /extract/batch, GET /health

26. ❌ **api/models.py.DEFINITION**
    - Request/response models (may merge with schemas/api_models.py)

27. ❌ **api/middleware.py.DEFINITION**
    - Authentication, rate limiting, CORS

28. ❌ **api/errors.py.DEFINITION**
    - Custom exceptions, error handlers

### LOW PRIORITY (Training/Development)

29. ❌ **training/dataset.py.DEFINITION**
    - LedgerDataset class for training
    - PyTorch Dataset implementation

30. ❌ **training/train.py.DEFINITION**
    - Training loop for fine-tuning TrOCR
    - Export to ONNX

31. ✅ **training/evaluate.py** (already exists - not .DEFINITION, actual code)

---

## 📝 HOW TO CREATE NEW DEFINITION FILES

### Template Structure
```
\"\"\"
FILE: <path>/<filename>.py
PURPOSE: <one sentence>

RESPONSIBILITY:
<detailed explanation>

================================================================================
DEPENDENCIES
================================================================================
<exact imports>
<pip install commands>

================================================================================
DATA STRUCTURES (if needed)
================================================================================
<dataclasses, TypedDict>

================================================================================
CLASS: <ClassName>
================================================================================
<class definition with __init__>

================================================================================
METHODS TO IMPLEMENT
================================================================================
<each method with:>
- Full signature with types
- Args/Returns documentation
- Detailed algorithm/process
- Edge cases

================================================================================
ERROR HANDLING
================================================================================
<custom exceptions>

================================================================================
USAGE EXAMPLE
================================================================================
<working code>

================================================================================
TESTING CHECKLIST
================================================================================
<unit tests to write>

================================================================================
IMPLEMENTATION NOTES
================================================================================
<algorithms, edge cases>

================================================================================
INTEGRATION POINTS
================================================================================
<who calls this, who it calls>

================================================================================
PERFORMANCE CONSIDERATIONS (if relevant)
================================================================================
<benchmarks>

================================================================================
END OF DEFINITION
================================================================================
\"\"\"
```

### Examples to Follow
- **preprocessing/image_loader.py.DEFINITION** - Most comprehensive
- **preprocessing/cropper.py.DEFINITION** - Good algorithm detail
- **schemas/ledger_schema.py.DEFINITION** - Pydantic models

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: Core Pipeline (Week 1)
1. schemas/ledger_schema.py ✅
2. preprocessing/image_loader.py ✅
3. preprocessing/normalizer.py
4. preprocessing/cropper.py ✅
5. ocr/detection/base_detector.py
6. ocr/detection/paddle_detector.py

### Phase 2: Recognition Engine (Week 2)
7. ocr/recognition/decoders.py ⭐
8. ocr/recognition/base_recognizer.py
9. ocr/recognition/trocr_recognizer.py ⭐
10. ocr/factory.py

### Phase 3: Rules Engine (Week 3)
11. rules_engine/ledger_rules.py ⭐
12. rules_engine/validators.py
13. rules_engine/confidence.py
14. core/pipeline.py integration

### Phase 4: API & Testing (Week 4)
15. api/routes.py
16. Complete testing
17. Documentation

---

## 📊 PROGRESS TRACKER

**Total Files:** 31
**Completed:** 9 (29%)
**Remaining:** 22 (71%)

**High Priority Remaining:** 14
**Medium Priority:** 4
**Low Priority:** 4

---

## 🎯 NEXT ACTIONS

1. **Create definition files** for high-priority items (#10-23)
2. **Assign to developers** once definitions complete
3. **Implement in parallel** (files are independent)
4. **Test individually** using checklists
5. **Integrate** into pipeline

---

## ✅ QUALITY CHECKLIST FOR NEW DEFINITIONS

Each .DEFINITION file must have:
- [ ] Clear single-line PURPOSE
- [ ] All dependencies listed with versions
- [ ] Complete method signatures with type hints
- [ ] Detailed algorithm/process for each method
- [ ] Error handling with custom exceptions
- [ ] Working usage example
- [ ] Comprehensive testing checklist
- [ ] Integration points documented
- [ ] Performance notes if relevant

---

**Create remaining definitions following established pattern.
Each file should be fully self-contained for independent development!**
