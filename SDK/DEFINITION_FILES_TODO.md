"""
REMAINING .DEFINITION FILES TO CREATE

Each file should follow the pattern established in:
- preprocessing/image_loader.py.DEFINITION
- preprocessing/cropper.py.DEFINITION

Format for each definition:
1. PURPOSE - Single responsibility
2. DEPENDENCIES - Exact imports and pip packages
3. DATA STRUCTURES - Classes/dataclasses needed
4. CLASS/FUNCTIONS - Complete signatures
5. METHODS TO IMPLEMENT - Detailed specifications
6. ERROR HANDLING - Custom exceptions
7. USAGE EXAMPLE - Working code snippet
8. TESTING CHECKLIST - Unit tests to write
9. IMPLEMENTATION NOTES - Edge cases, algorithms
10. INTEGRATION POINTS - Who calls this, who it calls
11. PERFORMANCE CONSIDERATIONS - Benchmarks

================================================================================
PRIORITY ORDER FOR CREATION
================================================================================

HIGH PRIORITY (Core functionality):
1. ✅ preprocessing/image_loader.py.DEFINITION
2. ✅ preprocessing/cropper.py.DEFINITION
3. preprocessing/normalizer.py.DEFINITION
4. ocr/recognition/decoders.py.DEFINITION
5. ocr/recognition/trocr_recognizer.py.DEFINITION
6. ocr/detection/base_detector.py.DEFINITION
7. ocr/detection/paddle_detector.py.DEFINITION
8. ocr/recognition/base_recognizer.py.DEFINITION
9. rules_engine/ledger_rules.py.DEFINITION
10. schemas/ledger_schema.py.DEFINITION

MEDIUM PRIORITY (Supporting modules):
11. preprocessing/augmentations.py.DEFINITION
12. ocr/recognition/paddle_recognizer.py.DEFINITION
13. ocr/recognition/tesseract_recognizer.py.DEFINITION
14. ocr/factory.py.DEFINITION
15. rules_engine/validators.py.DEFINITION
16. rules_engine/confidence.py.DEFINITION
17. schemas/api_models.py.DEFINITION

LOW PRIORITY (API and training):
18. api/routes.py.DEFINITION
19. api/models.py.DEFINITION
20. api/middleware.py.DEFINITION
21. api/errors.py.DEFINITION
22. training/dataset.py.DEFINITION
23. training/train.py.DEFINITION

================================================================================
TEMPLATE FOR EACH .DEFINITION FILE
================================================================================

```
\"\"\"
FILE: <module_path>/<filename>.py
PURPOSE: <One sentence describing single responsibility>

RESPONSIBILITY:
<Detailed explanation of what this module does>

================================================================================
DEPENDENCIES
================================================================================
<Exact imports>
<pip install commands>

================================================================================
DATA STRUCTURES (if needed)
================================================================================
<@dataclass or TypedDict definitions>

================================================================================
CLASS: <ClassName>
================================================================================
<Class docstring and __init__>

================================================================================
METHODS TO IMPLEMENT
================================================================================
<Each method with:>
- Full signature with type hints
- Args description
- Returns description
- Detailed process/algorithm
- Edge cases

================================================================================
ERROR HANDLING
================================================================================
<Custom exceptions>
<Error handling patterns>

================================================================================
USAGE EXAMPLE
================================================================================
<Working code showing how to use the module>

================================================================================
TESTING CHECKLIST
================================================================================
<List of unit tests to write>

================================================================================
IMPLEMENTATION NOTES
================================================================================
<Algorithms, edge cases, performance tips>

================================================================================
INTEGRATION POINTS
================================================================================
- Called by: <modules>
- Calls: <modules>
- Input from: <modules>
- Output to: <modules>

================================================================================
PERFORMANCE CONSIDERATIONS (if relevant)
================================================================================
<Benchmarks, optimization tips>

================================================================================
END OF DEFINITION
================================================================================
```

================================================================================
NEXT STEPS
================================================================================

I'll create the remaining high-priority files now.
You can use these as templates to create the rest.

Each developer can:
1. Pick a .DEFINITION file
2. Read it completely
3. Implement according to spec
4. Write tests from checklist
5. Submit for review

NO coordination needed between developers - each file is independent!
"""