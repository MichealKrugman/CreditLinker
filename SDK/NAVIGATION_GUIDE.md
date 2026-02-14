# SDK COMPLETE NAVIGATION GUIDE

## 📚 START HERE

Welcome to the CreditLinker SDK! This guide helps you navigate all definition files and start implementing.

---

## 🎯 I WANT TO...

### **...Understand the SDK structure**
→ Read: `README.md`

### **...See what needs to be implemented**
→ Read: `FINAL_DEFINITION_STATUS.md`

### **...Find a specific file's definition**
→ Use the [Quick Reference](#quick-reference) below

### **...Start implementing**
→ Follow the [Implementation Workflow](#implementation-workflow) below

### **...Setup external dependencies (TrOCR, PaddleOCR)**
→ Read: `ocr/models/trocr/INSTRUCTION.txt` and `vendor/PADDLEOCR_SETUP.txt`

---

## 🗺️ QUICK REFERENCE

### **Full Definition Files** (Comprehensive)

| File | Location | What It Does |
|------|----------|--------------|
| **Core** |
| pipeline.py | core/pipeline.py.DEFINITION | Main extraction workflow |
| orchestrator.py | core/orchestrator.py.DEFINITION | Model management |
| config.py | core/config.py.DEFINITION | Configuration system |
| **Preprocessing** |
| image_loader.py | preprocessing/image_loader.py.DEFINITION | Load images from file/bytes/PDF |
| cropper.py | preprocessing/cropper.py.DEFINITION | Extract text regions, spatial sorting |
| normalizer.py | preprocessing/normalizer.py.DEFINITION | Resize, normalize for models |
| augmentations.py | preprocessing/augmentations.py.DEFINITION | Quality enhancement |
| **OCR** |
| base_detector.py | ocr/detection/base_detector.py.DEFINITION | Abstract detector interface |
| decoders.py | ocr/recognition/decoders.py.DEFINITION | Greedy/beam search |
| **Schemas** |
| ledger_schema.py | schemas/ledger_schema.py.DEFINITION | Transaction data models |

### **Condensed Definitions** (In ALL_REMAINING_DEFINITIONS.md)

All remaining files are defined in: `ALL_REMAINING_DEFINITIONS.md`

Find these sections:
- `ocr/detection/paddle_detector.py`
- `ocr/recognition/base_recognizer.py`
- `ocr/recognition/trocr_recognizer.py` ⭐ CRITICAL
- `ocr/recognition/paddle_recognizer.py`
- `ocr/recognition/tesseract_recognizer.py`
- `ocr/factory.py`
- `ocr/config.py`
- `rules_engine/ledger_rules.py` ⭐ CRITICAL
- `rules_engine/validators.py`
- `rules_engine/confidence.py`
- `schemas/api_models.py`
- `api/routes.py`

---

## 🛠️ IMPLEMENTATION WORKFLOW

### **Step 1: Choose Your File**

Pick based on priority (from `FINAL_DEFINITION_STATUS.md`):
- **Phase 1 (Foundation):** Start here if beginning project
- **Phase 2 (OCR):** Core OCR functionality
- **Phase 3 (Rules):** Transaction parsing
- **Phase 4 (Integration):** Wire everything together

### **Step 2: Read the Definition**

**If it has a `.DEFINITION` file:**
```bash
cat SDK/<module>/<filename>.DEFINITION
```
Example: `cat SDK/preprocessing/image_loader.py.DEFINITION`

**If it's in the condensed file:**
```bash
cat SDK/ALL_REMAINING_DEFINITIONS.md
# Search for your file's section
```

### **Step 3: Understand the Spec**

Every definition includes:
- ✅ **Purpose** - What this file does
- ✅ **Dependencies** - What to import
- ✅ **Data Structures** - Classes/dataclasses needed
- ✅ **Methods** - Full signatures with types
- ✅ **Algorithms** - Step-by-step process
- ✅ **Error Handling** - Exceptions to define
- ✅ **Usage Example** - Working code
- ✅ **Testing Checklist** - Tests to write
- ✅ **Integration Points** - Who calls this

### **Step 4: Implement**

Create the Python file and implement following the spec:

```python
# Example: SDK/preprocessing/image_loader.py

"""Load images from various sources."""

import numpy as np
from PIL import Image
import cv2

class ImageLoader:
    def __init__(self):
        pass
    
    def load_from_path(self, file_path: str) -> dict:
        # Implementation following definition...
        pass
```

### **Step 5: Write Tests**

Use the testing checklist from the definition:

```python
# tests/unit/test_image_loader.py

def test_load_jpeg():
    loader = ImageLoader()
    result = loader.load_from_path("test.jpg")
    assert result["image"].shape == (height, width, 3)
```

### **Step 6: Run Tests**

```bash
pytest tests/unit/test_image_loader.py -v
```

### **Step 7: Submit**

Once all tests pass, submit for review!

---

## 📖 DEFINITION FILE FORMATS

### **Format 1: Full .DEFINITION Files**

Located at: `SDK/<module>/<filename>.DEFINITION`

**Structure:**
```
FILE: <path>
PURPOSE: <one sentence>

RESPONSIBILITY: <detailed>

DEPENDENCIES:
- import statements
- pip install commands

DATA STRUCTURES:
- @dataclass definitions

CLASS/METHODS:
- Full signatures
- Detailed algorithms
- Edge cases

ERROR HANDLING:
- Custom exceptions

USAGE EXAMPLE:
- Working code

TESTING CHECKLIST:
- 8-10 specific tests

IMPLEMENTATION NOTES:
- Important details

INTEGRATION POINTS:
- Who calls this

PERFORMANCE:
- Benchmarks
```

**Example:** Open `preprocessing/image_loader.py.DEFINITION` to see.

### **Format 2: Condensed Definitions**

Located in: `ALL_REMAINING_DEFINITIONS.md`

**Structure:**
```
FILE: <path>

PURPOSE: <one sentence>

CLASS: <ClassName>

DEPENDENCIES: <key imports>

METHODS:
1. method_name(args) -> return:
   - Brief description
   - Key algorithm steps

INTEGRATION:
- Brief integration notes
```

Still complete enough for implementation!

---

## 🔍 FINDING SPECIFIC INFORMATION

### **"How do I load an image?"**
→ Read: `preprocessing/image_loader.py.DEFINITION`

### **"How do I detect text regions?"**
→ Read: `ocr/detection/base_detector.py.DEFINITION` then `ALL_REMAINING_DEFINITIONS.md` (paddle_detector section)

### **"How do I recognize text with TrOCR?"**
→ Read: `ocr/recognition/decoders.py.DEFINITION` then `ALL_REMAINING_DEFINITIONS.md` (trocr_recognizer section)

### **"How do I parse transactions from OCR text?"**
→ Read: `ALL_REMAINING_DEFINITIONS.md` (ledger_rules section)

### **"How do I validate extracted transactions?"**
→ Read: `ALL_REMAINING_DEFINITIONS.md` (validators section)

### **"How do I wire everything together?"**
→ Read: `core/pipeline.py.DEFINITION` and `core/orchestrator.py.DEFINITION`

### **"What are the data models?"**
→ Read: `schemas/ledger_schema.py.DEFINITION`

### **"How do I setup TrOCR models?"**
→ Read: `ocr/models/trocr/INSTRUCTION.txt`

### **"How do I setup PaddleOCR?"**
→ Read: `vendor/PADDLEOCR_SETUP.txt`

---

## 📊 PROGRESS TRACKING

### **Track Your Implementation**

Use this checklist as you implement:

**Foundation (Phase 1):**
- [ ] schemas/ledger_schema.py
- [ ] core/config.py
- [ ] preprocessing/image_loader.py
- [ ] preprocessing/normalizer.py

**OCR Pipeline (Phase 2):**
- [ ] preprocessing/cropper.py
- [ ] ocr/detection/base_detector.py
- [ ] ocr/detection/paddle_detector.py
- [ ] ocr/recognition/base_recognizer.py
- [ ] ocr/recognition/decoders.py
- [ ] ocr/recognition/trocr_recognizer.py ⭐
- [ ] ocr/factory.py

**Rules Engine (Phase 3):**
- [ ] rules_engine/ledger_rules.py ⭐
- [ ] rules_engine/validators.py
- [ ] rules_engine/confidence.py

**Integration (Phase 4):**
- [ ] core/orchestrator.py
- [ ] core/pipeline.py
- [ ] api/routes.py

**Enhancements (Phase 5):**
- [ ] preprocessing/augmentations.py
- [ ] ocr/recognition/paddle_recognizer.py
- [ ] ocr/recognition/tesseract_recognizer.py

---

## 🎓 LEARNING PATH

### **New to the Project?**

1. **Read**: `README.md` (15 min)
2. **Read**: `FINAL_DEFINITION_STATUS.md` (10 min)
3. **Read**: One full `.DEFINITION` file (e.g., `image_loader.py.DEFINITION`) (30 min)
4. **Implement**: That file (2-4 hours)
5. **Test**: Write and run tests (1-2 hours)
6. **Repeat**: Move to next file

### **Experienced Developer?**

1. **Skim**: `FINAL_DEFINITION_STATUS.md` (5 min)
2. **Pick**: High-priority file
3. **Read**: Definition (10-20 min)
4. **Implement**: Following spec (1-3 hours)
5. **Test**: Quick validation (30 min)
6. **Submit**: Move fast!

---

## 🆘 TROUBLESHOOTING

### **"I can't find the definition for X"**

1. Check if it has a `.DEFINITION` file: `ls SDK/<module>/*.DEFINITION`
2. If not, search in `ALL_REMAINING_DEFINITIONS.md`
3. If still not found, check `COMPLETE_DEFINITIONS.md` (original comprehensive doc)

### **"The algorithm is unclear"**

1. Check **Implementation Notes** section in definition
2. Look at **Usage Example** for concrete code
3. Check similar files for patterns
4. Review integration points (what calls this? what does it call?)

### **"I don't know what to test"**

Every definition has a **Testing Checklist** section with 8-10 specific tests to write.

### **"How do I know if I'm done?"**

Complete when:
- ✅ All methods implemented
- ✅ All tests from checklist written and passing
- ✅ Error handling matches spec
- ✅ Integration points work as expected

---

## 🗂️ FILE INDEX (Alphabetical)

| File | Type | Location |
|------|------|----------|
| api/routes.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| core/config.py | Full | core/config.py.DEFINITION |
| core/orchestrator.py | Full | core/orchestrator.py.DEFINITION |
| core/pipeline.py | Full | core/pipeline.py.DEFINITION |
| ocr/config.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/detection/base_detector.py | Full | ocr/detection/base_detector.py.DEFINITION |
| ocr/detection/paddle_detector.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/factory.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/recognition/base_recognizer.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/recognition/decoders.py | Full | ocr/recognition/decoders.py.DEFINITION |
| ocr/recognition/paddle_recognizer.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/recognition/tesseract_recognizer.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| ocr/recognition/trocr_recognizer.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| preprocessing/augmentations.py | Full | preprocessing/augmentations.py.DEFINITION |
| preprocessing/cropper.py | Full | preprocessing/cropper.py.DEFINITION |
| preprocessing/image_loader.py | Full | preprocessing/image_loader.py.DEFINITION |
| preprocessing/normalizer.py | Full | preprocessing/normalizer.py.DEFINITION |
| rules_engine/confidence.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| rules_engine/ledger_rules.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| rules_engine/validators.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| schemas/api_models.py | Condensed | ALL_REMAINING_DEFINITIONS.md |
| schemas/ledger_schema.py | Full | schemas/ledger_schema.py.DEFINITION |

---

## 📞 QUICK LINKS

- **Main README**: `README.md`
- **Status**: `FINAL_DEFINITION_STATUS.md`
- **All Condensed Definitions**: `ALL_REMAINING_DEFINITIONS.md`
- **Implementation Tracking**: `IMPLEMENTATION_STATUS.md`
- **Definition Index**: `DEFINITION_INDEX.md`
- **TrOCR Setup**: `ocr/models/trocr/INSTRUCTION.txt`
- **PaddleOCR Setup**: `vendor/PADDLEOCR_SETUP.txt`

---

## ✅ READY TO START?

1. **Setup environment**: Follow README.md
2. **Choose a file**: From FINAL_DEFINITION_STATUS.md
3. **Read definition**: Use this guide to find it
4. **Implement**: Follow the spec
5. **Test**: Use the checklist
6. **Submit**: Move to next file!

**Happy coding! 🚀**
